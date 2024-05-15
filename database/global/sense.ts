import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBSense {
    id: number;
    name: string;
    key: string;
}

interface AddSense {
    name: string;
    key: string;
}

export class Sense {
    static async getAll() {
        const results = await db.senses.findMany();

        if (results.length === 0) throw new NotFoundError('No Sense found', 'Could not find any Senses in the Database!');

        return results;
    }

    static async getOne(sense: { id?: number, name?: string, key?: string }) {
        if (sense.id) {
            const result = await db.senses.findUnique({ where: { id: sense.id } });

            if (!result) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

            return result;
        }

        if (sense.key) {
            const result = await db.senses.findUnique({ where: { key: sense.key } });

            if (!result) throw new NotFoundError('Sense not found', 'Could not find a Sense with that Key in the Database!');

            return result;
        }

        const result = await db.senses.findFirst({ where: { name: sense.name } });

        if (!result) throw new NotFoundError('Sense not found', 'Could not find a Sense with that Name in the Database!');

        return result;
    }

    static async exists(sense: { id?: number, name?: string, key?: string }) {
        if (sense.id) {
            const result = await db.senses.findUnique({ where: { id: sense.id } });

            return !!result;
        }

        if (sense.key) {
            const result = await db.senses.findUnique({ where: { key: sense.key } });

            return !!result;
        }

        const result = await db.senses.findFirst({ where: { name: sense.name } });

        return !!result;
    }

    static async add(sense: AddSense) {
        if (await this.exists(sense)) throw new DuplicateError('Duplicate Sense', 'That Sense already exists in the Database!');

        await db.senses.create({ data: sense });

        return 'Successfully added Sense to Database';
    }

    static async remove(sense: { id: number }) {
        if (!await this.exists(sense)) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

        await db.senses.delete({ where: { id: sense.id } });

        return 'Successfully removed Sense from Database';
    }

    static async update(sense: DBSense) {
        if (!await this.exists({ id: sense.id })) throw new NotFoundError('Sense not found', 'Could not find that Sense in the Database!');

        await db.senses.update({
            where: { id: sense.id },
            data: {
                name: sense.name,
                key: sense.key
            }
        });

        return 'Successfully updated Sense in Database';
    }
}