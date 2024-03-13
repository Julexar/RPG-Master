import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBItemType {
    id: number;
    name: string;
}

export class ItemType {
    static async getAll() {
        const results = await db.item_types.findMany();

        if (results.length === 0) throw new NotFoundError('No Item Types found', 'Could not find any Item Types in the Database!');

        return results;
    }

    static async getOne(type: { id?: number, name?: string }) {
        if (type.id) {
            const result = await db.item_types.findUnique({ where: { id: type.id } });

            if (!result) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

            return result;
        }

        const result = await db.item_types.findFirst({ where: { name: type.name } });

        if (!result) throw new NotFoundError('Item Type not found', 'Could not find an Item Type with that Name in the Database!');

        return result;
    }

    static async exists(type: { id?: number, name?: string }) {
        if (type.id) {
            const result = await db.item_types.findUnique({ where: { id: type.id } });

            return !!result;
        }

        const result = await db.item_types.findFirst({ where: { name: type.name } });

        return !!result;
    }

    static async add(type: { name: string }) {
        if (await this.exists({ name: type.name })) throw new DuplicateError('Item Type already exists', 'An Item Type with that Name already exists in the Database!');

        await db.item_types.create({ data: { name: type.name } });

        return 'Successfully added Item Type to Database';
    }

    static async remove(type: { id: number }) {
        if (!await this.exists({ id: type.id })) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        await db.item_types.delete({ where: { id: type.id } });

        return 'Successfully removed Item Type from Database';
    }

    static async update(type: DBItemType) {
        if (!await this.exists({ id: type.id })) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        await db.item_types.update({ where: { id: type.id }, data: { name: type.name } });

        return 'Successfully updated Item Type in Database';
    }
}