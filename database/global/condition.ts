import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

interface DBCondition {
    id: bigint;
    name: string;
    description: string;
}

interface AddCondition {
    name: string;
    description: string;
}

class Condition {
    static async getAll() {
        const results = await query('SELECT * FROM conditions') as DBCondition[];

        if (results.length === 0) throw new NotFoundError('No conditions found', 'Could not find any Conditions in the Database!');

        return results;
    }

    static async getOne(condition: { id?: bigint; name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM conditions WHERE id = $1', [condition.id]) as DBCondition[];

            if (results.length === 0) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM conditions WHERE name = $1', [condition.name]) as DBCondition[];

        if (results.length === 0) throw new NotFoundError('Condition not found', 'Could not find a Condition with that name in the Database!');

        return results[0];
    }

    static async exists(condition: { id?: bigint; name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM conditions WHERE id = $1', [condition.id]) as DBCondition[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM conditions WHERE name = $1', [condition.name]) as DBCondition[];

        return results.length === 1;
    }

    static async add(condition: AddCondition) {
        if (await this.exists(condition)) throw new DuplicateError('Duplicate Condition', 'That Condition already exists in the Database!');

        await query('INSERT INTO conditions (name, description) VALUES($1, $2)', [condition.name, condition.description]);

        return 'Successfully added Condition to Database';
    }

    static async remove(condition: { id: bigint }) {
        if (!(await this.exists(condition))) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

        await query('DELETE FROM conditions WHERE id = $1', [condition.id]);

        return 'Successfully removed Condition from Database';
    }

    static async update(condition: DBCondition) {
        if (!(await this.exists(condition))) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

        const sql = 'UPDATE conditions SET name = $1, description = $2 WHERE id = $3';
        await query(sql, [condition.name, condition.description, condition.id]);

        return 'Successfully updated Condition in Database';
    }
}

export { Condition };