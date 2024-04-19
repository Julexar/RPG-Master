import { prisma as db } from '../prisma';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { ItemRarity, ItemType, Source } from '.';

interface DBArmor {
    id: number;
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
}

interface AddArmor {
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
}

export class Armor {
    static async getAll() {
        const results = await db.armors.findMany();

        if (results.length === 0) throw new NotFoundError('No Armor found', 'Could not find any Armor in the Database!');

        return await Promise.all(
            results.map(async dbArmor => {
                const source = await Source.getOne({ abrv: dbArmor.source });
                const type = await ItemType.getOne({ id: dbArmor.type_id });
                const rarity = await ItemRarity.getOne({ id: dbArmor.rarity_id });

                return {
                    id: dbArmor.id,
                    name: dbArmor.name,
                    description: dbArmor.description,
                    source: source,
                    type: type,
                    rarity: rarity,
                    stats: JSON.parse(JSON.stringify(dbArmor.stats))
                }
            })
        )
    }

    static async getOne(armor: { id?: number, name?: string, source?: string }) {
        if (armor.id) {
            const result = await db.armors.findUnique({ where: { id: armor.id } });

            if (!result) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

            const source = await Source.getOne({ abrv: result.source });
            const type = await ItemType.getOne({ id: result.type_id });
            const rarity = await ItemRarity.getOne({ id: result.rarity_id });

            return {
                id: result.id,
                name: result.name,
                description: result.description,
                source: source,
                type: type,
                rarity: rarity,
                stats: JSON.parse(JSON.stringify(result.stats))
            }
        }

        const result = await db.armors.findFirst({ where: { name: armor.name, source: armor.source } });

        if (!result) throw new NotFoundError('Armor not found', 'Could not find an Armor with that Name in the Database!');

        const source = await Source.getOne({ abrv: result.source });
        const type = await ItemType.getOne({ id: result.type_id });
        const rarity = await ItemRarity.getOne({ id: result.rarity_id });

        return {
            id: result.id,
            name: result.name,
            description: result.description,
            source: source,
            type: type,
            rarity: rarity,
            stats: JSON.parse(JSON.stringify(result.stats))
        }
    }

    static async exists(armor: { id?: number, name?: string, source?: string }) {
        if (armor.id) {
            const result = await db.armors.findUnique({ where: { id: armor.id } });

            return !!result;
        }

        const result = await db.armors.findFirst({ where: { name: armor.name, source: armor.source } });

        return !!result;
    }

    static async add(armor: AddArmor) {
        if (await this.exists(armor)) throw new DuplicateError('Duplicate Armor', 'That Armor already exists in the Database!');

        await db.armors.create({ data: { name: armor.name, description: armor.description, source: armor.source, type_id: armor.type_id, rarity_id: armor.rarity_id, stats: JSON.stringify(armor.stats) }});

        return 'Successfully added Armor to Database';
    }

    static async remove(armor: { id: number }) {
        if (!await this.exists(armor)) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        await db.armors.delete({ where: { id: armor.id } });

        return 'Successfully removed Armor from Database'
    }

    static async update(armor: DBArmor) {
        if (!await this.exists(armor)) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        await db.armors.update({ data: { name: armor.name, description: armor.description, source: armor.source, type_id: armor.type_id, rarity_id: armor.rarity_id, stats: JSON.stringify(armor.stats) }, where: { id: armor.id } });

        return 'Successfully updated Armor in Database';
    }
}