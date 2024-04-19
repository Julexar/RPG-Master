import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { MCRequirement } from './mc_requirement';
import { ClassLanguage } from './language';
import { ClassProficiency } from './proficiency';
import { ClassSave } from './save';
import { ClassTrait } from './trait';

interface DBClass {
    id: number;
    name: string;
    description: string;
    source: string;
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
    source: string;
    hitdice: number;
    caster: boolean;
    castlvl: number;
    cast_stat: string;
    has_subclass: boolean;
    either_requirement: boolean;
}

export class Class {
    static readonly langs = ClassLanguage;
    static readonly profs = ClassProficiency;
    static readonly saves = ClassSave;
    static readonly traits = ClassTrait;
    static readonly mc_reqs = MCRequirement;

    static async getAll() {
        const results = await db.classes.findMany();

        if (results.length === 0) throw new NotFoundError('No Classes found', 'Could not find any Classes in the Database!');

        return await Promise.all(
            results.map(async (dbClass) => {
                const [ classLangs, classProfs, classSaves, classTraits ] = await Promise.all([
                    await this.langs.getAll(dbClass),
                    await this.profs.getAll(dbClass),
                    await this.saves.getAll(dbClass),
                    await this.traits.getAll(dbClass)
                ]);

                return {
                    ...dbClass,
                    langs: classLangs,
                    profs: classProfs,
                    saves: classSaves,
                    traits: classTraits
                }
            })
        );
    }

    static async getOne(clas: { id?: number, name?: string }) {
        if (clas.id) {
            const result = await db.classes.findUnique({ where: { id: clas.id } });

            if (!result) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

            const [ classLangs, classProfs, classSaves, classTraits ] = await Promise.all([
                await this.langs.getAll(result),
                await this.profs.getAll(result),
                await this.saves.getAll(result),
                await this.traits.getAll(result)
            ]);

            return {
                ...result,
                langs: classLangs,
                profs: classProfs,
                saves: classSaves,
                traits: classTraits
            };
        }

        const result = await db.classes.findFirst({ where: { name: clas.name } });

        if (!result) throw new NotFoundError('Class not found', 'Could not find a Class with that Name in the Database!');

        const [ classLangs, classProfs, classSaves, classTraits ] = await Promise.all([
            await this.langs.getAll(result),
            await this.profs.getAll(result),
            await this.saves.getAll(result),
            await this.traits.getAll(result)
        ]);

        return {
            ...result,
            langs: classLangs,
            profs: classProfs,
            saves: classSaves,
            traits: classTraits
        };
    }

    static async exists(clas: { id?: number, name?: string }) {
        if (clas.id) {
            const result = await db.classes.findUnique({ where: { id: clas.id } });

            return !!result;
        }

        const result = await db.classes.findFirst({ where: { name: clas.name } });

        return !!result;
    }

    static async add(clas: AddClass) {
        if (await this.exists(clas)) throw new DuplicateError('Duplicate Class', 'That Class already exists in the Database!');

        await db.classes.create({ data: { ...clas } })

        return 'Successfully added Class to Database';
    }

    static async remove(clas: { id: number }) {
        if (!await this.exists(clas)) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        await db.classes.delete({ where: { id: clas.id } });

        return 'Successfully removed Class from Database';
    }

    static async update(clas: DBClass) {
        if (!await this.exists({ id: clas.id })) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        await db.classes.update({ data: { name: clas.name, description: clas.description, source: clas.source, hitdice: clas.hitdice, caster: clas.caster, castlvl: clas.castlvl, cast_stat: clas.cast_stat, has_subclass: clas.has_subclass, either_requirement: clas.either_requirement }, where: { id: clas.id } });

        return 'Successfully updated Class in Database';
    }
}