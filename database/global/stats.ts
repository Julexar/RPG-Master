import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBStats {
    id: number;
    name: string;
    key: string;
}

interface AddStats {
    name: string;
    key: string;
}

export class Stats {
    static async getAll() {
        const results = await query('SELECT * FROM stats') as DBStats[];

        if (results.length === 0) throw new NotFoundError('No Stats found', 'Could not find any Stats in the Database!');

        return results;
    }

    static async getOne(stats: { id?: number, name?: string, key?: string }) {
        if (stats.id) {
            const results = await query('SELECT * FROM stats WHERE id = $1', [stats.id]) as DBStats[];

            if (results.length === 0) throw new NotFoundError('Stats not found', 'Could not find that Stats in the Database!');

            return results[0];
        }

        if (stats.key) {
            const results = await query('SELECT * FROM stats WHERE key = $1', [stats.key]) as DBStats[];

            if (results.length === 0) throw new NotFoundError('Stats not found', 'Could not find a Stats with that Key in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM stats WHERE name = $1', [stats.name]) as DBStats[];

        if (results.length === 0) throw new NotFoundError('Stats not found', 'Could not find a Stats with that Name in the Database!');

        return results[0];
    }

    static async exists(stats: { id?: number, name?: string, key?: string }) {
        if (stats.id) {
            const results = await query('SELECT * FROM stats WHERE id = $1', [stats.id]) as DBStats[];

            return results.length === 1;
        }

        if (stats.key) {
            const results = await query('SELECT * FROM stats WHERE key = $1', [stats.key]) as DBStats[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM stats WHERE name = $1', [stats.name]) as DBStats[];

        return results.length === 1;
    }

    static async add(stats: AddStats) {
        if (await this.exists(stats)) throw new DuplicateError('Stats already exists', 'A Stats with that Name or Key already exists in the Database!');

        const sql = 'INSERT INTO stats (name, key) VALUES ($1, $2)';
        await query(sql, [stats.name, stats.key]);

        return 'Successfully added Stats to the Database';
    }

    static async remove(stats: { id: number }) {
        if (!await this.exists({ id: stats.id })) throw new NotFoundError('Stats not found', 'Could not find that Stats in the Database!');

        const sql = 'DELETE FROM stats WHERE id = $1';
        await query(sql, [stats.id]);

        return 'Successfully removed Stats from the Database';
    }

    static async update(stats: DBStats) {
        if (!await this.exists({ id: stats.id })) throw new NotFoundError('Stats not found', 'Could not find that Stats in the Database!');

        const sql = 'UPDATE stats SET name = $1, key = $2 WHERE id = $3';
        await query(sql, [stats.name, stats.key, stats.id]);

        return 'Successfully updated Stats in Database';
    }
}