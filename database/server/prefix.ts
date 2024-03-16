import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { config } from '../../config.ts';
const query = psql.query;

interface DBPrefix {
    server_id: bigint;
    prefix: string;
    deleted_at: Date | null;
}

class Prefix {
    static async getAll(server: Guild) {
        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1', [server.id]) as DBPrefix[];

        if (results.length === 0) {
            await this.setDefault(server);
            return [config.default_prefix];
        }

        return results.map(async dbPrefix => {
            if (dbPrefix.deleted_at) return;

            return dbPrefix.prefix;
        });
    }

    static async getOne(server: Guild, prefix: string) {
        if (await this.isDeleted(server, prefix)) throw new BadRequestError('Prefix deleted', 'The Prefix you are trying to view has been deleted!');

        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]) as DBPrefix[];

        if (results.length === 0) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        return results[0].prefix;
    }

    static async setDefault(server: Guild) {
        await query('INSERT INTO server_prefixes (server_id, prefix) VALUES ($1, $2)', [server.id, config.default_prefix]);

        return `Successfully added default Prefix \"${config.default_prefix}\" to Server \"${server.name}\"`;
    }

    static async exists(server: Guild, prefix: string) {
        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]) as DBPrefix[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, prefix: string) {
        const results = await query('SELECT * FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]) as DBPrefix[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, prefix: string) {
        if (await this.exists(server, prefix)) throw new DuplicateError('Duplicate Prefix', 'That Prefix already exists in the Database!');

        await query('INSERT INTO server_prefixes (server_id, prefix) VALUES ($1, $2)', [server.id, prefix]);

        return `Successfully added Prefix \"${prefix}\" to Server \"${server.name}\"`;
    }

    static async remove_final(server: Guild, prefix: string) {
        if (!(await this.exists(server, prefix))) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        if (!prefix) {
            await query('DELETE FROM server_prefixes WHERE server_id = $1', [server.id]);

            await this.setDefault(server);

            return `Successfully reset all prefixes of Server \"${server.name}\"`;
        }

        await query('DELETE FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]);

        return `Successfully removed Prefix \"${prefix}\" from Server \"${server.name}\"`;
    }

    static async remove(server: Guild, prefix: string) {
        if (!(await this.exists(server, prefix))) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        if (await this.isDeleted(server, prefix))
            throw new BadRequestError('Prefix deleted', 'The Prefix you are trying to delete has already been deleted!');

        await query('UPDATE server_prefixes SET deleted_at = $1 WHERE server_id = $2 AND prefix = $3', [Date.now(), server.id, prefix]);

        return `Successfully removed Prefix \"${prefix}\" from Server \"${server.name}\"`;
    }

    static async restore(server: Guild, prefix: string) {
        if (!(await this.exists(server, prefix))) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        if (!await this.isDeleted(server, prefix)) throw new BadRequestError('Prefix not deleted', 'The Prefix you are trying to restore has not been deleted!');

        await query('UPDATE server_prefixes SET deleted_at = $1 WHERE server_id = $2 AND prefix = $3', [null, server.id, prefix]);

        return `Successfully restored Prefix \"${prefix}\" to Server \"${server.name}\"`;
    }
}

export { Prefix };
