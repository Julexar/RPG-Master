import { psql } from '../../psql.ts';
import { NotFoundError } from '../../../custom/errors';
import { Stats } from '..';
const query = psql.query;

interface DBRaceStat {
    id: bigint;
    race_id: bigint;
    p1_stat: string;
    p1_stat2: string | null;
    p2_stat: string;
}

interface AddRaceStat {
    p1_stat: string;
    p1_stat2: string | null;
    p2_stat: string;
}

class RaceStats {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_stats WHERE race_id = $1', [race.id]) as DBRaceStat[];

        if (results.length === 0) throw new NotFoundError('No Race Stats found', 'Could not find any Stats for that Race in the Database!');

        return Promise.all(
            results.map(async (raceStat) => {
                const dbStat_p1 = await Stats.getOne({ key: raceStat.p1_stat });
                const dbStat_p2 = await Stats.getOne({ key: raceStat.p2_stat });
                const dbStat_p1_2 = raceStat.p1_stat2 ? await Stats.getOne({ key: raceStat.p1_stat2 }) : null;

                return {
                    id: raceStat.id,
                    race_id: race.id,
                    p1_stat: dbStat_p1,
                    p1_stat2: dbStat_p1_2,
                    p2_stat: dbStat_p2
                };
            })
        );
    }

    static async getOne(race: { id: bigint }, stat: { name?: string }) {
        if (!stat.name) {
            const results = await query('SELECT * FROM race_stats WHERE race_id = $1', [race.id]) as DBRaceStat[];

            if (results.length === 0) throw new NotFoundError('Race Stats not found', 'Could not find that Stat for that Race in the Database!');

            const raceStat = results[0];
            const dbStat_p1 = await Stats.getOne({ key: raceStat.p1_stat });
            const dbStat_p2 = await Stats.getOne({ key: raceStat.p2_stat });
            const dbStat_p1_2 = raceStat.p1_stat2 ? await Stats.getOne({ key: raceStat.p1_stat2 }) : null;

            return {
                id: raceStat.id,
                race_id: race.id,
                p1_stat: dbStat_p1,
                p1_stat2: dbStat_p1_2,
                p2_stat: dbStat_p2
            };
        }

        const dbStat = await Stats.getOne({ name: stat.name });
        const results = await query('SELECT * FROM race_stats WHERE race_id = $1 AND (p1_stat = $2 OR p1_stat2 = $2 OR p2_stat = $2)', [race.id, dbStat.key]) as DBRaceStat[];

        if (results.length === 0) throw new NotFoundError('Race Stat not found', 'That Race does not have that Stat in the Database!');

        const raceStat = results[0];
        const dbStat_p1 = await Stats.getOne({ key: raceStat.p1_stat });
        const dbStat_p2 = await Stats.getOne({ key: raceStat.p2_stat });
        const dbStat_p1_2 = raceStat.p1_stat2 ? await Stats.getOne({ key: raceStat.p1_stat2 }) : null;

        return {
            id: raceStat.id,
            race_id: race.id,
            p1_stat: dbStat_p1,
            p1_stat2: dbStat_p1_2,
            p2_stat: dbStat_p2
        };
    }

    static async exists(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_stats WHERE race_id = $1', [race.id]) as DBRaceStat[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, stat: AddRaceStat) {
        if (await this.exists(race)) {
            const sql = 'UPDATE race_stats SET p1_stat = $1, p1_stat2 = $2, p2_stat = $3 WHERE race_id = $4';
            await query(sql, [stat.p1_stat, stat.p1_stat2, stat.p2_stat])

            return 'Successfully updated Race Stats in Database';
        }

        const sql = 'INSERT INTO race_stats (race_id, p1_stat, p1_stat2, p2_stat) VALUES ($1, $2, $3, $4)';
        await query(sql, [stat.p1_stat, stat.p1_stat2, stat.p2_stat])

        return 'Successfully added Race Stats to Database';
    }

    static async remove(race: { id: bigint }) {
        if (!(await this.exists(race))) throw new NotFoundError('Race Stat not found', 'Could not find that Stat for that Race in the Database!');

        await query('DELETE FROM race_stats WHERE race_id = $1', [race.id]);

        return 'Successfully removed Race Stats from Database';
    }

    static async update(race: { id: bigint }, stat: DBRaceStat) {
        if (!(await this.exists(race))) throw new NotFoundError('Race Stat not found', 'Could not find that Stat for that Race in the Database!');

        const sql = 'UPDATE race_stats SET p1_stat = $1, p1_stat2 = $2, p2_stat = $3 WHERE race_id = $4';
        await query(sql, [stat.p1_stat, stat.p1_stat2, stat.p2_stat, race.id, stat.id]);

        return 'Successfully updated Race Stats in Database';
    }
}

export { RaceStats };
