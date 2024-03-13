import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";

interface DBDmgtype {
    id: number;
    name: string;
}

export class Damagetype {
    static async getAll() {
        const results = await db.damagetypes.findMany();

        if (results.length === 0) throw new NotFoundError('No Damage Type found', 'Could not find any Damage Type in the Database!');

        return results;
    }

    static async getOne(dmgtype: { id?: number, name?: string }) {
        if (dmgtype.id) {
            const result = await db.damagetypes.findUnique({ where: { id: dmgtype.id } });

            if (!result) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

            return result;
        }

        const result = await db.damagetypes.findFirst({ where: { name: dmgtype.name } });

        if (!result) throw new NotFoundError('Damage Type not found', 'Could not find a Damage Type with that Name in the Database!');

        return result;
    }

    static async exists(dmgtype: { id?: number, name?: string }) {
        if (dmgtype.id) {
            const result = await db.damagetypes.findUnique({ where: { id: dmgtype.id } });

            return !!result;
        }

        const result = await db.damagetypes.findFirst({ where: { name: dmgtype.name } });

        return !!result;
    }

    static async add(dmgtype: { name: string }) {
        if (await this.exists(dmgtype)) throw new DuplicateError('Duplicate Damage Type', 'That Damage Type already exists in the Database!');

        await db.damagetypes.create({ data: dmgtype });

        return 'Successfully added Damage Type to Database';
    }

    static async remove(dmgtype: { id: number }) {
        if (!await this.exists(dmgtype)) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

        await db.damagetypes.delete({ where: { id: dmgtype.id } });

        return 'Successfully removed Damage Type from Database';
    }

    static async update(dmgtype: DBDmgtype) {
        if (!(await this.exists({ id: dmgtype.id }))) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

        await db.damagetypes.update({
            where: { id: dmgtype.id },
            data: { name: dmgtype.name }
        });

        return 'Successfully updated Damage Type in Database';
    }
}