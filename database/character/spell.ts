import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Spell } from '..';
import { DBCharacter } from '.';
const query = psql.query;

interface CharSpell {
    id: bigint;
    char_id: bigint;
    spell_id: bigint;
    prepared: boolean;
    overwrites: JSON;
    deleted_at: Date | null;
}

interface AddSpell {
    name?: string;
    spell_id?: bigint;
    prepared: boolean;
}

class CharacterSpell {
    static async getAll(char: DBCharacter) {
        const results = await query('SELECT * FROM character_spells WHERE char_id = $1', [char.id]) as CharSpell[];

        if (results.length === 0) throw new NotFoundError('No Character Spells found', 'Could not find any Spells for that Character in the Database!');

        return await Promise.all(
            results.map(async (spell) => {
                if (spell.deleted_at) return;

                const dbSpell = await Spell.getOne({ id: spell.spell_id });

                return {
                    id: spell.id,
                    spell: dbSpell,
                    prepared: spell.prepared,
                    overwrites: spell.overwrites,
                    deleted_at: spell.deleted_at
                };
            })
        );
    }

    static async getOne(char: DBCharacter, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND id = $2', [char.id, spell.id]) as CharSpell[];

            if (results.length === 0) throw new NotFoundError('No Character Spell found', 'Could not find that Spell for that Character in the Database!');

            const charSpell = results[0];

            if (charSpell.deleted_at) throw new BadRequestError('Character Spell deleted', 'That Spell has been deleted from the Character in the Database!');

            const dbSpell = await Spell.getOne({ id: charSpell.spell_id });

            return {
                id: charSpell.id,
                spell: dbSpell,
                prepared: charSpell.prepared,
                overwrites: charSpell.overwrites,
                deleted_at: charSpell.deleted_at
            };
        }

        const dbSpell = await Spell.getOne({ name: spell.name });
        const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND spell_id = $2', [char.id, dbSpell.id]) as CharSpell[];

        if (results.length === 0) throw new NotFoundError('Character Spell not found', 'Could not find a Spell with that Name for that Character in the Database!');

        const charSpell = results[0];

        if (charSpell.deleted_at) throw new BadRequestError('Character Spell deleted', 'That Spell has been deleted from the Character in the Database!');

        return {
            id: charSpell.id,
            spell: dbSpell,
            prepared: charSpell.prepared,
            overwrites: charSpell.overwrites,
            deleted_at: charSpell.deleted_at
        };
    }

    static async exists(char: DBCharacter, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND id = $2', [char.id, spell.id]) as CharSpell[];

            return results.length === 1;
        }

        const dbSpell = await Spell.getOne({ name: spell.name });
        const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND spell_id = $2', [char.id, dbSpell.id]) as CharSpell[];

        return results.length === 1;
    }

    static async isDeleted(char: DBCharacter, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND id = $2', [char.id, spell.id]) as CharSpell[];

            return !!results[0].deleted_at;
        }

        const dbSpell = await Spell.getOne({ name: spell.name });
        const results = await query('SELECT * FROM character_spells WHERE char_id = $1 AND spell_id = $2', [char.id, dbSpell.id]) as CharSpell[];

        return !!results[0].deleted_at;
    }

    static async add(char: DBCharacter, spell: AddSpell) {
        if (await this.exists(char, spell)) throw new DuplicateError('Duplicate Character Spell', 'That Spell is already added to the Character in the Database!');
        
        const dbSpell = await Spell.getOne({ name: spell.name });
        const sql = 'INSERT INTO character_spells (char_id, spell_id, prepared) VALUES ($1, $2, $3)';
        await query(sql, [char.id, dbSpell.id, spell.prepared]);

        return 'Successfully added Spell to Character';
    }

    static async remove(char: DBCharacter, spell: { id: bigint }) {
        if (!await this.exists(char, spell)) throw new NotFoundError('Character Spell not found', 'Could not find that Spell for that Character in the Database!');

        if (await this.isDeleted(char, spell)) throw new BadRequestError('Character Spell deleted', 'The Spell you are trying to remove has already been deleted from the Character in the Database!');

        const sql = 'UPDATE character_spells SET deleted_at = $1 WHERE char_id = $2 AND id = $3';
        await query(sql, [Date.now(), char.id, spell.id]);

        return 'Successfully marked Spell as deleted for Character';
    }

    static async remove_final(char: DBCharacter, spell: { id: bigint }) {
        if (!await this.exists(char, spell)) throw new NotFoundError('Character Spell not found', 'Could not find that Spell for that Character in the Database!');

        const sql = 'DELETE FROM character_spells WHERE char_id = $1 AND id = $2';
        await query(sql, [char.id, spell.id]);

        return 'Successfully removed Spell from Character';
    }

    static async update(char: DBCharacter, spell: { id: bigint, prepared: boolean, overwrites?: JSON }) {
        if (!await this.exists(char, spell)) throw new NotFoundError('Character Spell not found', 'Could not find that Spell for that Character in the Database!');

        if (await this.isDeleted(char, spell)) throw new BadRequestError('Character Spell deleted', 'The Spell you are trying to update has already been deleted from the Character in the Database!');

        if (spell.overwrites) {
            const sql = 'UPDATE character_spells SET prepared = $1, overwrites = $2::JSON WHERE char_id = $3 AND id = $4';
            await query(sql, [spell.prepared, spell.overwrites, char.id, spell.id]);
        }

        const sql = 'UPDATE character_spells SET prepared = $1 WHERE char_id = $2 AND id = $3';
        await query(sql, [spell.prepared, char.id, spell.id]);

        return 'Successfully updated Spell for Character';
    }

    static async restore(char: DBCharacter, spell: { id: bigint }) {
        if (!await this.exists(char, spell)) throw new NotFoundError('Character Spell not found', 'Could not find that Spell for that Character in the Database!');

        if (!await this.isDeleted(char, spell)) throw new BadRequestError('Character Spell not deleted', 'The Spell you are trying to restore has not been deleted from the Character in the Database!');

        const sql = 'UPDATE character_spells SET deleted_at = NULL WHERE char_id = $1 AND id = $2';
        await query(sql, [char.id, spell.id]);

        return 'Successfully restored Spell for Character';
    }
}

export { CharacterSpell };