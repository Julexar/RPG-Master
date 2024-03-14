import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Class } from '../global';
const query = psql.query;

class ServerClass {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_classes WHERE server_id = $1', [server.id]);

        if (results.length === 0)
            throw new NotFoundError('No Server Classes found', 'Could not find any Classes registered for the Server in the Database!');

        return Promise.all(
            results.map(async servClass => {
                const dbClass = await Class.getOne({ id: servClass.class_id });

                if (servClass.deleted_at) return;

                return {
                    id: servClass.id,
                    server_id: server.id,
                    class_id: dbClass.id,
                    class: dbClass,
                    overwrites: servClass.overwrites,
                    deleted_at: servClass.deleted_at,
                };
            })
        );
    }

    static async getOne(server, clas) {
        if (clas.id) {
            const results = await query('SELECT * FROM server_classes WHERE server_id = $1 AND id = $2', [server.id, clas.id]);

            if (results.length === 0)
                throw new NotFoundError('Server Class not found', 'Could not find that Class registered for that Server in the Database!');

            const servClass = results[0];
            const dbClass = await Class.getOne({ id: servClass.class_id });

            if (servClass.deleted_at) throw new BadRequestError('Class deleted', 'The Class you are trying to view has been deleted!');

            return {
                id: servClass.id,
                server_id: server.id,
                class_id: dbClass.id,
                class: dbClass,
                overwrites: servClass.overwrites,
                deleted_at: servClass.deleted_at,
            };
        }

        const dbClass = await Class.getOne({ name: clas.name });
        const results = await query('SELECT * FROM server_classes WHERE server_id = $1 AND class_id = $2', [server.id, dbClass.id]);

        if (results.length === 0)
            throw new NotFoundError('Server Class not found', 'Could not find that Class with that name registered for that Server in the Database!');

        const servClass = results[0];

        if (servClass.deleted_at) throw new BadRequestError('Class deleted', 'The Class you are trying to view has been deleted!');

        return {
            id: servClass.id,
            server_id: server.id,
            class_id: dbClass.id,
            class: dbClass,
            overwrites: servClass.overwrites,
            deleted_at: servClass.deleted_at,
        };
    }

    static async exists(server, clas) {
        if (clas.id) {
            const results = await query('SELECT * FROM server_classes WHERE server_id = $1 AND id = $2', [server.id, clas.id]);

            return results.length === 1;
        }

        const dbClass = await Class.getOne({ name: clas.name });
        const results = await query('SELECT * FROM server_classes WHERE server_id = $1 AND class_id = $2', [server.id, dbClass.id]);

        return results.length === 1;
    }

    static async add(server, clas) {
        if (await this.exists(server, clas))
            throw new DuplicateError('Duplicate Server Class', 'That Class has already been registered for that Server in the Database!');

        const dbClass = await Class.getOne(clas);
        await query('INSERT INTO server_classes (server_id, class_id) VALUES($1, $2)', [server.id, dbClass.id]);

        return 'Successfully registered Class for Server in Database';
    }

    static async remove_final(server, clas) {
        if (!(await this.exists(server, clas)))
            throw new NotFoundError('Server Class not found', 'Could not find that Class registered for that Server in the Database!');

        await query('DELETE FROM server_classes WHERE server_id = $1 AND id = $2', [server.id, clas.id]);

        return 'Successfully unregistered Class from Server in Database';
    }

    static async remove(server, clas) {
        if (!(await this.exists(server, clas)))
            throw new NotFoundError('Server Class not found', 'Could not find that Class registered for that Server in the Database!');

        await query('UPDATE server_classes SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, clas.id]);

        return 'Successfully marked Class as deleted for Server in Database';
    }

    static async update(server, clas) {
        if (!(await this.exists(server, clas)))
            throw new NotFoundError('Server Class not found', 'Could not find that Class registered for that Server in the Database!');

        await query('UPDATE server_classes SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3', [clas.overwrites, server.id, clas.id]);

        return 'Successfully updated Class for Server in Database';
    }

    static async restore(server, clas) {
        if (!(await this.exists(server, clas)))
            throw new NotFoundError('Server Class not found', 'Could not find that Class registered for that Server in the Database!');

        if (!(await this.getOne(server, clas)).deleted_at)
            throw new BadRequestError('Class not deleted', 'That Class for that Server is not deleted!');

        await query('UPDATE server_classes SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, clas.id]);

        return 'Successfully restored Class for Server in Database';
    }

    static async restore_all(server) {
        await query('UPDATE server_classes SET deleted_at = NULL WHERE server_id = $1', [server.id]);

        return 'Successfully restored all Classes for Server in Database';
    }
}

export { ServerClass };
