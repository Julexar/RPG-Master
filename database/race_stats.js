import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { Stats } from "./stats.js";
const query = psql.query;

class RaceStats {
    static async getAll(race) {
        const results = await query("SELECT * FROM race_stats WHERE race_id = $1", [race.id])

        if (results.length === 0) {
          throw new NotFoundError("No Race Stats found", "Could not find any Stats for that Race in the Database!");
        }

        return Promise.all(results.map(async (raceStat) => {
            const dbStat = await Stats.getOne({key: raceStat.stat})

            return {
                id: raceStat.id,
                race_id: race.id,
                name: dbStat.name,
                stat: dbStat.key,
                value: raceStat.value
            };
        }));
    };

    static async getOne(race, stat) {
        if (stat.id) {
            const results = await query("SELECT * FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])

            if (results.length === 0) {
                throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
            }

            const raceStat = results[0];
            const dbStat = await Stats.getOne({key: raceStat.stat})

            return {
                id: raceStat.id,
                race_id: race.id,
                name: dbStat.name,
                stat: dbStat.key,
                value: raceStat.value
            };
        }

        const dbStat = await Stats.getOne({name: stat.name})
        const results = await query("SELECT * FROM race_stats WHERE race_id = $1 AND stat = $2", [race.id, dbStat.key])

        if (results.length === 0) {
            throw new NotFoundError("Race Stat not found", "That Race does not have that Stat in the Database!");
        }
      
        const raceStat = results[0];

        return {
            id: raceStat.id,
            race_id: race.id,
            name: dbStat.name,
            stat: dbStat.key,
            value: raceStat.value
        };
    };

    static async exists(race, stat) {
        if (stat.id) {
            const results = await query("SELECT * FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])
      
            return results.length === 1;
        }

        const dbStat = await Stats.getOne({name: stat.name})
        const results = await query("SELECT * FROM race_stats WHERE race_id = $1 AND stat = $2", [race.id, dbStat.key])

        return results.length === 1;
    };

    static async add(race, stat) {
        try {
            const raceStat = await this.getOne(race, stat)

            if (stat.value === raceStat.value) {
                throw new DuplicateError("Duplicate Race Stat", "That Race already has that Stat with that value in the Database!");
            }

            await query("UPDATE race_stats SET val = $1 WHERE race_id = $2 AND id = $3", [stat.val, race.id, stat.id])

            return "Successfully updated Race Stat in Database";
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = "INSERT INTO race_stats (race_id, stat, val) VALUES($1, $2, $3)";
            await query(sql, [race.id, stat.key, stat.val])

            return "Successfully added Race Stat to Database";
        }
    };

    static async remove(race, stat) {
        if (!(await this.exists(race, stat))) {
            throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
        }

        await query("DELETE FROM race_stats WHERE race_id = $1 AND id = $2", [race.id, stat.id])

        return "Successfully removed Race Stat from Database";
    };

    static async update(race, stat) {
        if (!(await this.exists(race, stat))) {
            throw new NotFoundError("Race Stat not found", "Could not find that Stat for that Race in the Database!");
        }

        const sql = "UPDATE race_stats SET stat = $1, val = $2 WHERE race_id = $3 AND id = $4";
        await query(sql, [stat.key, stat.val, race.id, stat.id])

        return "Successfully updated Race Stat in Database";
    };
};

export { RaceStats };