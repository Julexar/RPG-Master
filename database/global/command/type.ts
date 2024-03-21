import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBCmdType {
    id: number;
    name: string;
    key: string;
}

interface AddCmdType {
    name: string;
    key: string;
}

export class CommandType {
    static async getAll() {
        const results = await db.command_types.findMany();

        if (results.length === 0) throw new NotFoundError('No Command Types found', 'Could not find any Command Types in the Database!');

        return results;
    }

    static async getOne(type: { id?: number, name?: string, key?: string }) {
        if (type.id) {
            const result = await db.command_types.findUnique({ where: { id: type.id } });

            if (!result) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

            return result;
        }

        if (type.key) {
            const result = await db.command_types.findUnique({ where: { key: type.key } });

            if (!result) throw new NotFoundError('Command Type not found', 'Could not find a Command Type with that Key in the Database!');

            return result;
        }

        const result = await db.command_types.findFirst({ where: { name: type.name } });

        if (!result) throw new NotFoundError('Command Type not found', 'Could not find a Command Type with that Name in the Database!');

        return result;
    }

    static async exists(type: { id?: number, name?: string, key?: string }) {
        if (type.id) {
            const result = await db.command_types.findUnique({ where: { id: type.id } });

            return !!result;
        }

        if (type.key) {
            const result = await db.command_types.findUnique({ where: { key: type.key } });

            return !!result;
        }

        const result = await db.command_types.findFirst({ where: { name: type.name } });

        return !!result;
    }

    static async add(type: AddCmdType) {
        if (await this.exists(type)) throw new DuplicateError('Duplicate Command Type', 'That Command Type already exists in the Database!');

        await db.command_types.create({ data: type });

        return 'Successfully added Command Type to Database';
    }

    static async remove(type: { id: number }) {
        if (!await this.exists(type)) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

        await db.command_types.delete({ where: { id: type.id } });

        return 'Successfully removed Command Type from Database';
    }

    static async update(type: DBCmdType) {
        if (!await this.exists({ id: type.id })) throw new NotFoundError('Command Type not found', 'Could not find that Command Type in the Database!');

        await db.command_types.update({ where: { id: type.id }, data: type });

        return 'Successfully updated Command Type in Database';
    }
}