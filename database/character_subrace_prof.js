import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
import { Proficiency } from './proficiency.js';
import { psql } from './psql.js';
const query = psql.query;

class CharacterSubraceProf {
    async getAll(char, sub) {
        const results = await this.query('SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2', [char.id, sub.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Subrace Proficiencies found', 'Could not find any Subrace Proficiencies for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charSubProf) => {
                const dbProf = await this.getProficiency({ id: charSubProf.type });

                return {
                    id: charSubProf.id,
                    char_id: char.id,
                    sub_id: sub.id,
                    name: charSubProf.name,
                    type: dbProf.name,
                    expert: charSubProf.expert,
                };
            })
        );
    }

    async getOne(char, sub, prof) {
        const results = await this.query('SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3', [char.id, sub.id, prof.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');
        }

        const charSubProf = results[0];
        const dbProf = await this.getProficiency({ id: charSubProf.type });

        return {
            id: charSubProf.id,
            char_id: char.id,
            sub_id: sub.id,
            name: charSubProf.name,
            type: dbProf.name,
            expert: charSubProf.expert,
        };
    }

    async exists(char, sub, prof) {
        if (prof.id) {
            const results = await this.query('SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3', [char.id, sub.id, prof.id]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3', [char.id, sub.id, prof.name]);

        return results.length === 1;
    }

    async add(char, sub, prof) {
        try {
            const charSubProf = await this.getCharSubraceProf(char, sub, prof);

            if (prof.expert === charSubProf.expert) {
                throw new DuplicateError('Duplicate Character Subrace Proficiency', 'That Character already has that Subrace Proficiency in the Database!');
            }

            const sql = 'UPDATE character_subrace_profs SET expert = $1, name = $2 WHERE char_id = $3 AND sub_id = $4 AND id = $5';
            await this.query(sql, [prof.expert, prof.name, char.id, sub.id, prof.id]);

            return 'Successfully updated Character Subrace Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO character_subrace_profs (char_id, sub_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await this.query(sql, [char.id, sub.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Subrace Proficiency to Character in Database';
        }
    }
}

export { CharacterSubraceProf };
