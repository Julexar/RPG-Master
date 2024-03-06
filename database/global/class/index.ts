import { psql } from '../../psql';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { ClassProficiency } from './proficiency';
const { query } = psql;

interface DBClass {
    id: number;
    name: string;
    description: string;
    hitdice: number;
    caster: boolean;
    castlvl: number;
    cast_stat: string;
    has_subclass: boolean;
    either_requirement: boolean;
}

interface AddClass {
    name: string;
    description: string;
    hitdice: number;
    caster: boolean;
    castlvl: number;
    cast_stat: string;
    has_subclass: boolean;
    either_requirement: boolean;
}

class Clas {
    profs: typeof ClassProficiency;
    constructor() {
        this.profs = ClassProficiency;
    }

    async getAll() {
        const results = await query('SELECT * FROM classes') as DBClass[];

        if (results.length === 0) throw new NotFoundError('No Classes found', 'Could not find any Classes in the Database!');

        return await Promise.all(
            results.map(async (dbClass) => {
                const [ classProfs ] = await Promise.all([
                    await this.profs.getAll(dbClass)
                ]);

                return {
                    ...dbClass,
                    profs: classProfs
                }
            })
        );
    }

    async getOne(clas: { id?: number, name?: string }) {
        if (clas.id) {
            const results = await query('SELECT * FROM classes WHERE id = $1', [clas.id]) as DBClass[];

            if (results.length === 0) throw new NotFoundError('Class not found', 'Could not find the Class in the Database!');

            const dbClass = results[0];
            const [ classProfs ] = await Promise.all([
                await this.profs.getAll(dbClass)
            ]);

            return {
                ...dbClass,
                profs: classProfs
            };
        }

        const results = await query('SELECT * FROM classes WHERE name = $1', [clas.name]) as DBClass[];

        if (results.length === 0) throw new NotFoundError('Class not found', 'Could not find a Class with that Name in the Database!');

        const dbClass = results[0];
        const [ classProfs ] = await Promise.all([
            await this.profs.getAll(dbClass)
        ]);

        return {
            ...dbClass,
            profs: classProfs
        };
    }

    async exists(clas: { id?: number, name?: string }) {
        if (clas.id) {
            const results = await query('SELECT * FROM classes WHERE id = $1', [clas.id]) as DBClass[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM classes WHERE name = $1', [clas.name]) as DBClass[];

        return results.length === 1;
    }

    async add(clas: AddClass) {
        if (await this.exists(clas)) throw new DuplicateError('Class already exists', 'A Class with that Name already exists in the Database!');

        const sql = 'INSERT INTO classes (name, description, hitdice, caster, castlvl, cast_stat, has_subclass, either_requirement) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.caster, clas.castlvl, clas.cast_stat, clas.has_subclass, clas.either_requirement]);

        return 'Successfully added Class to the Database';
    }

    async remove(clas: { id: number }) {
        if (!await this.exists(clas)) throw new NotFoundError('Class not found', 'Could not find the Class in the Database!');

        const sql = 'DELETE FROM classes WHERE id = $1';
        await query(sql, [clas.id]);

        return 'Successfully removed Class from the Database';
    }

    async update(clas: DBClass) {
        if (!await this.exists({ id: clas.id })) throw new NotFoundError('Class not found', 'Could not find the Class in the Database!');

        const sql = 'UPDATE classes SET name = $1, description = $2, hitdice = $3, caster = $4, castlvl = $5, cast_stat = $6, has_subclass = $7, either_requirement = $8 WHERE id = $9';
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.caster, clas.castlvl, clas.cast_stat, clas.has_subclass, clas.either_requirement, clas.id]);

        return 'Successfully updated Class in the Database';
    }
}

export const Class = new Clas();