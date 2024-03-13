import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { WeaponProp } from "./props";
import { ItemType, ItemRarity, Source } from "..";

interface DBWeapon {
    id: number;
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
    props: number[];
}

interface AddWeapon {
    name: string;
    description: string;
    source: string;
    type: ItemType;
    rarity: ItemRarity;
    stats: JSON;
    props: number[];
}

class weapon {
    props: typeof WeaponProp;
    constructor() {
        this.props = WeaponProp;
    }

    async getAll() {
        const results = await db.weapons.findMany();

        if (results.length === 0) throw new NotFoundError('No Weapons found', 'Could not find any Weapons in the Database!');

        return await Promise.all(
            results.map(async dbWeapon => {
                const source = await Source.getOne({ abrv: dbWeapon.source });
                const type = await ItemType.getOne({ id: dbWeapon.type_id });
                const rarity = await ItemRarity.getOne({ id: dbWeapon.rarity_id });

                return {
                    id: dbWeapon.id,
                    name: dbWeapon.name,
                    description: dbWeapon.description,
                    source: source,
                    type: type,
                    rarity: rarity,
                    stats: JSON.parse(JSON.stringify(dbWeapon.stats)),
                    props: await Promise.all(dbWeapon.props.map(async prop => await this.props.getOne({ id: prop })))
                }
            })
        )
    }

    async getOne(weapon: { id?: number, name?: string }) {
        if (weapon.id) {
            const result = await db.weapons.findUnique({ where: { id: weapon.id } });

            if (!result) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

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
                stats: JSON.parse(JSON.stringify(result.stats)),
                props: await Promise.all(result.props.map(async prop => await this.props.getOne({ id: prop })))
            }
        }

        const result = await db.weapons.findFirst({ where: { name: weapon.name } });

        if (!result) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

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
            stats: JSON.parse(JSON.stringify(result.stats)),
            props: await Promise.all(result.props.map(async prop => await this.props.getOne({ id: prop })))
        }
    }

    async exists(weapon: { id?: number, name?: string }) {
        if (weapon.id) {
            const result = await db.weapons.findUnique({ where: { id: weapon.id } });

            return !!result;
        }

        const result = await db.weapons.findFirst({ where: { name: weapon.name } });

        return !!result;
    }

    async add(weapon: AddWeapon) {
        if (await this.exists({ name: weapon.name })) throw new DuplicateError('Weapon already exists', 'That Weapon already exists in the Database!');

        const source = await Source.getOne({ abrv: weapon.source });
        const type = await ItemType.getOne({ id: weapon.type });
        const rarity = await ItemRarity.getOne({ id: weapon.rarity });

        await db.weapons.create({
            data: {
                name: weapon.name,
                description: weapon.description,
                source: source.abrv,
                type_id: type.id,
                rarity_id: rarity.id,
                stats: JSON.stringify(weapon.stats),
                props: weapon.props
            }
        });

        return 'Successfully added Weapon to Database';
    }

    async remove(weapon: { id: number }) {
        if (!await this.exists(weapon)) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        await db.weapons.delete({ where: { id: weapon.id } });

        return 'Successfully removed Weapon from Database';
    }

    async update(weapon: DBWeapon) {
        if (!await this.exists({ id: weapon.id })) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        const source = await Source.getOne({ abrv: weapon.source });
        const type = await ItemType.getOne({ id: weapon.type_id });
        const rarity = await ItemRarity.getOne({ id: weapon.rarity_id });

        await db.weapons.update({
            where: { id: weapon.id },
            data: {
                name: weapon.name,
                description: weapon.description,
                source: source.abrv,
                type_id: type.id,
                rarity_id: rarity.id,
                stats: JSON.stringify(weapon.stats),
                props: weapon.props
            }
        });

        return 'Successfully updated Weapon in Database';
    }
}