import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBWeaponProp {
    id: number;
    name: string;
    description: string;
}

interface AddWeaponProp {
    name: string;
    description: string;
}

export class WeaponProp {
    static async getAll() {
        const results = await db.weapon_props.findMany();

        if (results.length === 0) throw new NotFoundError('No Weapon Properties found', 'Could not find any Weapon Properties in the Database!');

        return results;
    }

    static async getOne(prop: { id?: number, name?: string }) {
        if (prop.id) {
            const result = await db.weapon_props.findUnique({ where: { id: prop.id } });

            if (!result) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

            return result;
        }

        const result = await db.weapon_props.findFirst({ where: { name: prop.name } });

        if (!result) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        return result;
    }

    static async exists(prop: { id?: number, name?: string }) {
        if (prop.id) {
            const result = await db.weapon_props.findUnique({ where: { id: prop.id } });

            return !!result;
        }

        const result = await db.weapon_props.findFirst({ where: { name: prop.name } });

        return !!result;
    }

    static async add(prop: AddWeaponProp) {
        if (await this.exists(prop)) throw new DuplicateError('Weapon Property already exists', 'That Weapon Property already exists in the Database!');

        await db.weapon_props.create({ data: prop });

        return 'Successfully added Weapon Property to Database';
    }

    static async remove(prop: { id: number }) {
        if (!await this.exists(prop)) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        await db.weapon_props.delete({ where: { id: prop.id } });

        return 'Successfully removed Weapon Property from Database';
    }

    static async update(prop: DBWeaponProp) {
        if (!await this.exists(prop)) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        await db.weapon_props.update({ where: { id: prop.id }, data: { name: prop.name, description: prop.description } });

        return 'Successfully updated Weapon Property in Database';
    }
}