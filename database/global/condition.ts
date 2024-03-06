import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBCondition {
    id: number;
    name: string;
    description: string;
}

interface AddCondition {
    name: string;
    description: string;
}

export class Condition {
    static async getAll() {
        const results = await query('SELECT * FROM conditions') as DBCondition[];

        if (results.length === 0) throw new NotFoundError('No Condition found', 'Could not find any Conditions in the Database!');

        return results;
    }

    static async getOne(condition: { id?: number, name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM conditions WHERE id = $1', [condition.id]) as DBCondition[];

            if (results.length === 0) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM conditions WHERE name = $1', [condition.name]) as DBCondition[];

        if (results.length === 0) throw new NotFoundError('Condition not found', 'Could not find a Condition with that Name in the Database!');

        return results[0];
    }

    static async exists(condition: { id?: number, name?: string }) {
        if (condition.id) {
            const results = await query('SELECT * FROM conditions WHERE id = $1', [condition.id]) as DBCondition[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM conditions WHERE name = $1', [condition.name]) as DBCondition[];

        return results.length === 1;
    }

    static async add(condition: AddCondition) {
        if (await this.exists(condition)) throw new DuplicateError('Condition already exists', 'A Condition with that Name already exists in the Database!');

        const sql = 'INSERT INTO conditions (name, description) VALUES ($1, $2)';
        await query(sql, [condition.name, condition.description]);

        return 'Successfully added Condition to the Database';
    }

    static async update(condition: DBCondition) {
        if (!(await this.exists({ id: condition.id }))) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

        const sql = 'UPDATE conditions SET name = $1, description = $2 WHERE id = $3';
        await query(sql, [condition.name, condition.description, condition.id]);

        return 'Successfully updated Condition in Database';
    }
}