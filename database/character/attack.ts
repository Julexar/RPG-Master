import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Server } from '..';
const query = psql.query;

interface CharAttack {
    id: bigint;
    char_id: bigint;
    name: string;
    description: string;
    atk_stat: string;
    save_dc: bigint;
    save_stat: string;
    on_fail_dmg: string;
    damage: string;
    dmg_bonus: bigint;
    dmgtype_id: bigint;
    magic_bonus: bigint;
    proficient: boolean;
    deleted_at: Date | null;
}

interface AddCharAttack {
    name: string;
    description: string;
    atk_stat: string;
    save_dc: bigint;
    save_stat: string;
    on_fail_dmg: string;
    damage: string;
    dmg_bonus: bigint;
    dmgtype_id: bigint;
    magic_bonus: bigint;
    proficient: boolean;
}

class CharacterAttack {
    static async getAll(char: { id: bigint }) {
        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1', [char.id]) as CharAttack[];

        if (results.length === 0) throw new NotFoundError('No Attacks found', 'Could not find any Attacks for that Character in the Database!');

        return results.map((atk) => {
            if (atk.deleted_at) return;

            const dmgtype = Server.dmgtypes.getOne({ id: atk.dmgtype_id });

            return {
                id: atk.id,
                char_id: char.id,
                name: atk.name,
                description: atk.description,
                atk_stat: atk.atk_stat,
                save_dc: atk.save_dc,
                save_stat: atk.save_stat,
                on_fail_dmg: atk.on_fail_dmg,
                damage: atk.damage,
                dmg_bonus: atk.dmg_bonus,
                dmgtype: dmgtype,
                magic_bonus: atk.magic_bonus,
                proficient: atk.proficient,
                deleted_at: atk.deleted_at
            };
        });
    }

    static async getOne(char: { id: bigint }, atk: { id?: bigint; name?: string }) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]) as CharAttack[];

            if (results.length === 0) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Attack deleted', 'The Attack you are trying to view has been deleted!');

            const charAtk = results[0];
            const dmgtype = Server.dmgtypes.getOne({ id: charAtk.dmgtype_id });

            return {
                id: charAtk.id,
                char_id: char.id,
                name: charAtk.name,
                description: charAtk.description,
                atk_stat: charAtk.atk_stat,
                save_dc: charAtk.save_dc,
                save_stat: charAtk.save_stat,
                on_fail_dmg: charAtk.on_fail_dmg,
                damage: charAtk.damage,
                dmg_bonus: charAtk.dmg_bonus,
                dmgtype: dmgtype,
                magic_bonus: charAtk.magic_bonus,
                proficient: charAtk.proficient,
                deleted_at: charAtk.deleted_at
            }
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]) as CharAttack[];

        if (results.length === 0) throw new NotFoundError('Attack not found', 'Could not find an Attack with that name in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Attack deleted', 'The Attack you are trying to view has been deleted!');

        const charAtk = results[0];
        const dmgtype = Server.dmgtypes.getOne({ id: charAtk.dmgtype_id });

        return {
            id: charAtk.id,
            char_id: char.id,
            name: charAtk.name,
            description: charAtk.description,
            atk_stat: charAtk.atk_stat,
            save_dc: charAtk.save_dc,
            save_stat: charAtk.save_stat,
            on_fail_dmg: charAtk.on_fail_dmg,
            damage: charAtk.damage,
            dmg_bonus: charAtk.dmg_bonus,
            dmgtype: dmgtype,
            magic_bonus: charAtk.magic_bonus,
            proficient: charAtk.proficient,
            deleted_at: charAtk.deleted_at
        }
    }

    static async exists(char: { id: bigint }, atk: { id?: bigint; name?: string }) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]) as CharAttack[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]) as CharAttack[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, atk: { id?: bigint; name?: string }) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]) as CharAttack[];

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]) as CharAttack[];

        return !!results[0].deleted_at;
    }

    static async add(char: { id: bigint }, atk: AddCharAttack) {
        if (await this.exists(char, atk)) throw new DuplicateError('Duplicate Attack', 'An Attack with that name already exists for that Character!');

        const sql = 'INSERT INTO character_attacks (char_id, name, description, atk_stat, save_dc, save_stat, on_fail_dmg, damage, dmg_bonus, dmgtype_id, magic_bonus, proficient) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [
            char.id,
            atk.name,
            atk.description,
            atk.atk_stat,
            atk.save_dc,
            atk.save_stat,
            atk.on_fail_dmg,
            atk.damage,
            atk.dmg_bonus,
            atk.dmgtype_id,
            atk.magic_bonus,
            atk.proficient
        ]);

        return 'Successfully added Attack to Character in Database';
    }

    static async remove(char: { id: bigint }, atk: { id: bigint }) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        if (await this.isDeleted(char, atk)) throw new BadRequestError('Attack deleted', 'The Attack you are trying to remove has already been deleted!');

        await query('UPDATE character_attacks SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, atk.id]);

        return 'Successfully marked Attack as deleted for Character in Database';
    }

    static async remove_final(char: { id: bigint }, atk: { id: bigint }) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        await query('DELETE FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

        return 'Successfully removed Attack from Character in Database';
    }

    static async update(char: { id: bigint }, atk: CharAttack) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        if (await this.isDeleted(char, atk)) throw new BadRequestError('Attack deleted', 'The Attack you are trying to update has been deleted!');

        const sql = 'UPDATE character_attacks SET name = $1, description = $2, atk_stat = $3, save_dc = $4, save_stat = $5, on_fail_dmg = $6, damage = $7, dmg_bonus = $8, dmgtype_id = $9, magic_bonus = $10, proficient = $11 WHERE char_id = $12 AND id = $13';
        await query(sql, [
            atk.name,
            atk.description,
            atk.atk_stat,
            atk.save_dc,
            atk.save_stat,
            atk.on_fail_dmg,
            atk.damage,
            atk.dmg_bonus,
            atk.dmgtype_id,
            atk.magic_bonus,
            atk.proficient,
            char.id,
            atk.id
        ]);

        return 'Successfully updated Character Attack in Database';
    }

    static async restore(char: { id: bigint }, atk: { id: bigint }) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        if (!(await this.isDeleted(char, atk))) throw new BadRequestError('Attack not deleted', 'The Attack you are trying to restore has not been deleted!');

        await query('UPDATE character_attacks SET deleted_at = NULL WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

        return 'Successfully restored Character Attack in Database';
    }
}

export { CharacterAttack };
