import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
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

                return {
                    id: servDmgtype.id,
                    server_id: server.id,
                    dmgtype_id: dbDmgtype.id,
                    name: dbDmgtype.name,
                    description: dbDmgtype.description,
                };
            })
        );
    }

    static async getOne(server, dmgtype) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');
            }

            const dbDmgtype = await Damagetype.getOne({ id: results[0].dmgtype_id });

            return {
                id: results[0].id,
                server_id: server.id,
                dmgtype_id: dbDmgtype.id,
                name: dbDmgtype.name,
                description: dbDmgtype.description,
            };
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]);

        if (results.length === 0) {
            throw new NotFoundError('Server Damagetype not found', 'Could not find a Damagetype with that name for that Server in the Database!');
        }

        return {
            id: results[0].id,
            server_id: server.id,
            dmgtype_id: dbDmgtype.id,
            name: dbDmgtype.name,
            description: dbDmgtype.description,
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
        if (await this.exists(server, dmgtype)) {
            throw new DuplicateError('Duplicate Server Damagetype', 'This Damagetype already exists for that Server in the Database!');
        }

        const sql = 'INSERT INTO server_damagetypes (server_id, dmgtype_id) VALUES ($1, $2)';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully added Damagetype to Server';
    }

    static async remove(server, dmgtype) {
        if (!(await this.exists(server, dmgtype))) {
            throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');
        }

        const sql = 'DELETE FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully removed Damagetype from Server';
    }
}

export { ServerDmgtype };
