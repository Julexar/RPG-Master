import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Proficiency } from './proficiency.js';
const query = psql.query;

class SubraceProficiency {
    static async getAll(sub) {
        const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1', [sub.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Subrace Proficiencies found', 'Could not find any Subrace Proficiencies in the Database!');
        }

        return Promise.all(
            results.map(async (subProf) => {
                const dbProf = await Proficiency.getOne({ id: subProf.type });

                return {
                    id: subProf.id,
                    sub_id: sub.id,
                    name: subProf.name,
                    type: dbProf.name,
                    expert: subProf.expert,
                };
            })
        );
    }

    static async getOne(sub, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

            if (results.length === 0) {
                throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Subrace Proficiency in the Database!');
            }

            const subProf = results[0];
            const dbProf = await Proficiency.getOne({ id: subProf.type });

            return {
                id: subProf.id,
                sub_id: sub.id,
                name: subProf.name,
                type: dbProf.name,
                expert: subProf.expert,
            };
        }

        const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2', [sub.id, prof.name]);

        if (results.length === 0) {
            throw new NotFoundError('Subrace Proficiency not found', 'Could not find a Subrace Proficiency with that name in the Database!');
        }

        const subProf = results[0];
        const dbProf = await Proficiency.getOne({ id: subProf.type });

        return {
            id: subProf.id,
            sub_id: sub.id,
            name: subProf.name,
            type: dbProf.name,
            expert: subProf.expert,
        };
    }

    static async exists(sub, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2', [sub.id, prof.name]);

        return results.length === 1;
    }

    static async add(sub, prof) {
        try {
            const subProf = await this.getOne(sub, prof);

            if (prof.expert === subProf.expert) {
                throw new DuplicateError('Duplicate Subrace Proficiency', 'That Subrace already has that Proficiency in the Database!');
            }

            const sql = 'UPDATE subrace_proficiencies SET expert = $1, name = $2 WHERE sub_id = $3 AND id = $4';
            await query(sql, [prof.expert, prof.name, sub.id, prof.id]);

            return 'Successfully updated Subrace Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO subrace_proficiencies (sub_id, name, type, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Subrace Proficiency to Database';
        }
    }

    static async remove(sub, prof) {
        if (!(await this.exists(sub, prof))) {
            throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Proficiency for that Subrace in the Database!');
        }

        await query('DELETE FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

        return 'Successfully removed Subrace Proficiency from Database';
    }

    static async update(sub, prof) {
        if (!(await this.exists(sub, prof))) {
            throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Proficiency for that Subrace in the Database!');
        }

        const sql = 'UPDATE subrace_proficiencies SET name = $1, type = $2, expert = $3 WHERE sub_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.type, prof.expert, sub.id, prof.id]);

        return 'Successfully updated Subrace Proficiency in Database';
    }
}

export { SubraceProficiency };
