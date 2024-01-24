import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '../../global';
const query = psql.query;

class CharacterClassProficiency {
    static async getAll(char, clas) {
        const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2', [char.id, clas.id]);

        if (results.length === 0) {
            throw new NotFoundError(
                'No Character (class-only) Proficiencies found',
                'Could not find any Proficiencies granted by that Class for that Character in the Database!'
            );
        }

        return Promise.all(
            results.map(async (charProf) => {
                const dbProf = await Proficiency.getOne({ id: charProf.type });

                return {
                    id: charProf.id,
                    char_id: char.id,
                    class_id: clas.id,
                    name: charProf.name,
                    type: dbProf.name,
                    expert: charProf.expert,
                };
            })
        );
    }

    static async getOne(char, clas, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3', [
                char.id,
                clas.id,
                prof.id,
            ]);

            if (results.length === 0) {
                throw new NotFoundError(
                    'Character (class-only) Proficiency not found',
                    'Could not find that Proficiency granted by that Class for that Character in the Database!'
                );
            }

            const charProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charProf.id });

            return {
                id: charProf.id,
                char_id: char.id,
                class_id: clas.id,
                name: charProf.name,
                type: dbProf.name,
                expert: charProf.expert,
            };
        }

        const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3', [
            char.id,
            clas.id,
            prof.name,
        ]);

        if (results.length === 0) {
            throw new NotFoundError(
                'Character (class-only) Proficiency not found',
                'Could not find a Proficiency granted by that Class with that name for that Character in the Database!'
            );
        }

        const charProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charProf.id });

        return {
            id: charProf.id,
            char_id: char.id,
            class_id: clas.id,
            name: charProf.name,
            type: dbProf.name,
            expert: charProf.expert,
        };
    }

    static async exists(char, clas, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3', [
                char.id,
                clas.id,
                prof.id,
            ]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3', [
            char.id,
            clas.id,
            prof.name,
        ]);

        return results.length === 1;
    }

    static async add(char, clas, prof) {
        try {
            const charProf = await this.getOne(char, clas, prof);

            if (prof.expert === charProf.expert) {
                throw new DuplicateError(
                    'Duplicate Character (class-only) Proficiency',
                    'That Character already has that Proficiency granted by that Class!'
                );
            }

            const sql = 'UPDATE character_class_profs SET expert = $1 WHERE char_id = $2 AND class_id = $3 AND id = $4';
            await query(sql, [prof.expert, char.id, clas.id, prof.id]);

            return 'Successfully updated Character (class-only) Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO character_class_profs (char_id, class_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [char.id, clas.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Character (class-only) Proficiency to Database';
        }
    }

    static async remove(char, clas, prof) {
        if (!(await this.exists(char, clas, prof))) {
            throw new NotFoundError(
                'Character (class-only) Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );
        }

        await query('DELETE FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, prof.id]);

        return 'Successfully removed Character (class-only) Proficiency from Database';
    }

    static async update(char, clas, prof) {
        if (!(await this.exists(char, clas, prof))) {
            throw new NotFoundError(
                'Character (class-only) Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );
        }

        const sql = 'UPDATE character_class_profs SET name = $1, expert = $2 WHERE char_id = $3 AND class_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.expert, char.id, clas.id, prof.id]);

        return 'Successfully updated Character (class-only) Proficiency in Database';
    }
}

export { CharacterClassProficiency };
