import { psql } from '../psql.js';
import { NotFoundError } from '../../custom/errors';
const query = psql.query;

class CharacterStats {
    static async getAll(char) {
        const results = await query('SELECT * FROM character_stats WHERE char_id = $1', [char.id]);

        if (results.length === 0) throw new NotFoundError('No Character Stats found', 'Could not find any Stats for that Character in the Database!');

        return results;
    }

    static async getOne(char, stat) {
        if (stat.id) {
            const results = await query('SELECT * FROM character_stats WHERE char_id = $1 AND id = $2', [char.id, stat.id]);

            if (results.length === 0) throw new NotFoundError('Character Stat not found', 'Could not find that Stat for that Character in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM character_stats WHERE char_id = $1 AND key = $2', [char.id, stat.key]);

        if (results.length === 0) throw new NotFoundError('Character Stat not found', 'Could not find that Stat for that Character in the Database!');

        return results[0];
    }

    static async exists(char, stat) {
        if (stat.id) {
            const results = await query('SELECT * FROM character_stats WHERE char_id = $1 AND id = $2', [char.id, stat.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_stats WHERE char_id = $1 AND key = $2', [char.id, stat.key]);

        return results.length === 1;
    }

    static async setMultiple(char, stats) {
        try {
            const charStats = await this.getAll(char);

            stats = stats.filter((stat) => !stat.key.inlcudes(charStats.map((charStat) => charStat.key)));
            await Promise.all(stats.map(async (stat) => await this.setOne(char, stat)));
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            stats.map(async (stat) => {
                await this.setOne(char, stat);
            });
        }

        return 'Successfully added Character Stats to Database';
    }

    static async setOne(char, stat) {
        if (await this.exists(char, stat)) {
            await query('UPDATE character_stats SET value = $1 WHERE char_id = $2 AND key = $3', [stat.value, char.id, stat.key]);

            return 'Successfully updated Character Stat in Database';
        }

        const sql = 'INSERT INTO character_stats (char_id, key, value) VALUES($1, $2, $3)';
        await query(sql, [char.id, stat.key, stat.value]);

        return 'Successfully added Character Stat to Database';
    }

    static async remove(char, stat) {
        if (!(await this.exists(char, stat))) throw new NotFoundError('Character Stat not found', 'Could not find that Character Stat in the Database!');

        await query('DELETE FROM character_stats WHERE char_id = $1 AND key = $2', [char.id, stat.key]);

        return 'Successfully removed Character Stat from Database';
    }
}

export { CharacterStats };
