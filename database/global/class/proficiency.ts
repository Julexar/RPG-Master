import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { psql } from '../../psql.js';
import { Proficiency } from '..';
const query = psql.query;

interface DBClasProf {
    id: bigint;
    class_id: bigint;
    type_id: bigint;
    name: string;
    expert: boolean;
}

interface AddClasProf {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class ClassProficiency {
    static async getAll(clas: { id: bigint }) {
        const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1', [clas.id]) as DBClasProf[];

        if (results.length === 0) throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency granted by that Class in the Database!');

        return Promise.all(
            results.map(async (classProf) => {
                const dbProf = await Proficiency.getOne({ id: classProf.type_id });

                return {
                    id: classProf.id,
                    class_id: clas.id,
                    name: classProf.name,
                    type: dbProf,
                    expert: classProf.expert
                };
            })
        );
    }

    static async getOne(clas: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id]) as DBClasProf[];

            if (results.length === 0) throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency granted by that Class in the Database!');

            const classProf = results[0];
            const dbProf = await Proficiency.getOne({ id: classProf.type_id });

            return {
                id: classProf.id,
                class_id: clas.id,
                name: classProf.name,
                type: dbProf,
                expert: classProf.expert
            };
        }

        const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2', [clas.id, prof.name]) as DBClasProf[];

        if (results.length === 0) throw new NotFoundError('Class Proficiency not found', 'Could not find a Proficiency granted by that Class with that name in the Database!');

        const classProf = results[0];
        const dbProf = await Proficiency.getOne({ id: classProf.type_id });

        return {
            id: classProf.id,
            class_id: clas.id,
            name: classProf.name,
            type: dbProf,
            expert: classProf.expert
        };
    }

    static async exists(clas: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id]) as DBClasProf[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2', [clas.id, prof.name]) as DBClasProf[];

        return results.length === 1;
    }

    static async add(clas: { id: bigint }, prof: AddClasProf) {
        if (await this.exists(clas, prof)) throw new DuplicateError('Duplicate Class Proficiency', 'This class already has that Proficiency!');

        const sql = 'INSERT INTO class_proficiencies (class_id, name, type_id, expert) VALUES($1, $2, $3, $4)';
        await query(sql, [clas.id, prof.name, prof.type_id, prof.expert]);

        return 'Successfully added Class Proficiency to Database';
    }

    static async remove(clas: { id: bigint }, prof: { id: bigint, name?: string }) {
        if (!(await this.exists(clas, prof))) throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency in the Database!');

        await query('DELETE FROM class_proficiencies WHERE class_id = $1 AND id = $2', [clas.id, prof.id]);

        return 'Successfully removed Class Proficiency from Database';
    }

    static async update(clas: { id: bigint }, prof: DBClasProf) {
        if (!(await this.exists(clas, prof))) throw new NotFoundError('Class Proficiency not found', 'Could not find that Proficiency in the Database!');

        const sql = 'UPDATE class_proficiencies SET name = $1, type = $2, expert = $3 WHERE class_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.type_id, prof.expert, clas.id, prof.id]);

        return 'Successfully updated Class Proficiency in Database';
    }
}

export { ClassProficiency };
