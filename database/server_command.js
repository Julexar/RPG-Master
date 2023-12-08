import { psql } from './psql.js';
import { Command } from './command.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class ServerCommand {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Server Commands found', 'Could not find any Server Commands in the Database!');
        }

        return Promise.all(
            results.map(async (servCmd) => {
                const dbCmd = await Command.getOne({ id: servCmd.cmd_id }, 'slash');

                if (dbCmd && servCmd.enabled && !dbCmd.enabled) {
                    return {
                        id: servCmd.id,
                        cmd_id: dbCmd.id,
                        name: dbCmd.name,
                        type: dbCmd.type,
                        enabled: false,
                        restricted: servCmd.restricted,
                    };
                }

                return {
                    id: servCmd.id,
                    cmd_id: dbCmd.id,
                    name: dbCmd.name,
                    type: dbCmd.type,
                    enabled: servCmd.enabled,
                    restricted: servCmd.restricted,
                };
            })
        );
    }

    static async getOne(server, command) {
        if (command.id) {
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
            }

            const servCmd = results[0];
            const dbCmd = await Command.getOne({ id: servCmd.cmd_id }, 'slash');

            if (!dbCmd.enabled) {
                return {
                    id: servCmd.id,
                    cmd_id: dbCmd.id,
                    name: dbCmd.name,
                    type: dbCmd.type,
                    enabled: false,
                    restricted: servCmd.restricted,
                };
            }

            return {
                id: servCmd.id,
                cmd_id: dbCmd.id,
                name: dbCmd.name,
                type: dbCmd.type,
                enabled: servCmd.enabled,
                restricted: servCmd.restricted,
            };
        }

        if (command.cmd_id) {
            const dbCmd = await Command.getOne({ id: command.cmd_id }, 'slash');
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2', [server.id, dbCmd.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
            }

            const servCmd = results[0];

            if (!dbCmd.enabled) {
                return {
                    id: servCmd.id,
                    cmd_id: dbCmd.id,
                    name: dbCmd.name,
                    type: dbCmd.type,
                    enabled: false,
                    restricted: servCmd.restricted,
                };
            }

            return {
                id: servCmd.id,
                cmd_id: dbCmd.id,
                name: dbCmd.name,
                type: dbCmd.type,
                enabled: servCmd.enabled,
                restricted: servCmd.restricted,
            };
        }

        const dbCmd = await Command.getOne(command, command.type);
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2', [server.id, dbCmd.id]);

        if (results.length === 0) {
            throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
        }

        const servCmd = results[0];

        if (!dbCmd.enabled) {
            return {
                id: servCmd.id,
                cmd_id: dbCmd.id,
                name: dbCmd.name,
                type: dbCmd.type,
                enabled: false,
                restricted: servCmd.restricted,
            };
        }

        return {
            id: servCmd.id,
            cmd_id: dbCmd.id,
            name: dbCmd.name,
            type: dbCmd.type,
            enabled: servCmd.enabled,
            restricted: servCmd.restricted,
        };
    }

    static async exists(server, command) {
        if (command.id) {
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND cmd_id = $2', [server.id, command.cmd_id]);

        return results.length === 1;
    }

    static async add(server, command) {
        if (await this.exists(server, command)) {
            throw new DuplicateError('Duplicate Server Command', 'That Server Command already exists in the Database!');
        }

        if (!command.cmd_id && command.name) {
            const dbCmd = await Command.getOne({ name: command.name }, command.type);

            const sql = 'INSERT INTO server_commands (server_id, cmd_id, enabled) VALUES($1, $2, $3)';
            await query(sql, [server.id, dbCmd.id, command.enabled]);

            return `Successfully added Command \"${command.name}\" to Server \"${server.name}\" in Database`;
        }

        const dbCmd = await Command.getOne({ id: command.cmd_id }, 'slash');

        const sql = 'INSERT INTO server_commands (server_id, cmd_id, enabled) VALUES($1, $2, $3)';
        await query(sql, [server.id, dbCmd.id, command.enabled]);

        return `Successfully added Command \"${dbCmd.name}\" to Server \"${server.name}\" in Database`;
    }

    static async remove(server, command) {
        if (!(await this.exists(server, command))) {
            throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
        }

        await query('DELETE FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]);

        return `Successfully removed Command \"${command.name}\" from Server \"${server.name}\" in Database`;
    }

    static async toggle(server, command) {
        if (!(await this.exists(server, command))) {
            throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
        }

        await query('UPDATE server_commands SET enabled = $1 WHERE server_id = $2 AND id = $3', [!command.enabled, server.id, command.id]);

        const action = !command.enabled ? 'enabled' : 'disabled';
        return `Successfully ${action} Command \"${command.name}\" in Server \"${server.name}\"`;
    }

    static async restrict(server, command) {
        if (!(await this.exists(server, command))) {
            throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');
        }

        await query('UPDATE server_commands SET restricted = $1 WHERE server_id = $2 AND id = $3', [!command.restricted, server.id, command.id]);
        const action = !command.enabled ? 'enabled' : 'disabled';
        return `Successfully ${action} restrictions of Command \"${command.name}\" in Server \"${server.name}\"`;
    }
}

export { ServerCommand };
