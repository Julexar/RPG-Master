import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBSense {
    id: number;
    name: string;
    key: string;
}

interface AddSense {
    name: string;
    key: string;
}

export class Sense {
    static async getAll() {
        const results = await query('SELECT * FROM senses') as DBSense[];

        if (results.length === 0) throw new NotFoundError('No Sense found', 'Could not find any Senses in the Database!');

        return results;
    }

    static async getOne(sense: { id?: number, name?: string, key?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM senses WHERE id = $1', [sense.id]) as DBSense[];

            if (results.length === 0) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

            return results[0];
        }

        if (sense.key) {
            const results = await query('SELECT * FROM senses WHERE key = $1', [sense.key]) as DBSense[];

            if (results.length === 0) throw new NotFoundError('Sense not found', 'Could not find a Sense with that Key in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM senses WHERE name = $1', [sense.name]) as DBSense[];

        if (results.length === 0) throw new NotFoundError('Sense not found', 'Could not find a Sense with that Name in the Database!');

        return results[0];
    }

    static async exists(sense: { id?: number, name?: string, key?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM senses WHERE id = $1', [sense.id]) as DBSense[];

            return results.length === 1;
        }

        if (sense.key) {
            const results = await query('SELECT * FROM senses WHERE key = $1', [sense.key]) as DBSense[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM senses WHERE name = $1', [sense.name]) as DBSense[];

        return results.length === 1;
    }

    static async add(sense: AddSense) {
        if (await this.exists(sense)) throw new DuplicateError('Sense already exists', 'A Sense with that Name already exists in the Database!');

        const sql = 'INSERT INTO senses (name, key) VALUES ($1, $2)';
        await query(sql, [sense.name, sense.key]);

        return 'Successfully added Sense to the Database';
    }

    static async remove(sense: { id: number }) {
        if (!await this.exists(sense)) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

        await query('DELETE FROM senses WHERE id = $1', [sense.id]);

        return 'Successfully removed Sense from the Database';
    }

    static async update(sense: { id: number, name: string, key: string }) {
        if (!await this.exists({ id: sense.id })) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

        const sql = 'UPDATE senses SET name = $1, key = $2 WHERE id = $3';
        await query(sql, [sense.name, sense.key, sense.id]);

        return 'Successfully updated Sense in the Database';
    }
}