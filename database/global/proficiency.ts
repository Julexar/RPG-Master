import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBProficiency {
    id: number;
    name: string;
    type: string;
}

interface AddProficiency {
    name: string;
    type: string;
}

export class Proficiency {
    static async getAll() {
        const results = await db.proficiencies.findMany();

        if (results.length === 0) throw new NotFoundError('No Proficiency found', 'Could not find any Proficiencies in the Database!');

        return results;
    }

    static async getOne(proficiency: { id?: number, name?: string, type?: string }) {
        if (proficiency.id) {
            const result = await db.proficiencies.findUnique({ where: { id: proficiency.id } });

            if (!result) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

            return result;
        }

        if (proficiency.type) {
            const result = await db.proficiencies.findUnique({ where: { type: proficiency.type } });

            if (!result) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Key in the Database!');

            return result;
        }

        const result = await db.proficiencies.findFirst({ where: { name: proficiency.name } });

        if (!result) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Name in the Database!');

        return result;
    }

    static async exists(proficiency: { id?: number, name?: string, type?: string }) {
        if (proficiency.id) {
            const result = await db.proficiencies.findUnique({ where: { id: proficiency.id } });

            return !!result;
        }

        if (proficiency.type) {
            const result = await db.proficiencies.findUnique({ where: { type: proficiency.type } });

            return !!result;
        }

        const result = await db.proficiencies.findFirst({ where: { name: proficiency.name } });

        return !!result;
    }

    static async add(proficiency: AddProficiency) {
        if (await this.exists(proficiency)) throw new DuplicateError('Duplicate Proficiency', 'That Proficiency already exists in the Database!');

        await db.proficiencies.create({ data: proficiency });

        return 'Successfully added Proficiency to the Database';
    }

    static async remove(proficiency: { id: number }) {
        if (!await this.exists(proficiency)) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        await db.proficiencies.delete({ where: { id: proficiency.id } });

        return 'Successfully removed Proficiency from the Database';
    }

    static async update(proficiency: DBProficiency) {
        if (!(await this.exists({ id: proficiency.id }))) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        await db.proficiencies.update({
            where: { id: proficiency.id },
            data: { name: proficiency.name, type: proficiency.type }
        });

        return 'Successfully updated Proficiency in Database';
    }
}