import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBSkill {
    id: number;
    name: string;
}

export class Skill {
    static async getAll() {
        const results = await db.skills.findMany();

        if (results.length === 0) throw new NotFoundError('No Skills found', 'Could not find any Skills in the Database!');

        return results;
    }

    static async getOne(skill: { id?: number, name?: string }) {
        if (skill.id) {
            const result = await db.skills.findUnique({ where: { id: skill.id } });

            if (!result) throw new NotFoundError('Skill not found', 'Could not find that Skill in the Database!');

            return result;
        }
        
        const result = await db.skills.findFirst({ where: { name: skill.name } });

        if (!result) throw new NotFoundError('Skill not found', 'Could not find that Skill in the Database!');

        return result;
    }

    static async exists(skill: { id?: number, name?: string }) {
        if (skill.id) {
            const result = await db.skills.findUnique({ where: { id: skill.id } });

            return !!result;
        }

        const result = await db.skills.findFirst({ where: { name: skill.name } });

        return !!result;
    }

    static async add(skill: { name: string }) {
        if (await this.exists(skill)) throw new DuplicateError('Duplicate Skill', 'That Skill already exists in the Database!');

        await db.skills.create({ data: { name: skill.name } });

        return 'Successfully added Skill to Database';
    }

    static async delete(skill: { id: number }) {
        if (!await this.exists(skill)) throw new NotFoundError('Skill not found', 'Could not find that Skill in the Database!');

        await db.skills.delete({ where: { id: skill.id } });

        return 'Successfully deleted Skill from Database';
    }

    static async update(skill: DBSkill) {
        if (!await this.exists(skill)) throw new NotFoundError('Skill not found', 'Could not find that Skill in the Database!');

        await db.skills.update({ where: { id: skill.id }, data: { name: skill.name } });

        return 'Successfully updated Skill in Database';
    }
}