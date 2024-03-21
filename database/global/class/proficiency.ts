import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';

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
        const results = await db.class_proficiencies.findMany({ where: { class_id: clas.id } });

        if (results.length === 0) throw new NotFoundError('No Class Proficiencies found', 'Could not find any Class Proficiencies in the Database!');

        return await Promise.all(results.map(async (prof) => {
            const dbProf = await Proficiency.getOne({ type: prof.type });

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
            const result = await db.class_proficiencies.findUnique({ where: { class_id: clas.id, id: prof.id } });

            if (!result) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

            const clasProf = result;
            const dbProf = await Proficiency.getOne({ type: clasProf.type });

            return {
                id: clasProf.id,
                type: dbProf,
                name: clasProf.name,
                expert: clasProf.expert
            };
        }

        const result = await db.class_proficiencies.findFirst({ where: { class_id: clas.id, name: prof.name } });

        if (!result) throw new NotFoundError('Class Proficiency not found', 'Could not find a Class Proficiency with that Name in the Database!');

        const clasProf = result;
        const dbProf = await Proficiency.getOne({ type: clasProf.type });

        return {
            id: clasProf.id,
            type: dbProf,
            name: clasProf.name,
            expert: clasProf.expert
        };
    }

    static async exists(clas: { id: number }, prof: { id?: number, name?: string }) {
        if (prof.id) {
            const result = await db.class_proficiencies.findUnique({ where: { class_id: clas.id, id: prof.id } });

            return !!result;
        }

        const result = await db.class_proficiencies.findFirst({ where: { class_id: clas.id, name: prof.name } });

        return !!result;
    }

    static async add(clas: { id: number }, prof: AddClassProf) {
        if (await this.exists(clas, prof)) throw new DuplicateError('Duplicate Class Proficiency', 'That Class Proficiency already exists in the Database!');

        await db.class_proficiencies.create({ data: { class_id: clas.id, ...prof } });

        return 'Successfully added Class Proficiency to Database';
    }

    static async remove(clas: { id: number }, prof: { id: number }) {
        if (!(await this.exists(clas, prof))) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

        await db.class_proficiencies.delete({ where: { class_id: clas.id, id: prof.id } });

        return 'Successfully removed Class Proficiency from Database';
    }

    static async update(clas: { id: number }, prof: DBClassProf) {
        if (!(await this.exists(clas, { id: prof.id }))) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

        await db.class_proficiencies.update({ 
            where: { class_id: clas.id, id: prof.id }, 
            data: { 
                type: prof.type,
                name: prof.name,
                expert: prof.expert
            }
        });

        return 'Successfully updated Class Proficiency in Database';
    }
}