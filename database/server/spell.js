import { psql } from '../psql.js';
import { DuplicateError, NotFoundError, BadRequestError } from '../../custom/errors';
import { Spell } from '../global';
const query = psql.query;

class ServerSpell {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_spells WHERE server_id = $1', [server.id]);

        if (results.length === 0) throw new NotFoundError('No Spells found', 'Could not find any Spells in the Database!');

        return Promise.all(results.map(async (servSpell) => {
            const dbSpell = await Spell.getOne({id: servSpell.spell_id});

            if (servSpell.deleted_at) return;

            return {
                id: servSpell.id,
                server_id: server.id,
                spell: dbSpell,
                overwrites: servSpell.overwrites,
                deleted_at: servSpell.deleted_at
            }
        }));
    }

    static async getOne(server, spell) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]);

            if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

            const servSpell = results[0];
            const dbSpell = await Spell.getOne({id: servSpell.spell_id});

            if (servSpell.deleted_at) throw new BadRequestError('Spell deleted', 'The Spell you are trying to view has been deleted!');

            return {
                id: servSpell.id,
                server_id: server.id,
                spell: dbSpell,
                overwrites: servSpell.overwrites,
                deleted_at: servSpell.deleted_at
            }
        }

        const dbSpell = await Spell.getOne({name: spell.name})

        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]);

        if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find a Spell with that Name in the Database!');

        const servSpell = results[0];

        if (servSpell.deleted_at) throw new BadRequestError('Spell deleted', 'The Spell you are trying to view has been deleted!');

        return {
            id: servSpell.id,
            server_id: server.id,
            spell: dbSpell,
            overwrites: servSpell.overwrites,
            deleted_at: servSpell.deleted_at
        }
    }

    static async exists(server, spell) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]);

            return results.length === 1;
        }

        const dbSpell = await Spell.getOne({name: spell.name})

        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]);

        return results.length === 1;
    }

    static async isDeleted(server, spell) {
        if (spell.id) {
            const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND id = $2', [server.id, spell.id]);

            return !!results[0].deleted_at;
        }

        const dbSpell = await Spell.getOne({name: spell.name})

        const results = await query('SELECT * FROM server_spells WHERE server_id = $1 AND spell_id = $2', [server.id, dbSpell.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, spell) {
        if (await this.exists(server, spell)) throw new DuplicateError('Duplicate Spell', 'This Spell already exists in the Database!');

        const dbSpell = await Spell.getOne({name: spell.name});

        const sql = 'INSERT INTO server_spells (server_id, spell_id, overwrites) VALUES ($1, $2, $3)';
        await query(sql, [server.id, dbSpell.id, spell.overwrites]);

        return 'Successfully added Spell to Database';
    }

    static async remove(server, spell) {
        if (!(await this.exists(server, spell))) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        if (await this.isDeleted(server, spell)) throw new BadRequestError('Spell deleted', 'The Spell you are trying to delete has already been deleted!');

        const date = new Date();
        const sql = 'UPDATE server_spells SET deleted_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [date, server.id, spell.id]);

        return 'Successfully marked Spell as deleted in Database';
    }

    static async remove_final(server, spell) {
        if (!(await this.exists(server, spell))) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        const sql = 'DELETE FROM server_spells WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, spell.id]);

        return 'Successfully removed Spell from Database';
    }

    static async update(server, spell) {
        if (!(await this.exists(server, spell))) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        if (await this.isDeleted(server, spell)) throw new BadRequestError('Spell deleted', 'The Spell you are trying to update has been deleted!');

        const sql = 'UPDATE server_spells SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3';
        await query(sql, [spell.overwrites, server.id, spell.id]);

        return 'Successfully updated Spell in Database';
    }
}

export { ServerSpell };