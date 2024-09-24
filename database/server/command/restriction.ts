import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
const query = psql.query;

interface DBCommandRestriction {
    key: bigint;
    command_id: bigint;
    id: bigint;
    type: number;
    permission: boolean;
    deleted_at: Date | null;
}

interface AddCommandRestriction {
    id: bigint;
    type: number;
    permission: boolean;
}

class ServerCommandRestriction {
    static async getAll(command: { id: bigint }) {
        const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1', [command.id]) as DBCommandRestriction[];

        if (results.length === 0) throw new NotFoundError('No Restrictions found', 'Could not find any Restrictions for that Server Command in the Database!');

        return results.map((restriction) => {
            if (restriction.deleted_at) return;

            return {
                id: restriction.id,
                type: restriction.type,
                permission: restriction.permission
            };
        })
    }

    static async getOne(command: { id: bigint }, rest: { key?: bigint, type?: number }) {
        if (rest.key) {
            const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1 AND key = $2', [command.id, rest.key]) as DBCommandRestriction[];

            if (results.length === 0) throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');

            const restriction = results[0];

            if (restriction.deleted_at) throw new BadRequestError('Restriction deleted', 'The Restriction you are trying to view has been deleted for that Server Command in the Database!');

            return {
                type: restriction.type,
                id: restriction.id,
                permission: restriction.permission
            };
        }

        const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1 AND type = $2', [command.id, rest.type]) as DBCommandRestriction[];

        if (results.length === 0) throw new NotFoundError('No Restrictions found', 'Could not find any Restrictions of that Type for the Server Command in the Database!');

        return results.map((restriction) => {
            if (restriction.deleted_at) return;

            return {
                type: restriction.type,
                id: restriction.id,
                permission: restriction.permission
            };
        });
    }

    static async exists(command: { id: bigint }, rest: { key?: bigint, type?: number }) {
        if (rest.key) {
            const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1 AND key = $2', [command.id, rest.key]) as DBCommandRestriction[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1 AND type = $2', [command.id, rest.type]) as DBCommandRestriction[];

        return results.length >= 1;
    }

    static async isDeleted(command: { id: bigint }, rest: { key: bigint }) {
        const results = await query('SELECT * FROM server_command_restrictions WHERE command_id = $1 AND key = $2', [command.id, rest.key]) as DBCommandRestriction[];

        return !!results[0].deleted_at;
    }

    static async add(command: { id: bigint, name: string }, rest: AddCommandRestriction) {
        try {
            const restriction = await this.getOne(command, rest) as DBCommandRestriction;

            if (restriction.permission === rest.permission) throw new DuplicateError('Duplicate Restriction', 'That Restriction already exists for that Server Command in the Database!');

            const sql = 'UPDATE server_command_restrictions SET permission = $1 WHERE command_id = $2 AND key = $3';
            await query(sql, [rest.permission, command.id, restriction.key]);

            return `Successfully updated restrictions of Command \"${command.name}\" in Server`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO server_command_restrictions (command_id, type, id, permission) VALUES($1, $2, $3, $4)';
            await query(sql, [command.id, rest.type, rest.id, rest.permission]);

            return `Successfully added restriction to Command \"${command.name}\" in Server`;
        }
    }

    static async remove(command: { id: bigint }, rest: { key: bigint }) {
        if (!(await this.exists(command, rest))) throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');

        if (await this.isDeleted(command, rest)) throw new BadRequestError('Restriction deleted', 'The Restriction you are trying to remove has already been deleted for that Server Command in the Database!');

        const sql = 'UPDATE server_command_restrictions SET deleted_at = $1 WHERE command_id = $2 AND key = $3';
        await query(sql, [Date.now(), command.id, rest.key]);

        return `Successfully removed restriction of Command in Server`;
    }

    static async remove_final(command: { id: bigint, name: string }, rest: { key: bigint }) {
        if (!(await this.exists(command, rest))) throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');

        await query('DELETE FROM server_command_restrictions WHERE command_id = $1 AND id = $2', [command.id, rest.key]);

        return `Successfully removed restriction of Command \"${command.name}\" in Server`;
    }

    static async restore(command: { id: bigint, name: string }, rest: { key: bigint }) {
        if (!(await this.exists(command, rest))) throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');

        if (!(await this.isDeleted(command, rest))) throw new BadRequestError('Restriction not deleted', 'The Restriction you are trying to restore has not been deleted for that Server Command in the Database!');

        const sql = 'UPDATE server_command_restrictions SET deleted_at = $1 WHERE command_id = $2 AND key = $3';
        await query(sql, [null, command.id, rest.key]);

        return `Successfully restored restriction of Command \"${command.name}\" in Server`;
    }
}

export { ServerCommandRestriction };