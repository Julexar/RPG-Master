import { psql } from '../../psql';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';
const { query } = psql;

interface DBClassProf {
    id: number;
    class_id: number;
    type: string;
    name: string;
    expert: boolean;
}

interface AddClassProf {
    type: string;
    name: string;
    expert: boolean;
}

export class ClassProficiency {
    static async getAll(clas: { id: number }) {
        const results = await query('SELECT * FROM class_proficiencies WHERE class_id = $1', [clas.id]) as DBClassProf[];

        if (results.length === 0) throw new NotFoundError('No Class Proficiencies found', 'Could not find any Class Proficiencies in the Database!');

        return await Promise.all(results.map(async (prof) => {
            const dbProf = await Proficiency.getOne({ key: prof.type });

            return {
                id: prof.id,
                type: dbProf,
                name: prof.name,
                expert: prof.expert
            };
        }));
    }

    static async getOne(clas: { id: number }, prof: { id?: number, name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM class_proficiencies WHERE id = $1 AND class_id = $2';
            const results = await query(sql, [prof.id, clas.id]) as DBClassProf[];

            if (results.length === 0) throw new NotFoundError('Class Proficiency not found', 'Could not find the Class Proficiency in the Database!');

            const clasProf = results[0];
            const dbProf = await Proficiency.getOne({ key: clasProf.type });

            return {
                id: clasProf.id,
                type: dbProf,
                name: clasProf.name,
                expert: clasProf.expert
            };
        }

        const sql = 'SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2';
        const results = await query(sql, [clas.id, prof.name]) as DBClassProf[];

        if (results.length === 0) throw new NotFoundError('Class Proficiency not found', 'Could not find a Class Proficiency with that Name in the Database!');

        const clasProf = results[0];
        const dbProf = await Proficiency.getOne({ key: clasProf.type });

        return {
            id: clasProf.id,
            type: dbProf,
            name: clasProf.name,
            expert: clasProf.expert
        };
    }

    static async exists(clas: { id: number }, prof: { id?: number, name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM class_proficiencies WHERE id = $1 AND class_id = $2';
            const results = await query(sql, [prof.id, clas.id]) as DBClassProf[];

            return results.length === 1;
        }

        const sql = 'SELECT * FROM class_proficiencies WHERE class_id = $1 AND name = $2';
        const results = await query(sql, [clas.id, prof.name]) as DBClassProf[];

        return results.length === 1;
    }

    static async add(clas: { id: number }, prof: AddClassProf) {
        if (await this.exists(clas, prof)) throw new DuplicateError('Class Proficiency already exists', 'A Class Proficiency with that Name already exists in the Database!');

        const sql = 'INSERT INTO class_proficiencies (class_id, type, name, expert) VALUES ($1, $2, $3, $4)';
        await query(sql, [clas.id, prof.type, prof.name, prof.expert]) as { id: number }[];

        return 'Successfully added Class Proficiency to the Database';
    }

    static async remove(clas: { id: number }, prof: { id: number }) {
        if (!(await this.exists(clas, prof))) throw new NotFoundError('Class Proficiency not found', 'Could not find the Class Proficiency in the Database!');

        const sql = 'DELETE FROM class_proficiencies WHERE id = $1';
        await query(sql, [prof.id]);

        return 'Successfully removed Class Proficiency from the Database';
    }

    static async update(clas: { id: number }, prof: DBClassProf) {
        if (!(await this.exists(clas, { id: prof.id }))) throw new NotFoundError('Class Proficiency not found', 'Could not find the Class Proficiency in the Database!');

        const sql = 'UPDATE class_proficiencies SET type = $1, name = $2, expert = $3 WHERE id = $4';
        await query(sql, [prof.type, prof.name, prof.expert, prof.id]);

        return 'Successfully updated Class Proficiency in the Database';
    }
}