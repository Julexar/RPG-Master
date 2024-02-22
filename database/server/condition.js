import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Condition } from '../global';
const query = psql.query;

class ServerCondition {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_condition WHERE server_id = $1', [server.id]);

        if (results.rows.length === 0)
            throw new NotFoundError('No Server Conditions found', 'Could not find any conditions for that Server in the Database!');

        return Promise.all(
            results.map(async servCond => {
                const dbCond = await Condition.getOne({ id: servCond.cond_id });

                if (servCond.deleted_at) return;

                return {
                    id: servCond.id,
                    server_id: server.id,
                    condition: dbCond,
                    deleted_at: servCond.deleted_at,
                };
            })
        );
    }

    static async getOne(server, condition) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

            if (results.length === 0)
                throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

            const servCond = results[0];
            const dbCond = await Condition.getOne({ id: servCond.cond_id });

            if (servCond.deleted_at) throw new BadRequestError('Condition deleted', 'The condition you are trying to view has been deleted!');

            return {
                id: servCond.id,
                server_id: server.id,
                condition: dbCond,
                deleted_at: servCond.deleted_at,
            };
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND condition_id = $2', [server.id, dbCond.id]);

        if (results.length === 0) {
            throw new NotFoundError('Server Condition not found', 'Could not find a Condition with that name for that Server in the Database!');
        }

        const servCond = results[0];

        return {
            id: servCond.id,
            server_id: server.id,
            condition: dbCond,
            deleted_at: servCond.deleted_at,
        };
    }

    static async exists(server, condition) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

            return results.length > 0;
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND cond_id = $2', [server.id, dbCond.id]);

        return results.length > 0;
    }

    static async add(server, condition) {
        if (await this.exists(server, condition)) {
            throw new DuplicateError('Duplicate Server Condition', 'That condition already exists for that Server in the Database!');
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        await query('INSERT INTO server_conditions (server_id, condition_id) VALUES ($1, $2)', [server.id, dbCond.id]);

        return 'Successfully added Server Condition to Database';
    }

    static async remove_final(server, condition) {
        if (!(await this.exists(server, condition))) {
            throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');
        }

        await query('DELETE FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

        return 'Successfully removed Server Condition from Database';
    }

    static async remove(server, condition) {
        if (!(await this.exists(server, condition))) {
            throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');
        }

        await query('UPDATE server_conditions SET deleted_at = $1 WHERE server_id = $1 AND id = $2', [Date.now(), server.id, condition.id]);

        return 'Successfully marked Server Condition as deleted in Database';
    }

    static async restore(server, condition) {
        if (!(await this.exists(server, condition)))
            throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

        if (!(await this.getOne(server, condition)).deleted_at)
            throw new BadRequestError('Server Condition not deleted', 'That condition for that Server is not deleted!');

        await query('UPDATE server_conditions SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

        return 'Successfully restored Server Condition in Database';
    }

    static async restore_all(server) {
        await query('UPDATE server_conditions SET deleted_at = NULL WHERE server_id = $1', [server.id]);

        return 'Successfully restored all Server Conditions in Database';
    }
}

export { ServerCondition };
