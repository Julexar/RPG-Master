import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '../../global';
const query = psql.query;

class CharacterRaceProficiency {
    static async getAll(char, race) {
        const results = await query('SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2', [char.id, race.id]);

        if (results.length === 0) {
            throw new NotFoundError(
                'No Character Race Proficiencies found',
                'Could not find any racial Proficiencies for that Character in the Database!'
            );
        }

        return Promise.all(
            results.map(async (charRaceProf) => {
                const dbProf = await Proficiency.getOne({ id: charRaceProf.type });

                return {
                    id: charRaceProf.id,
                    char_id: char.id,
                    race_id: race.id,
                    name: charRaceProf.name,
                    type: dbProf.name,
                    expert: charRaceProf.expert,
                };
            })
        );
    }

    static async getOne(char, race, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3', [
                char.id,
                race.id,
                prof.id,
            ]);

            if (results.length === 0) {
                throw new NotFoundError(
                    'Character Race Proficiency not found',
                    'Could not find that racial Proficiency of that Character in the Database!'
                );
            }

            const charRaceProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charRaceProf.type });

            return {
                id: charRaceProf.id,
                char_id: char.id,
                race_id: race.id,
                name: charRaceProf.name,
                type: dbProf.name,
                expert: charRaceProf.expert,
            };
        }

        const results = await query('SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND name = $3', [
            char.id,
            race.id,
            prof.name,
        ]);

        if (results.length === 0) {
            throw new NotFoundError(
                'Character Race Proficiency not found',
                'Could not find a racial Proficiency of that Character with that name in the Database!'
            );
        }

        const charRaceProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charRaceProf.type });

        return {
            id: charRaceProf.id,
            char_id: char.id,
            race_id: race.id,
            name: charRaceProf.name,
            type: dbProf.name,
            expert: charRaceProf.expert,
        };
    }

    static async exists(char, race, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3', [
                char.id,
                race.id,
                prof.id,
            ]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND name = $3', [
            char.id,
            race.id,
            prof.name,
        ]);

        return results.length === 1;
    }

    static async add(char, race, prof) {
        try {
            const charRaceProf = await this.getOne(char, race, prof);

            if (prof.expert === charRaceProf.expert) {
                throw new DuplicateError(
                    'Duplicate Character Race Proficiency',
                    'That Character already has that racial Proficiency in the Database!'
                );
            }

            const sql = 'UPDATE character_race_profs SET expert = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4';
            await query(sql, [prof.expert, char.id, race.id, prof.id]);

            return 'Successfully updated Character Race Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO character_race_profs (char_id, race_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [char.id, race.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Race Proficiency to Character in Database';
        }
    }

    static async remove(char, race, prof) {
        if (!(await this.exists(char, race, prof))) {
            throw new NotFoundError(
                'Character Race Proficiency not found',
                'Could not find that Race Proficiency for that Character in the Database!'
            );
        }

        await query('DELETE FROM character_race_profs WHERE char_id = $1 AND race_id = $2 AND id = $3', [char.id, race.id, prof.id]);

        return 'Successfully removed Race Proficiency from Character in Database';
    }

    static async update(char, race, prof) {
        if (!(await this.exists(char, race, prof))) {
            throw new NotFoundError(
                'Character Race Proficiency not found',
                'Could not find that Race Proficiency for that Character in the Database!'
            );
        }

        const sql = 'UPDATE character_race_profs SET expert = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4';
        await query(sql, [prof.expert, char.id, race.id, prof.id]);

        return 'Successfully updated Character Race Proficiency in Database';
    }
}

export { CharacterRaceProficiency };
