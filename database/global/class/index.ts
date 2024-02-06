import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { ClassProficiency } from './proficiency.ts';
import { ClassSave } from './save.ts';
import { ClassSense } from './sense.ts';
import { ClassTrait } from './trait.ts';
import { MCRequirement } from './mc_requirement.ts';
const query = psql.query;

interface DBClass {
    id: bigint;
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

class clas {
    profs: typeof ClassProficiency;
    saves: typeof ClassSave;
    senses: typeof ClassSense;
    traits: typeof ClassTrait;
    mc_requirements: typeof MCRequirement;
    constructor() {
        this.profs = ClassProficiency;
        this.saves = ClassSave;
        this.senses = ClassSense;
        this.traits = ClassTrait;
        this.mc_requirements = MCRequirement;
    }

    async getAll() {
        const results = await query('SELECT * FROM classes') as DBClass[];

        if (results.length === 0) throw new NotFoundError('No Classes found', 'Could not find any Classes in the Database!');

        return Promise.all(
            results.map(async (dbClass) => {
                const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
                    await this.profs.getAll(dbClass),
                    await this.saves.getAll(dbClass),
                    await this.senses.getAll(dbClass),
                    await this.traits.getAll(dbClass),
                ]);

                return {
                    id: dbClass.id,
                    name: dbClass.name,
                    description: dbClass.description,
                    hitdice: dbClass.hitdice,
                    caster: dbClass.caster,
                    cast_lvl: dbClass.castlvl,
                    cast_stat: dbClass.cast_stat,
                    has_subclass: dbClass.has_subclass,
                    either_requirement: dbClass.either_requirement,
                    profs: classProfs,
                    saves: classSaves,
                    senses: classSenses,
                    traits: classTraits
                };
            })
        );
    }

    async getOne(clas: { id?: bigint; name?: string }) {
        if (clas.id) {
            const results = await query('SELECT * FROM classes WHERE id = $1', [clas.id]) as DBClass[];

            if (results.length === 0) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

            const dbClass = results[0];
            const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
                await this.profs.getAll(dbClass),
                await this.saves.getAll(dbClass),
                await this.senses.getAll(dbClass),
                await this.traits.getAll(dbClass),
            ]);

            return {
                id: dbClass.id,
                name: dbClass.name,
                description: dbClass.description,
                hitdice: dbClass.hitdice,
                caster: dbClass.caster,
                cast_lvl: dbClass.castlvl,
                cast_stat: dbClass.cast_stat,
                sub: dbClass.has_subclass,
                either_requirement: dbClass.either_requirement,
                profs: classProfs,
                saves: classSaves,
                senses: classSenses,
                traits: classTraits
            };
        }

        const results = await query('SELECT * FROM classes WHERE name = $1', [clas.name]) as DBClass[];

        if (results.length === 0) throw new NotFoundError('Class not found', 'Could not find a Class with that name in the Database!');

        const dbClass = results[0];
        const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
            await this.profs.getAll(dbClass),
            await this.saves.getAll(dbClass),
            await this.senses.getAll(dbClass),
            await this.traits.getAll(dbClass),
        ]);

        return {
            id: dbClass.id,
            name: dbClass.name,
            description: dbClass.description,
            hitdice: dbClass.hitdice,
            caster: dbClass.caster,
            cast_lvl: dbClass.castlvl,
            cast_stat: dbClass.cast_stat,
            sub: dbClass.has_subclass,
            either_requirement: dbClass.either_requirement,
            profs: classProfs,
            saves: classSaves,
            senses: classSenses,
            traits: classTraits
        };
    }

    async exists(clas: { id?: bigint; name?: string }) {
        if (clas.id) {
            const results = await query('SELECT * FROM classes WHERE id = $1', [clas.id]) as DBClass[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM classes WHERE name = $1', [clas.name]) as DBClass[];

        return results.length === 1;
    }

    async add(clas: AddClass) {
        if (await this.exists(clas)) throw new DuplicateError('Duplicate Class', 'That Class already exists in the Database!');

        const sql = 'INSERT INTO classes (name, description, hitdice, caster, castlvl, cast_stat, has_subclass, either_requirement) VALUES($1, $2, $3, $4, $5, $6, $7, $8)';
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.caster, clas.castlvl, clas.cast_stat, clas.has_subclass, clas.either_requirement]);

        return 'Successfully added Class to Database';
    }

    async remove(clas: { id: bigint; name?: string }) {
        if (!(await this.exists(clas))) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        await query('DELETE FROM classes WHERE id = $1', [clas.id]);

        return 'Successfully removed Class from Database';
    }

    async update(clas: DBClass) {
        if (!(await this.exists(clas))) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        const sql = 'UPDATE classes SET name = $1, description = $2, hitdice = $3, caster = $4, castlvl = $5, cast_stat = $6, has_subclass = $7, either_requirement = $8 WHERE id = $9';
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.caster, clas.castlvl, clas.cast_stat, clas.has_subclass, clas.either_requirement, clas.id]);

        return 'Successfully updated Class in Database';
    }

    async hasSub(clas: { id?: bigint; name?: string }) {
        if (clas.id) {
            const results = await query('SELECT * FROM classes WHERE id = $1', [clas.id]) as DBClass[];

            return results[0].has_subclass;
        }

        const results = await query('SELECT * FROM classes WHERE name = $2', [clas.name]) as DBClass[];

        return results[0].has_subclass;
    }
}

const Class = new clas();

export { Class };
