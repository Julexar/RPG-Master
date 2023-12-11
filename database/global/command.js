import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class Command {
    static async getAll(type) {
        const results = await query('SELECT * FROM commands WHERE type = $1', [type]);

        if (results.length === 0) {
            throw new NotFoundError('No Commands found', 'Could not find any Commands in the Database!');
        }

        return results;
    }

    static async getOne(command, type) {
        if (cmd.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [cmd.id]);

            if (results.length === 0) {
                throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM commands WHERE type = $1 AND name = $2', [type, command.name]);

        if (results.length === 0) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        return results[0];
    }

    static async exists(command, type) {
        if (command.id) {
            const results = await query('SELECT * FROM commands WHERE id = $1', [cmd.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM commands WHERE type = $1 AND name = $2', [type, command.name]);

        return results.length === 1;
    }

    static async add(command, type) {
        if (await this.exists(command, type)) {
            throw new DuplicateError('Duplicate Command', 'That Command already exists in the Database!');
        }

        const sql = 'INSERT INTO commands (type, name, enabled) VALUES($1, $2, $3)';
        await query(sql, [type, command.name, command.enabled]);

        return `Successfully added ${type} Command \"${command.name}\" to Database`;
    }

    static async remove(command, type) {
        if (!(await this.exists(command, type))) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        await query('DELETE FROM commands WHERE id = $1', [command.id]);

        return `Successfully removed ${type} Command \"${command.name}\" from Database`;
    }

    static async update(command, type) {
        if (!(await this.exists(command, type))) {
            throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');
        }

        const sql = 'UPDATE commands SET name = $1, enabled = $2 WHERE id = $3';
        await query(sql, [command.name, command.enabled, command.id]);

        return `Successfully updated ${type} Command \"${command.name}\" in Database`;
    }
}

export { Command };
