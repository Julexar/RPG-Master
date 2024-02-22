import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors/index.js';
import { config } from '../../config.js';
const query = psql.query;

class Prefix {
    static async getAll(server) {
        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            await this.setDefault(server);
            return [config.default_prefix];
        }

        return results.map(async dbPrefix => {
            if (dbPrefix.deleted_at) return;

            return dbPrefix.prefix;
        });
    }

    static async getOne(server, prefix) {
        if (await this.isDeleted(server, prefix)) throw new BadRequestError('Prefix deleted', 'The Prefix you are trying to view has been deleted!');

        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]);

        if (results.length === 0) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        return results[0].prefix;
    }

    static async setDefault(server) {
        await query('INSERT INTO server_prefixes (server_id, prefix) VALUES ($1, $2)', [server.id, config.default_prefix]);

        return `Successfully added default Prefix \"${config.default_prefix}\" to Server \"${server.name}\"`;
    }

    static async exists(server, prefix) {
        const results = await query('SELECT prefix FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]);

        return results.length === 1;
    }

    static async isDeleted(server, prefix) {
        const results = await query('SELECT * FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]);

        return !!results[0].deleted_at;
    }

    static async add(server, prefix) {
        if (await this.exists(server, prefix)) throw new DuplicateError('Duplicate Prefix', 'That Prefix already exists in the Database!');

        await query('INSERT INTO server_prefixes (server_id, prefix) VALUES ($1, $2)', [server.id, prefix]);

        return `Successfully added Prefix \"${prefix}\" to Server \"${server.name}\"`;
    }

    static async remove_final(server, prefix) {
        if (!(await this.exists(server, prefix))) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        if (!prefix) {
            await query('DELETE FROM server_prefixes WHERE server_id = $1', [server.id]);

            await this.setDefault(server);

            return `Successfully reset all prefixes of Server \"${server.name}\"`;
        }

        await query('DELETE FROM server_prefixes WHERE server_id = $1 AND prefix = $2', [server.id, prefix]);

        return `Successfully removed Prefix \"${prefix}\" from Server \"${server.name}\"`;
    }

    static async remove(server, prefix) {
        if (!(await this.exists(server, prefix))) throw new NotFoundError('Prefix not found', 'Could not find that Prefix in the Database!');

        if (await this.isDeleted(server, prefix))
            throw new BadRequestError('Prefix deleted', 'The Prefix you are trying to delete has already been deleted!');

        await query('UPDATE server_prefixes SET deleted_at = $1 WHERE server_id = $2 AND prefix = $3', [Date.now(), server.id, prefix]);

        return `Successfully removed Prefix \"${prefix}\" from Server \"${server.name}\"`;
    }
}

export { Prefix };
