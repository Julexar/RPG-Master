import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { Condition } from "./condition.js";
import { Damagetype } from "./dmgtype.js";
const query = psql.query;

class RaceResistance {
    static async getAll(server, race) {
        const results = await query("SELECT * FROM race_resistances WHERE race_id = $1", [race.id])

        if (results.length === 0) {
            throw new NotFoundError("No Race Resistances found", "Could not find any Resistances for that Race in the Database!");
        }

        return Promise.all(results.map(async (raceResist) => {
            let dbResist;

            switch (raceResist.type) {
                case "damagetype":
                    dbResist = await Damagetype.getOne(server, {id: raceResist.res_id})
                break;
                case "condition":
                    dbResist = await Condition.getOne(server, {id: raceResist.res_id})
                break;
            }

            return {
                id: raceResist.id,
                race_id: race.id,
                type: raceResist.type,
                name: dbResist.name,
                res_id: dbResist.id
            };
        }));
    };

    static async getOne(server, race, resist) {
        if (resist.id) {
            const results = await query("SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])

            if (results.length === 0) {
                throw new NotFoundError("Race Resistance not found", "Could not find that Resistance for that Race in the Database!");
            }

            const raceResist = results[0];

            let dbResist;

            switch (raceResist.type) {
                case "damagetype":
                    dbResist = await Damagetype.getOne(server, {id: raceResist.res_id})
                break;
                case "condition":
                    dbResist = await Condition.getOne(server, {id: raceResist.res_id})
                break;
            }

            return {
                id: raceResist.id,
                race_id: race.id,
                type: raceResist.type,
                name: dbResist.name,
                res_id: dbResist.id
            };
        }

        let dbResist;

        switch (raceResist.type) {
            case "damagetype":
                dbResist = await Damagetype.getOne(server, {name: resist.name})
            break;
            case "condition":
                dbResist = await Condition.getOne(server, {name: resist.name})
            break;
        }

        const results = await query("SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2", [race.id, dbResist.id])

        if (results.length === 0) {
            throw new NotFoundError("Race Resistance not found", "Could not find a Resistance with that name for that Race in the Database!");
        }

        const raceResist = results[0];

        return {
            id: raceResist.id,
            race_id: race.id,
            type: raceResist.type,
            name: dbResist.name,
            res_id: dbResist.id
        };
    };

    static async exists(race, resist) {
        if (resist.id) {
            const results = await query("SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])
      
            return results.length === 1;
        }

        let dbResist;

        switch (raceResist.type) {
            case "damagetype":
                dbResist = await Damagetype.getOne(server, {name: resist.name})
            break;
            case "condition":
                dbResist = await Condition.getOne(server, {name: resist.name})
            break;
        }

        const results = await this.query("SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2", [race.id, dbResist.id])

        return results.length === 1;
    };

    static async add(race, resist) {
        if (await this.exists(race, resist)) {
            throw new DuplicateError("Duplicate Race Resistace", "That Race already has that Resistance in the Database!");
        }

        const sql = "INSERT INTO race_resistances (race_id, res_id, type) VALUES($1, $2, $3)";
        await query(sql, [race.id, resist.res_id, resist.type])

        return "Successfully added Race Resistance to Database";
    };

    static async remove(race, resist) {
        if (!(await this.exists(race, resist))) {
            throw new NotFoundError("Race Resistance not found", "Could not find that Resistance for that Race in the Database!");
        }

        await query("DELETE FROM race_resistances WHERE race_id = $1 AND id = $2", [race.id, resist.id])

        return "Successfully removed Race Resistance from Database";
    };
};

export { RaceResistance };