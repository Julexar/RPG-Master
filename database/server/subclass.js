import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { Subclass } from '../global';
const query = psql.query;

class ServerSubclass {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_subclasses WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Server Subclasses found', 'Could not find any Subclasses registered for that Server in the Database!');
        }

        return Promise.all(
            results.map(async (serverSub) => {
                const dbSub = await Subclass.getOne({ id: serverSub.class_id }, { id: serverSub.sub_id });

                return {
                    id: serverSub.id,
                    class_id: serverSub.class_id,
                    sub_id: dbSub.id,
                    sub: dbSub,
                };
            })
        );
    }

    static async getOne(server, sub) {
        if (sub.id) {
            const results = await query('SELECT * FROM server_subclasses WHERE server_id = $1 AND id = $2', [server.id, sub.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Subclass not found', 'Could not find that Subclass registered for that Server in the Database!');
            }

            const serverSub = results[0];
            const dbSub = await Subclass.getOne({ id: serverSub.class_id }, { id: serverSub.sub_id });

            return {
                id: serverSub.id,
                class_id: serverSub.class_id,
                sub_id: dbSub.id,
                sub: dbSub,
            };
        }

        const dbSub = await Subclass.getOne({ id: sub.class_id }, { name: sub.name });
        const results = await query('SELECT * FROM server_subclasses WHERE server_id = $1 AND sub_id = $2', [server.id, dbSub.id]);

        if (results.length === 0) {
            throw new NotFoundError(
                'Server Subclass not found',
                'Could not find a Subclass with that name registered for that Server in the Database!'
            );
        }

        const serverSub = results[0];

        return {
            id: serverSub.id,
            class_id: serverSub.class_id,
            sub_id: dbSub.id,
            sub: dbSub,
        };
    }

    static async exists(server, sub) {
        if (sub.id) {
            const results = await query('SELECT * FROM server_subclasses WHERE server_id = $1 AND id = $2', [server.id, sub.id]);

            return results.length === 1;
        }

        const dbSub = await Subclass.getOne({ id: sub.class_id }, { name: sub.name });
        const results = await query('SELECT * FROM server_subclasses WHERE server_id = $1 AND sub_id = $2', [server.id, dbSub.id]);

        return results.length === 1;
    }

    static async add(server, sub) {
        if (await this.exists(server, sub)) {
            throw new DuplicateError('Duplicate Server Subclass', 'That Subclass has already been registered for that Server in the Database!');
        }

        const dbSub = await Subclass.getOne({ id: sub.class_id }, sub);
        const sql = 'INSERT INTO server_subclasses (server_id, class_id, sub_id) VALUES($1, $2, $3)';
        await query(sql, [server.id, sub.class_id, dbSub.id]);

        return 'Successfully registered Subclass for Server in Database';
    }

    static async remove(server, sub) {
        if (!(await this.exists(server, sub))) {
            throw new NotFoundError('Server Subclass not found', 'Could not find that Subclass registered for that Server in the Database!');
        }

        await query('DELETE FROM server_subclasses WHERE server_id = $1 AND id = $2', [server.id, sub.id]);

        return 'Successfully unregsitered Subclass from Server in Database';
    }
}

export { ServerSubclass };
