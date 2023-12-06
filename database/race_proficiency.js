import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { Proficiency } from "./proficiency.js";
const query = psql.query;

class RaceProficiency {
    static async getAll(race) {
        const results = await query("SELECT * FROM race_proficiencies WHERE race_id = $1", [race.id])

        if (results.length === 0) {
            throw new NotFoundError("No Race Proficiencies found", "Could not find any Race Proficiencies in the Database!");
        }

        return Promise.all(results.map(async (raceProf) => {
            const dbProf = await Proficiency.getOne({id: raceProf.type})

            return {
                id: raceProf.id,
                race_id: race.id,
                name: raceProf.name,
                type: dbProf.name,
                expert: raceProf.expert
            };
        }));
    };

    static async getOne(race, prof) {
        if (prof.id) {
            const results = await query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])

            if (results.length === 0) {
                throw new NotFoundError("Race Proficiency not found", "Could not find that Race Proficiency in the Database!");
            }

            const raceProf = results[0];
            const dbProf = await Proficiency.getOne({id: raceProf.type})

            return {
                id: raceProf.id,
                race_id: race.id,
                name: raceProf.name,
                type: dbProf.name,
                expert: raceProf.expert
            };
        }

        const results = await query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2", [race.id, prof.name])

        if (results.length === 0) {
        throw new NotFoundError("Race Proficiency not found", "Could not find a Race Proficiency with that name in the Database!");
        }

        const raceProf = results[0];
        const dbProf = await Proficiency.getOne({id: raceProf.type})

        return {
            id: raceProf.id,
            race_id: race.id,
            name: raceProf.name,
            type: dbProf.name,
            expert: raceProf.expert
        };
    };

    static async exists(race, prof) {
        if (prof.id) {
            const results = await query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])
      
            return results.length === 1;
        }
    
        const results = await query("SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2", [race.id, prof.name])
    
        return results.length === 1;
    };

    static async add(race, prof) {
        try {
            const raceProf = await this.getOne(race, prof)

            if (prof.expert === raceProf.expert) {
                throw new DuplicateError("Duplicate Race Proficiency", "That Race Proficiency already exists in the Database!");
            }

            const sql = "UPDATE race_proficiencies SET expert = $1 WHERE race_id = $2 AND id = $3";
            await query(sql, [prof.expert, race.id, prof.id])

            return "Successfully updated Race Proficiency in the Database";
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = "INSERT INTO race_proficiencies (race_id, name, type, expert) VALUES($1, $2, $3, $4)";
            await query(sql, [race.id, prof.name, prof.type, prof.expert])

            return "Successfully added Race Proficiency to Database";
        }
    };

    static async remove(race, prof) {
        if (!(await this.exists(race, prof))) {
            throw new NotFoundError("Race Proficiency not found", "Could not find that Race Proficiency in the Database!");
        }

        await query("DELETE FROM race_proficiencies WHERE race_id = $1 AND id = $2", [race.id, prof.id])

        return "Successfully removed Race Proficiency from Database";
    };

    static async update(race, prof) {
        if (!(await this.exists(race, prof))) {
            throw new NotFoundError("Race Proficiency not found", "Could not find that Race Proficiency in the Database!");
        }

        await query("UPDATE race_proficiencies SET expert = $1 WHERE race_id = $2 AND id = $3", [prof.expert, race.id, prof.id])

        return "Successfully updated Race Proficiency in Database";
    };
};

export { RaceProficiency };