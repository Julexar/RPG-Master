import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Damagetype } from '../global';
const query = psql.query;

class ServerDmgtype {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Server Damagetypes found', 'Could not find any Damagetypes for that Server in the Database!');
        }

        return Promise.all(
            results.map(async (servDmgtype) => {
                const dbDmgtype = await Damagetype.getOne({ id: servDmgtype.dmgtype_id });

                if (servDmgtype.deleted_at) return;

                return {
                    id: servDmgtype.id,
                    server_id: server.id,
                    dmgtype: dbDmgtype,
                    deleted_at: servDmgtype.deleted_at
                };
            })
        );
    }

    static async getOne(server, dmgtype) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]);

            if (results.length === 0) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

            const servDmgtype = results[0];
            const dbDmgtype = await Damagetype.getOne({ id: servDmgtype.dmgtype_id });

            if (servDmgtype.deleted_at) throw new BadRequestError('Damagetype deleted', 'The Damagetype you are trying to view has been deleted!')

            return {
                id: servDmgtype.id,
                server_id: server.id,
                dmgtype: dbDmgtype,
                deleted_at: servDmgtype.deleted_at
            };
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]);

        if (results.length === 0) throw new NotFoundError('Server Damagetype not found', 'Could not find a Damagetype with that name for that Server in the Database!');

        const servDmgtype = results[0];

        if (servDmgtype.deleted_at) throw new BadRequestError('Damagetype deleted', 'The Damagetype you are trying to view has been deleted!')

        return {
            id: servDmgtype.id,
            server_id: server.id,
            dmgtype: dbDmgtype,
            deleted_at: servDmgtype.deleted_at
        };
    }

    static async exists(server, dmgtype) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]);

            return results.length === 1;
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]);

        return results.length === 1;
    }

    static async add(server, dmgtype) {
        if (await this.exists(server, dmgtype)) throw new DuplicateError('Duplicate Server Damagetype', 'This Damagetype already exists for that Server in the Database!');

        const sql = 'INSERT INTO server_damagetypes (server_id, dmgtype_id) VALUES ($1, $2)';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully added Damagetype to Server';
    }

    static async remove_final(server, dmgtype) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

        const sql = 'DELETE FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully removed Damagetype from Server';
    }

    static async remove(server, dmgtype) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

        const sql = 'UPDATE server_damagetypes SET deleted_at = $1 WHERE server_id = $2 AND dmgtype_id = $3';
        await query(sql, [Date.now(), server.id, dmgtype.id]);

        return 'Successfully marked Damagetype as deleted in Server';
    }

    static async restore(server, dmgtype) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');
        
        if (!(await this.getOne(server, dmgtype)).deleted_at) throw new BadRequestError('Damagetype not deleted', 'That Damagetype for that Server is not deleted!');

        const sql = 'UPDATE server_damagetypes SET deleted_at = NULL WHERE server_id = $1 AND dmgtype_id = $2';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully restored Damagetype in Server';
    }

    static async restore_all(server) {
        const sql = 'UPDATE server_damagetypes SET deleted_at = NULL WHERE server_id = $1';
        await query(sql, [server.id]);

        return 'Successfully restored all Damagetypes in Server';
    }
}

export { ServerDmgtype };
