import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Proficiency } from './proficiency.js';
const query = psql.query;

class SubclassProficiency {
    static async getAll(sub) {
        const results = await this.query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1', [sub.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Subclass Proficiencies found', 'Could not find any Proficiencies for that Subclass in the Database!');
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
            const results = await this.query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

            if (results.length === 0) {
                throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');
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

        const results = await this.query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type = $3', [sub.id, prof.name, prof.type]);

        if (results.length === 0) {
            throw new NotFoundError('Subclass Proficiency not found', 'Could not find a Subclass Proficiency with that name in the Database!');
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
            const results = await this.query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type = $3', [sub.id, prof.name, prof.type]);

        return results.length === 1;
    }

    static async add(sub, prof) {
        try {
            const subProf = await this.getOne(sub, prof);

            if (prof.expert === subProf.expert) {
                throw new DuplicateError('Duplicate Subclass Proficiency', 'That Subclass Proficiency already exists in the Database!');
            }

            await query('UPDATE subclass_proficiencies SET expert = $1 WHERE sub_id = $2 AND id = $2', [prof.expert, sub.id, prof.id]);

            return 'Successfully updated Subclass Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO subclass_proficiencies (sub_id, name, type, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Subclass Proficiency to Database';
        }
    }

    static async remove(sub, prof) {
        if (!(await this.exists(sub, prof))) {
            throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');
        }

        await query('DELETE FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

        return 'Successfully removed Subclass Proficiency from Database';
    }

    static async update(sub, prof) {
        if (!(await this.exists(sub, prof))) {
            throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');
        }

        const sql = 'UPDATE subclass_proficiencies SET name = $1, expert = $2, type = $3 WHERE sub_id = $4 AND id = $5';
        await this.query(sql, [prof.name, prof.expert, prof.type, sub.id, prof.id]);

        return 'Successfully updated Subclass Proficiency in Database';
    }
}

export { SubclassProficiency };
