import { psql } from "./psql.js";
import { NotFoundError } from "../custom/errors/index.js";
import { Proficiency } from "./proficiency.js";
const query = psql.query;

class CharacterProficiency {
    static async getAll(char, prof) {
        if (!prof.type) {
            const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1", [char.id])

            if (results.length === 0) {
                throw new NotFoundError("No Character Proficiencies found", "Could not find any Proficiencies for that Character in the Database!");
            }

            return Promise.all(results.map(async (charProf) => {
                const dbProf = await Proficiency.getOne({id: charProf.type})

                return {
                    id: charProf.id,
                    char_id: char.id,
                    name: charProf.name,
                    type: dbProf.name,
                    expert: charProf.expert
                };
            }));
        }

        const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND type = $2", [char.id, prof.type])

        if (results.length === 0) {
            throw new NotFoundError("No Character Proficiencies found", "Could not find any Proficiencies of that type for that Character in the Database!");
        }

        return Promise.all(results.map(async (charProf) => {
            const dbProf = await Proficiency.getOne({id: charProf.type})

            return {
                id: charProf.id,
                char_id: char.id,
                name: charProf.name,
                type: dbProf.name,
                expert: charProf.expert
            };
        }));
    };

    static async getOne(char, prof) {
        if (prof.id) {
            const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

            if (results.length === 0) {
                throw new NotFoundError("Character Proficiency not found", "Could not find that Proficiency for that Character in the Database!");
            }

            const charProf = results[0];
            const dbProf = await Proficiency.getOne({id: charProf.type})

            return {
                id: charProf.id,
                char_id: char.id,
                name: charProf.name,
                type: dbProf.name,
                expert: charProf.expert
            };
        }

        const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2", [char.id, prof.name])

        if (results.length === 0) {
            throw new NotFoundError("Character Proficiency not found", "Could not find a Character Proficiency with that name in the Database!");
        }

        const charProf = results[0];
        const dbProf = await Proficiency.getOne({id: charProf.type})

        return {
            id: charProf.id,
            char_id: char.id,
            name: charProf.name,
            type: dbProf.name,
            expert: charProf.expert
        };
    };

    static async exists(char, prof) {
        if (prof.id) {
            const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

            return results.length === 1;
        }

        const results = await this.query("SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2", [char.id, prof.name])

        return results.length === 1;
    };

    static async add(char, prof) {
        try {
            const charProf = await this.getOne(char, prof)

            if (prof.expert === charProf.expert) {
                throw new DuplicateError("Duplicate Character Proficiency", "That Character already has that Proficiency!");
            }

            const sql = "UPDATE character_proficiencies SET expert = $1 WHERE char_id = $2 AND id = $3";
            await query(sql, [prof.expert, char.id, charProf.id])

            return "Successfully updated Character Proficiency in Database";
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = "INSERT INTO character_proficiencies (char_id, name, type, expert) VALUES($1, $2, $3, $4)";
            await query(sql, [char.id, prof.name, prof.type, prof.expert])

            return "Successfully added Character Proficiency to Database";
        }
    };

    static async remove(char, prof) {
        if (!(await this.exists(char, prof))) {
            throw new NotFoundError("Character Proficiency not found", "Could not find that Proficiency for that Character in the Database!");
        }

        await this.query("DELETE FROM character_proficiencies WHERE char_id = $1 AND id = $2", [char.id, prof.id])

        return "Successfully removed Character Proficiency from Database";
    };
};

export { CharacterProficiency };