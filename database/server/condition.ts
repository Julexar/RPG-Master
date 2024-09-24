import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Condition } from '..';
const query = psql.query;

interface DBServerCondition {
    id: bigint;
    server_id: bigint;
    condition_id: bigint;
    deleted_at: Date | null;
}

class ServerCondition {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_condition WHERE server_id = $1', [server.id]) as DBServerCondition[];

        if (results.length === 0) throw new NotFoundError('No Server Conditions found', 'Could not find any conditions for that Server in the Database!');

        return Promise.all(
            results.map(async (servCond) => {
                const dbCond = await Condition.getOne({ id: servCond.condition_id });

                if (servCond.deleted_at) return;

                return {
                    id: servCond.id,
                    server_id: server.id,
                    condition: dbCond,
                    deleted_at: servCond.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, condition: { id?: bigint; name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]) as DBServerCondition[];

            if (results.length === 0) throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

            const servCond = results[0];
            const dbCond = await Condition.getOne({ id: servCond.condition_id });

            if (servCond.deleted_at) throw new BadRequestError('Condition deleted', 'The condition you are trying to view has been deleted!')

            return {
                id: servCond.id,
                server_id: server.id,
                condition: dbCond,
                deleted_at: servCond.deleted_at
            };
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND condition_id = $2', [server.id, dbCond.id]) as DBServerCondition[];

        if (results.length === 0) throw new NotFoundError('Server Condition not found', 'Could not find a Condition with that name for that Server in the Database!');

        const servCond = results[0];

        return {
            id: servCond.id,
            server_id: server.id,
            condition: dbCond,
            deleted_at: servCond.deleted_at
        };
    }

    static async exists(server: Guild, condition: { id?: bigint; name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]) as DBServerCondition[];

            return results.length === 1;
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND condition_id = $2', [server.id, dbCond.id]) as DBServerCondition[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, condition: { id?: bigint; name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]) as DBServerCondition[];

            return !!results[0].deleted_at;
        }

        const dbCond = await Condition.getOne({ name: condition.name });
        const results = await query('SELECT * FROM server_conditions WHERE server_id = $1 AND condition_id = $2', [server.id, dbCond.id]) as DBServerCondition[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, condition: { name: string}) {
        if (await this.exists(server, condition)) throw new DuplicateError('Duplicate Server Condition', 'That condition already exists for that Server in the Database!');

        const dbCond = await Condition.getOne({ name: condition.name });
        await query('INSERT INTO server_conditions (server_id, condition_id) VALUES ($1, $2)', [server.id, dbCond.id]);

        return 'Successfully added Server Condition to Database';
    }

    static async remove_final(server: Guild, condition: { id: bigint}) {
        if (!(await this.exists(server, condition))) throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

        await query('DELETE FROM server_conditions WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

        return 'Successfully removed Server Condition from Database';
    }

    static async remove(server: Guild, condition: { id: bigint }) {
        if (!(await this.exists(server, condition))) throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

        if (await this.isDeleted(server, condition)) throw new BadRequestError('Server Condition deleted', 'The Server Condition you are trying to remove has already been deleted!');

        await query('UPDATE server_conditions SET deleted_at = $1 WHERE server_id = $1 AND id = $2', [Date.now(), server.id, condition.id]);

        return 'Successfully marked Server Condition as deleted in Database';
    }

    static async restore(server: Guild, condition: { id: bigint }) {
        if (!(await this.exists(server, condition))) throw new NotFoundError('Server Condition not found', 'Could not find that condition for that Server in the Database!');

        if (!(await this.isDeleted(server, condition))) throw new BadRequestError('Server Condition not deleted', 'The Server Condition you are trying to restore has not been deleted!');

        await query('UPDATE server_conditions SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, condition.id]);

        return 'Successfully restored Server Condition in Database';
    }
}

export { ServerCondition };
