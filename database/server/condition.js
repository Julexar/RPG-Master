import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { Condition } from '../global';
const query = psql.query;

class ServerCondition {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_condition WHERE server_id = $1', [server.id]);

        if (results.rows.length === 0) {
            throw new NotFoundError('No Server Conditions found', 'Could not find any conditions for that Server in the Database!');
        }

        return Promise.all(
            results.map(async (servCond) => {
                const dbCond = await Condition.getOne({ id: servCond.cond_id });

                return {
                    id: servCond.id,
                    server_id: server.id,
                    cond_id: dbCond.id,
                    name: dbCond.name,
                    description: dbCond.description,
                };
            })
        );
    }

    static async getOne(server, condition) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');
            }

            const dbCond = await Condition.getOne({ id: results[0].cond_id });

            return {
                id: results[0].id,
                server_id: server.id,
                cond_id: dbCond.id,
                name: dbCond.name,
                description: dbCond.description,
            };
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND cond_id = $2', [server.id, dbCond.id]);

        if (results.length === 0) {
            throw new NotFoundError('Server Condition not found', 'Could not find a Condition with that name for that Server in the Database!');
        }

        return {
            id: results[0].id,
            server_id: server.id,
            cond_id: dbCond.id,
            name: dbCond.name,
            description: dbCond.description,
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
        await query('INSERT INTO server_conditions (server_id, cond_id) VALUES ($1, $2)', [server.id, dbCond.id]);

        return 'Successfully added Server Condition to Database';
    }

    static async remove(server, condition) {
        if (!(await this.exists(server, condition))) {
            throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');
        }

        await query('DELETE FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

        return 'Successfully removed Server Condition from Database';
    }
}

export { ServerCondition };
