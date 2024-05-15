import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBItemRarity {
    id: number;
    name: string;
}

export class ItemRarity {
    static async getAll() {
        const results = await db.item_rarities.findMany();

        if (results.length === 0) throw new NotFoundError('No Item Rarities found', 'Could not find any Item Rarities in the Database!');

        return results;
    }

    static async getOne(rarity: { id?: number, name?: string }) {
        if (rarity.id) {
            const result = await db.item_rarities.findUnique({ where: { id: rarity.id } });

            if (!result) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

            return result;
        }

        const result = await db.item_rarities.findFirst({ where: { name: rarity.name } });

        if (!result) throw new NotFoundError('Item Rarity not found', 'Could not find an Item Rarity with that Name in the Database!');

        return result;
    }

    static async exists(rarity: { id?: number, name?: string }) {
        if (rarity.id) {
            const result = await db.item_rarities.findUnique({ where: { id: rarity.id } });

            return !!result;
        }

        const result = await db.item_rarities.findFirst({ where: { name: rarity.name } });

        return !!result;
    }

    static async add(rarity: { name: string }) {
        if (await this.exists(rarity)) throw new DuplicateError('Duplicate Item Rarity', 'That Item Rarity already exists in the Database!');

        await db.item_rarities.create({ data: { name: rarity.name } });

        return 'Successfully added Item Rarity to Database';
    }

    static async remove(rarity: { id: number }) {
        if (!await this.exists(rarity)) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        await db.item_rarities.delete({ where: { id: rarity.id } });

        return 'Successfully removed Item Rarity from Database';
    }

    static async update(rarity: DBItemRarity) {
        if (!await this.exists(rarity)) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        await db.item_rarities.update({
            where: { id: rarity.id },
            data: { name: rarity.name }
        });

        return 'Successfully updated Item Rarity in Database';
    }
}