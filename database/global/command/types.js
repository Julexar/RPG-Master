import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors/index.js';
const query = psql.query;

class CommandType {
    static async getAll() {
        const results = await query('SELECT * FROM command_types');

        if (results.length === 0) throw new NotFoundError('No Command Types found', 'Could not find any Command Types in the Database!');

        return results;
    }

    static async getOne(type) {
        if (!isNaN(type) || type.id) {
            const results = await query('SELECT * FROM command_types WHERE id = $1', [type || type.id]);

            if (results.length === 0) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM command_types WHERE key = $1', [type || type.key]);

        if (results.length === 0)
            throw new NotFoundError('Command Type not found', 'Could not find that Command Type based on that Key in the Database!');

        return results[0];
    }

    static async exists(type) {
        if (type.id) {
            const results = await query('SELECT * FROM command_types WHERE id = $1', [type || type.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM command_types WHERE key = $1', [type.key]);

        return results.length === 1;
    }

    static async add(type) {
        if (await this.exists(type)) throw new DuplicateError('Duplicate Command Type', 'That Command Type already exists in the Database!');

        const sql = 'INSERT INTO command_types (key, name) VALUES($1, $2)';
        await query(sql, [type.key, type.name]);

        return 'Successfully added Command Type to Database';
    }

    static async remove(type) {
        if (!(await this.exists(type))) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

        const sql = 'DELETE FROM command_types WHERE id = $1';
        await query(sql, [type.id]);

        return 'Successfully removed Command Type from Database';
    }
}

export { CommandType };
