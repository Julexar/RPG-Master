import { prisma as db } from '../prisma';
import { NotFoundError, DuplicateError } from '../../custom/errors';

export class Source {
    static async getAll() {
        const results = await db.sources.findMany();

        if (results.length === 0) throw new NotFoundError('No Sources found', 'Could not find any Sources in the Database!');

        return results;
    }

    static async getOne(source: { id?: number, name?: string, abrv?: string }) {
        if (source.id) {
            const result = await db.sources.findUnique({ where: { id: source.id } });

            if (!result) throw new NotFoundError('Source not found', 'Could not find that Source in the Database!');

            return result;
        }

        if (source.abrv) {
            const result = await db.sources.findUnique({ where: { abrv: source.abrv } });

            if (!result) throw new NotFoundError('Source not found', 'Could not find a Source with that Abbreviation in the Database!');

            return result;
        }

        const result = await db.sources.findFirst({ where: { name: source.name } });

        if (!result) throw new NotFoundError('Source not found', 'Could not find a Source with that Name in the Database!');

        return result;
    }

    static async exists(source: { id?: number, name?: string, abrv?: string }) {
        if (source.id) {
            const result = await db.sources.findUnique({ where: { id: source.id } });

            return !!result;
        }

        if (source.abrv) {
            const result = await db.sources.findUnique({ where: { abrv: source.abrv } });

            return !!result;
        }

        const result = await db.sources.findFirst({ where: { name: source.name } });

        return !!result;
    }

    static async add(source: { name: string, abrv: string }) {
        if (await this.exists(source)) throw new DuplicateError('Duplicate Source', 'That Source already exists in the Database!');

        await db.sources.create({ data: source });

        return 'Successfully added Source to Database';
    }

    static async remove(source: { id: number }) {
        if (!await this.exists(source)) throw new NotFoundError('Source not found', 'Could not find that Source in the Database!');

        await db.sources.delete({ where: { id: source.id } });

        return 'Successfully removed Source from Database';
    }

    static async update(source: { id: number, name: string, abrv: string }) {
        if (!await this.exists(source)) throw new NotFoundError('Source not found', 'Could not find that Source in the Database!');

        await db.sources.update({ data: { name: source.name, abrv: source.abrv }, where: { id: source.id } });

        return 'Successfully updated Source in Database';
    }
}