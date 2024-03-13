import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBSchool {
    id: number;
    name: string;
}

export class SpellSchool {
    static async getAll() {
        const results = await db.spell_schools.findMany();

        if (results.length === 0) throw new NotFoundError('No Spell Schools found', 'Could not find any Spell Schools in the Database!');

        return results;
    }

    static async getOne(school: { id?: number, name?: string }) {
        if (school.id) {
            const result = await db.spell_schools.findUnique({ where: { id: school.id } });

            if (!result) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

            return result;
        }

        const result = await db.spell_schools.findFirst({ where: { name: school.name } });

        if (!result) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

        return result;
    }

    static async exists(school: { id?: number, name?: string }) {
        if (school.id) {
            const result = await db.spell_schools.findUnique({ where: { id: school.id } });

            return !!result;
        }

        const result = await db.spell_schools.findFirst({ where: { name: school.name } });

        return !!result;
    }

    static async add(school: { name: string }) {
        if (await this.exists(school)) throw new DuplicateError('Spell School already exists', 'That Spell School already exists in the Database!');

        await db.spell_schools.create({ data: school });

        return 'Successfully added Spell School to Database';
    }

    static async remove(school: { id: number }) {
        if (!await this.exists(school)) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

        await db.spell_schools.delete({ where: { id: school.id } });

        return 'Successfully removed Spell School from Database';
    }

    static async update(school: { id: number, name: string }) {
        if (!await this.exists(school)) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

        await db.spell_schools.update({ data: { name: school.name }, where: { id: school.id } });

        return 'Successfully updated Spell School in Database';
    }
}