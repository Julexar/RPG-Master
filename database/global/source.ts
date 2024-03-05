import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

interface DBSource {
    id: number;
    name: string;
    abrv: string;
}

interface AddSource {
    name: string;
    abrv: string;
}

class Source {
    static async getAll() {
        const results = await query('SELECT * FROM sources') as DBSource[];

        if (results.length === 0) throw new NotFoundError('No Sources found', 'Could not find any Sources in the Database!');

        return results;
    }

    static async getOne(source: { id?: number, name?: string, abrv?: string }) {
        if (source.id) {
            const results = await query('SELECT * FROM sources WHERE id = $1', [source.id]) as DBSource[];

            if (results.length === 0) throw new NotFoundError('Source not found', `Could not find Source with id: ${source.id} in the Database!`);

            return results[0];
        }

        if (source.abrv) {
            const results = await query('SELECT * FROM sources WHERE abrv = $1', [source.abrv]) as DBSource[];

            if (results.length === 0) throw new NotFoundError('Source not found', 'Could not find Source with that Abbreviation in the Database!');

            return results[0];
        }

        
        const results = await query('SELECT * FROM sources WHERE name = $1', [source.name]) as DBSource[];

        if (results.length === 0) throw new NotFoundError('Source not found', 'Could not find Source with that Name in the Database!');

        return results[0];
    }

    static async exists(source: { id?: number, name?: string, abrv?: string }) {
        if (source.id) {
            const results = await query('SELECT * FROM sources WHERE id = $1', [source.id]) as DBSource[];

            return results.length === 1;
        }

        if (source.abrv) {
            const results = await query('SELECT * FROM sources WHERE abrv = $1', [source.abrv]) as DBSource[];

            return results.length === 1;
        }

        
        const results = await query('SELECT * FROM sources WHERE name = $1', [source.name]) as DBSource[];

        return results.length === 1;
    }

    static async add(source: AddSource) {
        if (await this.exists(source)) throw new DuplicateError('Source already exists', 'That Source already exists in the Database!');

        const sql = 'INSERT INTO sources (name, abrv) VALUES ($1, $2)';
        await query(sql, [source.name, source.abrv]);

        return 'Successfully added Source to Database';
    }

    static async remove(source: { id: number }) {
        if (!await this.exists(source)) throw new NotFoundError('Source not found', `Could not find Source with id: ${source.id} in the Database!`);

        await query('DELETE FROM sources WHERE id = $1', [source.id]);

        return 'Successfully removed Source from Database';
    }

    static async update(source: DBSource) {
        if (!await this.exists(source)) throw new NotFoundError('Source not found', `Could not find Source with id: ${source.id} in the Database!`);

        const sql = 'UPDATE sources SET name = $1, abrv = $2 WHERE id = $3';
        await query(sql, [source.name, source.abrv, source.id]);

        return 'Successfully updated Source in Database';
    }
}

export { Source, DBSource };