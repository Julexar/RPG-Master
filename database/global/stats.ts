import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

interface DBStat {
    id: bigint;
    name: string;
    key: string;
}

class Stats {
    static async getAll() {
        const results = await query('SELECT * FROM stats') as DBStat[];

        if (results.length === 0) throw new NotFoundError('No Stats found', 'Could not find any Stats in the Database!');

        return results;
    }

    static async getOne(stat: { id?: bigint; name?: string; key?: string }) {
        if (stat.id) {
            const results = await query('SELECT * FROM stats WHERE id = $1', [stat.id]) as DBStat[];

            if (results.length === 0) throw new NotFoundError('Stat not found', 'Could not find that Stat in the Database!');

            return results[0];
        }

        if (stat.key) {
            const results = await query('SELECT * FROM stats WHERE key = $1', [stat.key]) as DBStat[];

            if (results.length === 0) throw new NotFoundError('Stat not found', 'Could not find a Stat with that key in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM stats WHERE name = $1', [stat.name]) as DBStat[];

        if (results.length === 0) throw new NotFoundError('Stat not found', 'Could not find a Stat with that name in the Database!');

        return results[0];
    }

    static async exists(stat: { id?: bigint; name?: string; key?: string }) {
        if (stat.id) {
            const results = await query('SELECT * FROM stats WHERE id = $1', [stat.id]) as DBStat[];

            return results.length === 1;
        }

        if (stat.key) {
            const results = await query('SELECT * FROM stats WHERE key = $1', [stat.key]) as DBStat[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM stats WHERE name = $1', [stat.name]) as DBStat[];

        return results.length === 1;
    }

    static async add(stat: { name: string; key: string }) {
        if (await this.exists(stat)) throw new DuplicateError('Duplicate Stat', 'That Stat already exists in the Database!');

        await query('INSERT INTO stats (name, key) VALUES($1, $2)', [stat.name, stat.key]);

        return 'Successfully added Stat to Database';
    }

    static async remove(stat: { id: bigint }) {
        if (!(await this.exists(stat))) throw new NotFoundError('Stat not found', 'Could not find that Stat in the Database!');

        await query('DELETE FROM stats WHERE id = $1', [stat.id]);

        return 'Successfully removed Stat from Database';
    }
}

export { Stats };
