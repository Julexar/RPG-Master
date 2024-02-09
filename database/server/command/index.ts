import { Guild } from 'discord.js';
import { psql } from '../../psql.ts';
import { Command } from '../../global';
import { ServerCommandRestriction } from './restriction.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
const query = psql.query;

interface DBServerCommand {
    id: bigint;
    server_id: bigint;
    command_id: bigint;
    type: string;
    enabled: boolean;
    restricted: boolean;
    deleted_at: Date | null;
}

interface AddServerCommand {
    name: string;
    type: string;
    enabled: boolean;
    restricted: boolean;
}

class servercommand {
    restrictions: typeof ServerCommandRestriction;
    constructor() {
        this.restrictions = ServerCommandRestriction;
    }

    async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1', [server.id]) as DBServerCommand[];

        if (results.length === 0) throw new NotFoundError('No Server Commands found', 'Could not find any Server Commands in the Database!');

        return Promise.all(
            results.map(async (servCmd) => {
                const dbCmd = await Command.getOne({ id: servCmd.command_id }, servCmd.type);

                if (servCmd.deleted_at) return;

                return {
                    id: servCmd.id,
                    server_id: servCmd.server_id,
                    command: dbCmd,
                    type: dbCmd.type,
                    enabled: servCmd.enabled !== dbCmd.enabled ? dbCmd.enabled : servCmd.enabled,
                    restricted: servCmd.restricted,
                    deleted_at: servCmd.deleted_at
                };
            })
        );
    }

    async getOne(server: Guild, command: { id?: bigint, command_id?: bigint, name?: string, type: string }) {
        if (command.id) {
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]) as DBServerCommand[];

            if (results.length === 0) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

            const servCmd = results[0];
            const dbCmd = await Command.getOne({ id: servCmd.command_id }, command.type);

            if (servCmd.deleted_at) throw new BadRequestError('Server Command deleted', 'The Server Command you are trying to view has been deleted in the Database!');

            return {
                id: servCmd.id,
                server_id: servCmd.server_id,
                command: dbCmd,
                type: dbCmd.type,
                enabled: servCmd.enabled !== dbCmd.enabled ? dbCmd.enabled : servCmd.enabled,
                restricted: servCmd.restricted,
                deleted_at: servCmd.deleted_at
            };
        }

        if (command.command_id) {
            const dbCmd = await Command.getOne({ id: command.command_id }, command.type);
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND command_id = $2', [server.id, dbCmd.id]) as DBServerCommand[];

            if (results.length === 0) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

            const servCmd = results[0];

            if (servCmd.deleted_at) throw new BadRequestError('Server Command deleted', 'The Server Command you are trying to view has been deleted in the Database!');

            return {
                id: servCmd.id,
                server_id: servCmd.server_id,
                command: dbCmd,
                type: dbCmd.type,
                enabled: servCmd.enabled !== dbCmd.enabled ? dbCmd.enabled : servCmd.enabled,
                restricted: servCmd.restricted,
                deleted_at: servCmd.deleted_at
            };
        }

        const dbCmd = await Command.getOne({ id: command.id }, command.type);
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND command_id = $2', [server.id, dbCmd.id]) as DBServerCommand[];

        if (results.length === 0) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        const servCmd = results[0];

        if (servCmd.deleted_at) throw new BadRequestError('Server Command deleted', 'The Server Command you are trying to view has been deleted in the Database!');

        return {
            id: servCmd.id,
            server_id: servCmd.server_id,
            command: dbCmd,
            type: dbCmd.type,
            enabled: servCmd.enabled !== dbCmd.enabled ? dbCmd.enabled : servCmd.enabled,
            restricted: servCmd.restricted,
            deleted_at: servCmd.deleted_at
        };
    }

    async exists(server: Guild, command: { id?: bigint, name?: string, type: string }) {
        if (command.id) {
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]) as DBServerCommand[];

            return results.length === 1;
        }

        const dbCmd = await Command.getOne({ name: command.name }, command.type);
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND command_id = $2', [server.id, dbCmd.id]) as DBServerCommand[];

        return results.length === 1;
    }

    async isDeleted(server: Guild, command: { id?: bigint, name?: string, type: string }) {
        if (command.id) {
            const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]) as DBServerCommand[];

            return !!results[0].deleted_at;
        }

        const dbCmd = await Command.getOne({ name: command.name }, command.type);
        const results = await query('SELECT * FROM server_commands WHERE server_id = $1 AND command_id = $2', [server.id, dbCmd.id]) as DBServerCommand[];

        return !!results[0].deleted_at;
    }

    async add(server: Guild, command: AddServerCommand) {
        if (await this.exists(server, command)) throw new DuplicateError('Duplicate Server Command', 'That Server Command already exists in the Database!');

        const dbCmd = await Command.getOne({ name: command.name }, command.type);

        const sql = 'INSERT INTO server_commands (server_id, command_id, enabled, restricted) VALUES($1, $2, $3, $4)';
        await query(sql, [server.id, dbCmd.id, command.enabled, command.restricted]);

        return `Successfully added Command \"${command.name}\" to Server in Database`;
    }

    async remove(server: Guild, command: { id: bigint, type: string }) {
        if (!(await this.exists(server, command))) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        if (await this.isDeleted(server, command)) throw new BadRequestError('Server Command already deleted', 'The Server Command you are trying to remove has already been deleted in the Database!');

        const sql = 'UPDATE server_commands SET deleted_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [Date.now(), server.id, command.id]);

        return 'Successfully marked Command as deleted for Server in Database';
    }

    async remove_final(server: Guild, command: { id: bigint, type: string }) {
        if (!(await this.exists(server, command))) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        await query('DELETE FROM server_commands WHERE server_id = $1 AND id = $2', [server.id, command.id]);

        return 'Successfully removed Command from Server in Database';
    }

    async restore(server: Guild, command: { id: bigint, type: string }) {
        if (!(await this.exists(server, command))) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        if (!(await this.isDeleted(server, command))) throw new BadRequestError('Server Command not deleted', 'The Server Command you are trying to restore has not been deleted in the Database!');

        const sql = 'UPDATE server_commands SET deleted_at = NULL WHERE server_id = $2 AND id = $3';
        await query(sql, [server.id, command.id]);

        return 'Successfully restored Command for Server in Database';
    }

    async toggle(server: Guild, command: { id: bigint, type: string }) {
        if (!(await this.exists(server, command))) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        await query('UPDATE server_commands SET enabled = NOT enabled WHERE server_id = $1 AND id = $2', [server.id, command.id]);

        return 'Successfully toggled Command for Server in Database';
    }

    async restrict(server: Guild, command: { id: bigint, type: string }) {
        if (!(await this.exists(server, command))) throw new NotFoundError('Server Command not found', 'Could not find that Server Command in the Database!');

        await query('UPDATE server_commands SET restricted = NOT restricted WHERE server_id = $1 AND id = $2', [server.id, command.id]);

        return `Successfully toggled restrictions of Command for Server in Database`;
    }
}

const ServerCommand = new servercommand();

export { ServerCommand };