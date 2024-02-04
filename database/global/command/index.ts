import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { CommandType } from './types.js';
const query = psql.query;

interface DBCommand {
    id: bigint;
    name: string;
    description: string;
    type_id: bigint;
    enabled: boolean;
}

interface AddCommand {
    name: string;
    description: string;
    enabled: boolean;
}

class Command {
    types: CommandType;
    constructor() {
        this.types = CommandType;
    }

    async getAll(type: { id?: bigint, name?: string }) {
        if (type.id) {
            const results = await query('SELECT * FROM commands WHERE type_id = $1', [type.id]) as DBCommand[];

            if (results.length === 0) throw new NotFoundError('No Commands found', 'Could not find any Commands in the Database!');

            return results;
        }

        const dbType = await CommandType.getOne(type);
        const results = await query('SELECT * FROM commands WHERE type_id = $1', [dbType.id]) as DBCommand[];

        if (results.length === 0) throw new NotFoundError('No Commands found', 'Could not find any Commands in the Database!');

        return results;
    }

    async getOne(command: { id?: bigint, name?: string }, type: { id?: bigint, name?: string }) {
        if (command.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [command.id]) as DBCommand[];

            if (results.length === 0) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

            return results[0];
        }

        const dbType = await CommandType.getOne(type);
        const results = await query('SELECT * FROM commands WHERE type_id = $1 AND name = $2', [dbType.id, command.name]) as DBCommand[];

        if (results.length === 0) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

        return results[0];
    }

    async exists(command: { id?: bigint, name?: string }, type: { id?: bigint, name?: string }) {
        if (command.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [command.id]) as DBCommand[];

            return results.length === 1;
        }

        const dbType = await CommandType.getOne(type);
        const results = await query('SELECT * FROM commands WHERE type_id = $1 AND name = $2', [dbType.id, command.name]) as DBCommand[];

        return results.length === 1;
    }

    async add(command: AddCommand, type: { id?: bigint, name?: string }) {
        if (await this.exists(command, type)) throw new DuplicateError('Duplicate Command', 'That Command already exists in the Database!');

        const dbType = await CommandType.getOne(type);
        const sql = 'INSERT INTO commands (type_id, name, description, enabled) VALUES($1, $2, $3, $4)';
        await query(sql, [dbType.id, command.name, command.description, command.enabled]);

        return `Successfully added ${dbType.name} \"${command.name}\" to Database`;
    }

    async remove(command: { id?: bigint, name?: string }, type: { id?: bigint, name?: string }) {
        if (!(await this.exists(command, type))) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

        await query('DELETE FROM commands WHERE id = $1', [command.id]);

        return `Successfully removed ${type.name} \"${command.name}\" from Database`;
    }

    async update(command: DBCommand, type: { id?: bigint, name?: string }) {
        if (!(await this.exists(command, type))) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

        const sql = 'UPDATE commands SET name = $1, description = $2, enabled = $3 WHERE id = $4';
        await query(sql, [command.name, command.description, command.enabled, command.id]);

        return `Successfully updated ${type.name} \"${command.name}\" in Database`;
    }
}

export { Command };