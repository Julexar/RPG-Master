import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { psql } from '../../psql.js';
import { Proficiency } from '..';
const query = psql.query;

class ClassProficiency {
    static async getAll(clas) {
        const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1', [clas.id]);

        if (results.length === 0) {
            throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency granted by that Class in the Database!');
        }

        return Promise.all(
            results.map(async classProf => {
                const dbProf = await Proficiency.getOne({ id: classProf.type });

                return {
                    id: classProf.id,
                    class_id: clas.id,
                    name: classProf.name,
                    type: dbProf.name,
                    expert: classProf.expert,
                };
            })
        );
    }

    static async getOne(clas, prof) {
        if (prof.id) {
            const classProf = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id])[0];

            if (!classProf) {
                throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency granted by that Class in the Database!');
            }

            const dbProf = await this.getProficiency({ id: classProf.type });

            return {
                id: classProf.id,
                class_id: clas.id,
                name: classProf.name,
                type: dbProf.name,
                expert: classProf.expert,
            };
        }

        const classProf = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2', [clas.id, prof.name])[0];

        if (!classProf) {
            throw new NotFoundError(
                'Class Proficiency not found',
                'Could not find a Proficiency granted by that Class with that name in the Database!'
            );
        }

        const dbProf = await this.getProficiency({ id: classProf.type });

        return {
            id: classProf.id,
            class_id: clas.id,
            name: classProf.name,
            type: dbProf.name,
            expert: classProf.expert,
        };
    }

    static async exists(clas, prof) {
        if (prof.id) {
            const results = await this.query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2', [clas.id, prof.name]);

        return results.length === 1;
    }

    static async add(clas, prof) {
        if (await this.exists(clas, prof)) {
            throw new DuplicateError('Duplicate Class Proficiency', 'This class already has that Proficiency!');
        }

        const sql = 'INSERT INTO class_proficiencies (class_id, name, type, expert) VALUES($1, $2, $3, $4)';
        await query(sql, [clas.id, prof.name, prof.type, prof.expert]);

        return 'Successfully added Class Proficiency to Database';
    }

    static async remove(clas, prof) {
        if (!(await this.exists(clas, prof))) {
            throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency in the Database!');
        }

        await query('DELETE FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id]);

        return 'Successfully removed Class Proficiency from Database';
    }

    static async update(clas, prof) {
        if (!(await this.exists(clas, prof))) {
            throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency in the Database!');
        }

        const sql = 'UPDATE class_proficiencies SET name = $1, type = $2, expert = $3 WHERE class_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.type, prof.expert, clas.id, prof.id]);

        return 'Successfully updated Class Proficiency in Database';
    }
}

export { ClassProficiency };
