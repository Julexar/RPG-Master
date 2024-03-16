import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

interface DBSense {
    id: bigint;
    name: string;
}

class Senses {
    static async getAll() {
        const results = await query('SELECT * FROM senses') as DBSense[];

        if (results.length === 0) throw new NotFoundError('No Senses found', 'Could not find any Senses in the Database!');

        return results;
    }

    static async getOne(sense: { id?: bigint; name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM senses WHERE id = $1', [sense.id]) as DBSense[];

            if (results.length === 0) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM senses WHERE name = $1', [sense.name]) as DBSense[];

        if (results.length === 0) throw new NotFoundError('Sense not found', 'Could not find a Sense with that name in the Database!');

        return results[0];
    }

    static async exists(sense: { id?: bigint; name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM senses WHERE id = $1', [sense.id]) as DBSense[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM senses WHERE name = $1', [sense.name]) as DBSense[];

        return results.length === 1;
    }

    static async add(sense: { name: string }) {
        if (await this.exists(sense)) throw new DuplicateError('Duplicate Sense', 'That Sense already exists in the Database!');

        await query('INSERT INTO senses (name) VALUES($1)', [sense.name]);

        return 'Successfully added Sense to Database';
    }

    static async remove(sense: { id: bigint }) {
        if (!(await this.exists(sense))) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

        await query('DELETE FROM senses WHERE id = $1', [sense.id]);

        return 'Successfully removed Sense from Database';
    }
}

export { Senses };
