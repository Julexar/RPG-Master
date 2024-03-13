import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBFeat {
    id: number;
    name: string;
    description: string;
    prerequisites: JSON;
    options: JSON;
}

interface AddFeat {
    name: string;
    description: string;
    prerequisites: JSON;
    options: JSON;
}

export class Feat {
    static async getAll() {
        const results = await db.feats.findMany();

        if (results.length === 0) throw new NotFoundError('No Feat found', 'Could not find any Feats in the Database!');

        return results;
    }

    static async getOne(feat: { id?: number, name?: string }) {
        if (feat.id) {
            const result = await db.feats.findUnique({ where: { id: feat.id } });

            if (!result) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

            return result;
        }

        const result = await db.feats.findFirst({ where: { name: feat.name } });

        if (!result) throw new NotFoundError('Feat not found', 'Could not find a Feat with that Name in the Database!');

        return result;
    }

    static async exists(feat: { id?: number, name?: string }) {
        if (feat.id) {
            const result = await db.feats.findUnique({ where: { id: feat.id } });

            return !!result;
        }

        const result = await db.feats.findFirst({ where: { name: feat.name } });

        return !!result;
    }

    static async add(feat: AddFeat) {
        if (await this.exists(feat)) throw new DuplicateError('Duplicate Feat', 'That Feat already exists in the Database!');

        await db.feats.create({ data: {
            name: feat.name,
            description: feat.description,
            prerequisites: JSON.parse(JSON.stringify(feat.prerequisites)),
            options: JSON.parse(JSON.stringify(feat.options))
        }});

        return 'Successfully added Feat to Database';
    }

    static async remove(feat: { id: number }) {
        if (!await this.exists(feat)) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

        await db.feats.delete({ where: { id: feat.id } });

        return 'Successfully removed Feat from Database';
    }

    static async update(feat: DBFeat) {
        if (!(await this.exists({ id: feat.id }))) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

        await db.feats.update({
            where: { id: feat.id },
            data: {
                name: feat.name,
                description: feat.description,
                prerequisites: JSON.parse(JSON.stringify(feat.prerequisites)),
                options: JSON.parse(JSON.stringify(feat.options))
            }
        });

        return 'Successfully updated Feat in Database';
    }
}