import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { CommandType } from './types.js';
const query = psql.query;

class Command {
    constructor() {
        this.types = CommandType;
    }

    async getAll(type) {
        type = await CommandType.getOne(type);

        const results = await query('SELECT * FROM commands WHERE type_id = $1', [type.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Commands found', 'Could not find any Commands in the Database!');
        }

        return results;
    }

    async getOne(command, type) {
        type = await CommandType.getOne(type);

        if (cmd.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [cmd.id]);

            if (results.length === 0) {
                throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM commands WHERE type_id = $1 AND name = $2', [type.id, command.name]);

        if (results.length === 0) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        return results[0];
    }

    async exists(command, type) {
        type = await CommandType.getOne(type);

        if (command.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [cmd.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM commands WHERE type_id = $1 AND name = $2', [type.id, command.name]);

        return results.length === 1;
    }

    async add(command, type) {
        type = await CommandType.getOne(type);

        if (await this.exists(command, type)) {
            throw new DuplicateError('Duplicate Command', 'That Command already exists in the Database!');
        }

        const sql = 'INSERT INTO commands (type_id, name, enabled) VALUES($1, $2, $3)';
        await query(sql, [type.id, command.name, command.enabled]);

        return `Successfully added ${type.name} \"${command.name}\" to Database`;
    }

    async remove(command, type) {
        type = await CommandType.getOne(type);

        if (!(await this.exists(command, type))) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        await query('DELETE FROM commands WHERE id = $1', [command.id]);

        return `Successfully removed ${type.name} \"${command.name}\" from Database`;
    }

    async update(command, type) {
        type = await CommandType.getOne(type);

        if (!(await this.exists(command, type))) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        const sql = 'UPDATE commands SET name = $1, enabled = $2 WHERE id = $3';
        await query(sql, [command.name, command.enabled, command.id]);

        return `Successfully updated ${type.name} \"${command.name}\" in Database`;
    }
}

export { Command };
