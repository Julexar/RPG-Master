import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { CommandType } from "./type";

interface DBCommand {
    id: number;
    name: string;
    description: string;
    type: string;
}

interface AddCommand {
    name: string;
    description: string;
    type: string;
}

class command {
    types: typeof CommandType;
    constructor() {
        this.types = CommandType;
    }

    async getAll() {
        const results = await db.commands.findMany();

        if (results.length === 0) throw new NotFoundError('No Commands found', 'Could not find any Commands in the Database!');

        return await Promise.all(
            results.map(async dbCmd => {
                const type = await this.types.getOne({ key: dbCmd.type });

                return {
                    id: dbCmd.id,
                    name: dbCmd.name,
                    description: dbCmd.description,
                    type: type
                }
            })
        )
    }

    async getOne(command: { id?: number, name?: string, type?: string }) {
        if (command.id) {
            const result = await db.commands.findUnique({ where: { id: command.id } });

            if (!result) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

            const type = await this.types.getOne({ key: result.type });

            return {
                id: result.id,
                name: result.name,
                description: result.description,
                type: type
            };
        }

        const result = await db.commands.findFirst({ where: { name: command.name, type: command.type } });

        if (!result) throw new NotFoundError('Command not found', 'Could not find a Command with that Name in the Database!');

        const type = await this.types.getOne({ key: result.type });

        return {
            id: result.id,
            name: result.name,
            description: result.description,
            type: type
        };
    }

    async exists(command: { id?: number, name?: string, type?: string }) {
        if (command.id) {
            const result = await db.commands.findUnique({ where: { id: command.id } });

            return !!result;
        }

        const result = await db.commands.findFirst({ where: { name: command.name, type: command.type } });

        return !!result;
    }

    async add(command: AddCommand) {
        if (await this.exists({ name: command.name, type: command.type })) throw new DuplicateError('Command already exists', 'A Command with that Name and Type already exists in the Database!');

        const type = await this.types.getOne({ key: command.type });

        await db.commands.create({ data: { name: command.name, description: command.description, type: type.key } });

        return 'Successfully added Command to Database';
    }

    async remove(command: { id: number }) {
        if (!await this.exists(command)) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

        await db.commands.delete({ where: { id: command.id } });

        return 'Successfully removed Command from Database';
    }

    async update(command: DBCommand) {
        if (!await this.exists(command)) throw new NotFoundError('Command not found', 'Could not find that Command in the Database!');

        await db.commands.update({ where: { id: command.id }, data: { name: command.name, description: command.description, type: command.type } });

        return 'Successfully updated Command in Database';
    }
}

export const Command = new command();