import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Spell } from '..';
const query = psql.query;

interface DBServerSpell {
    id: bigint;
    server_id: bigint;
    spell_id: bigint;
    overwrites: JSON;
    deleted_at: Date | null;
}

class ServerSpell {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_spells WHERE server_id = $1', [server.id]) as DBServerSpell[];

        if (results.length === 0) throw new NotFoundError('No Server Spells found', 'Could not find any Server Spells in the Database!');

        return results.map((spell) => {
            if (spell.deleted_at) return;

            return spell;
        });
    }

    static async getOne(server: Guild, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]) as DBServerSpell[];

            if (results.length === 0) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Server Spell deleted', 'The Server Spell you are trying to view has been deleted!');

            return results[0];
        }

        const dbSpell = await Spell.getOne(spell);
        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]) as DBServerSpell[];

        if (results.length === 0) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Server Spell deleted', 'The Server Spell you are trying to view has been deleted!');

        return results[0];
    }

    static async exists(server: Guild, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]) as DBServerSpell[];

            return results.length === 1;
        }

        const dbSpell = await Spell.getOne(spell);
        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]) as DBServerSpell[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, spell: { id?: bigint, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]) as DBServerSpell[];

            return !!results[0].deleted_at;
        }

        const dbSpell = await Spell.getOne(spell);
        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]) as DBServerSpell[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, spell: { id?: bigint, name?: string }) {
        if (await this.exists(server, spell)) throw new DuplicateError('Server Spell already exists', 'The Server Spell you are trying to add already exists in the Database!');

        const dbSpell = await Spell.getOne(spell);
        await query('INSERT INTO server_spells (server_id, spell_id) VALUES ($1, $2)', [server.id, dbSpell.id]);

        return 'Successfully added Server Spell to Database';
    }

    static async remove(server: Guild, spell: { id: bigint }) {
        if (!await this.exists(server, spell)) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

        if (await this.isDeleted(server, spell)) throw new BadRequestError('Server Spell already deleted', 'The Server Spell you are trying to remove has already been deleted!');

        await query('UPDATE server_spells SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, spell.id]);

        return 'Successfully marked Server Spell as deleted in Database';
    }

    static async remove_final(server: Guild, spell: { id: bigint }) {
        if (!await this.exists(server, spell)) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

        await query('DELETE FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]);

        return 'Successfully removed Server Spell from Database';
    }

    static async update(server: Guild, spell: DBServerSpell) {
        if (!await this.exists(server, { id: spell.id })) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

        if (await this.isDeleted(server, { id: spell.id })) throw new BadRequestError('Server Spell already deleted', 'The Server Spell you are trying to update has already been deleted!');

        await query('UPDATE server_spells SET overwrites = $1 WHERE server_id = $2 AND id = $3', [spell.overwrites, server.id, spell.id]);

        return 'Successfully updated Server Spell in Database';
    }

    static async restore(server: Guild, spell: { id: bigint }) {
        if (!await this.exists(server, spell)) throw new NotFoundError('Server Spell not found', 'Could not find that Server Spell in the Database!');

        if (!await this.isDeleted(server, spell)) throw new BadRequestError('Server Spell not deleted', 'The Server Spell you are trying to restore has not been deleted!');

        await query('UPDATE server_spells SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [null, server.id, spell.id]);

        return 'Successfully restored Server Spell in Database';
    }
}

export { ServerSpell };