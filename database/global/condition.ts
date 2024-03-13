import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBCondition {
    id: number;
    name: string;
    description: string;
}

interface AddCondition {
    name: string;
    description: string;
}

export class Condition {
    static async getAll() {
        const results = await db.conditions.findMany();

        if (results.length === 0) throw new NotFoundError('No Condition found', 'Could not find any Conditions in the Database!');

        return results;
    }

    static async getOne(condition: { id?: number, name?: string }) {
        if (condition.id) {
            const result = await db.conditions.findUnique({ where: { id: condition.id } });

            if (!result) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

            return result;
        }

        const result = await db.conditions.findFirst({ where: { name: condition.name } });

        if (!result) throw new NotFoundError('Condition not found', 'Could not find a Condition with that Name in the Database!');

        return result;
    }

    static async exists(condition: { id?: number, name?: string }) {
        if (condition.id) {
            const result = await db.conditions.findUnique({ where: { id: condition.id } });

            return !!result;
        }

        const result = await db.conditions.findFirst({ where: { name: condition.name } });

        return !!result;
    }

    static async add(condition: AddCondition) {
        if (await this.exists(condition)) throw new DuplicateError('Duplicate Condition', 'That Condition already exists in the Database!');

        await db.conditions.create({ data: condition });

        return 'Successfully added Condition to Database';
    }

    static async remove(condition: { id: number }) {
        if (!(await this.exists({ id: condition.id }))) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

        await db.conditions.delete({ where: { id: condition.id } });

        return 'Successfully removed Condition from Database';
    }

    static async update(condition: DBCondition) {
        if (!(await this.exists({ id: condition.id }))) throw new NotFoundError('Condition not found', 'Could not find that Condition in the Database!');

        await db.conditions.update({
            where: { id: condition.id },
            data: condition
        });

        return 'Successfully updated Condition in Database';
    }
}