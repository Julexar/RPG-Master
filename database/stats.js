import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class Stats {
    static async getAll() {
        const results = await query('SELECT * FROM stats');

        if (results.length === 0) {
            throw new NotFoundError('No Stats found', 'Could not find any Stats in the Database!');
        }

        return results;
    }

    static async getOne(stat) {
        if (stat.id) {
            const results = await this.query('SELECT * FROM stats WHERE id = $1', [stat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Stat not found', 'Could not find that Stat in the Database!');
            }

            return results[0];
        }

        if (stat.key) {
            const results = await this.query('SELECT * FROM stats WHERE key = $1', [stat.key]);

            if (results.length === 0) {
                throw new NotFoundError('Stat not found', 'Could not find a Stat with that key in the Database!');
            }

            return results[0];
        }

        const results = await this.query('SELECT * FROM stats WHERE name = $1', [stat.name]);

        if (results.length === 0) {
            throw new NotFoundError('Stat not found', 'Could not find a Stat with that name in the Database!');
        }

        return results[0];
    }

    static async exists(stat) {
        if (stat.id) {
            const results = await this.query('SELECT * FROM stats WHERE id = $1', [stat.id]);

            return results.length === 1;
        }

        if (stat.key) {
            const results = await this.query('SELECT * FROM stats WHERE key = $1', [stat.key]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM stats WHERE name = $1', [stat.name]);

        return results.length === 1;
    }

    static async add(stat) {
        if (await this.statExists(stat)) {
            throw new DuplicateError('Duplicate Stat', 'That Stat already exists in the Database!');
        }

        await this.query('INSERT INTO stats (name, key) VALUES($1, $2)', [stat.name, stat.key]);

        return 'Successfully added Stat to Database';
    }

    static async remove(stat) {
        if (!(await this.statExists(stat))) {
            throw new NotFoundError('Stat not found', 'Could not find that Stat in the Database!');
        }

        await this.query('DELETE FROM stats WHERE id = $1', [stat.id]);

        return 'Successfully removed Stat from Database';
    }
}

export { Stats };
