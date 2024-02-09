import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface DBCommandType {
    id: bigint;
    name: string;
    key: string;
}

interface AddCommandType {
    name: string;
    key: string;
}

class CommandType {
    static async getAll() {
        const results = await query('SELECT * FROM command_types') as DBCommandType[];

        if (results.length === 0) throw new NotFoundError('No Command Types found', 'Could not find any Command Types in the Database!');

        return results;
    }

    static async getOne(type: { id?: bigint, key?: string }) {
        if (type.id) {
            const results = await query('SELECT * FROM command_types WHERE id = $1', [type.id]) as DBCommandType[];

            if (results.length === 0) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM command_types WHERE key = $1', [type.key]) as DBCommandType[];

        if (results.length === 0) throw new NotFoundError('Command Type not found', 'Could not find that Command Type based on that Key in the Database!');

        return results[0];
    }

    static async exists(type: { id?: bigint, key?: string }) {
        if (type.id) {
            const results = await query('SELECT * FROM command_types WHERE id = $1', [type.id]) as DBCommandType[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM command_types WHERE key = $1', [type.key]) as DBCommandType[];

        return results.length === 1;
    }

    static async add(type: AddCommandType) {
        if (await this.exists(type)) throw new DuplicateError('Duplicate Command Type', 'That Command Type already exists in the Database!');

        const sql = 'INSERT INTO command_types (key, name) VALUES($1, $2)';
        await query(sql, [type.key, type.name]);

        return 'Successfully added Command Type to Database';
    }

    static async remove(type: { id: bigint, key?: string }) {
        if (!await this.exists(type)) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

        const sql = 'DELETE FROM command_types WHERE id = $1';
        await query(sql, [type.id]);

        return 'Successfully removed Command Type from Database';
    }
}

export { CommandType };