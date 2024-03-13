import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

export class Stats {
    static async getAll() {
        const results = await db.stats.findMany();

        if (results.length === 0) throw new NotFoundError('No Stats found', 'Could not find any Stats in the Database!');

        return results;
    }

    static async getOne(stats: { id?: number, name?: string, key?: string }) {
        if (stats.id) {
            const result = await db.stats.findUnique({ where: { id: stats.id } });

            if (!result) throw new NotFoundError('Stats not found', 'Could not find that Stat in the Database!');

            return result;
        }

        if (stats.key) {
            const result = await db.stats.findUnique({ where: { key: stats.key } });

            if (!result) throw new NotFoundError('Stats not found', 'Could not find a Stat with that Key in the Database!');

            return result
        }

        const result = await db.stats.findFirst({ where: { name: stats.name } });

        if (!result) throw new NotFoundError('Stats not found', 'Could not find a Stat with that Name in the Database!');

        return result;
    }

    static async exists(stats: { id?: number, name?: string, key?: string }) {
        if (stats.id) {
            const result = await db.stats.findUnique({ where: { id: stats.id } });

            return !!result;
        }

        if (stats.key) {
            const result = await db.stats.findUnique({ where: { key: stats.key } });

            return !!result;
        }

        const result = await db.stats.findFirst({ where: { name: stats.name } });

        return !!result;
    }

    static async add(stats: { name: string, key: string }) {
        if (await this.exists(stats)) throw new DuplicateError('Duplicate Stat', 'That Stat already exists in the Database!');

        await db.stats.create({ data: stats });

        return 'Successfully added Stat to Database';
    }

    static async remove(stats: { id: number }) {
        if (!await this.exists({ id: stats.id })) throw new NotFoundError('Stat not found', 'Could not find that Stats in the Database!');

        await db.stats.delete({ where: { id: stats.id } });

        return 'Successfully removed Stat from Database';
    }

    static async update(stats: { id: number, name: string, key: string }) {
        if (!await this.exists({ id: stats.id })) throw new NotFoundError('Stat not found', 'Could not find that Stats in the Database!');

        await db.stats.update({ data: { name: stats.name, key: stats.key }, where: { id: stats.id } });

        return 'Successfully updated Stat in Database';
    }
}