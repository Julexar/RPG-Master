import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors/index.js';
const query = psql.query;

class ServerCommandRestriction {
    static async getAll(command) {
        const results = await query('SELECT * FROM server_command_restrictions WHERE cmd_id = $1', [command.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Restrictions found', 'Could not find any Restrictions for that Server Command in the Database!');
        }

        return results.map(restriction => {
            return {
                type: restriction.type,
                id: restriction.id,
                permission: restriction.permission,
            };
        });
    }

    static async getOne(command, rest) {
        if (rest.id) {
            const results = await query('SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2', [command.id, rest.id]);

            if (results.length === 0) {
                throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');
            }

            const restriction = results[0];
            return {
                type: restriction.type,
                id: restriction.id,
                permission: restriction.permission,
            };
        }

        const results = await query('SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2', [command.id, rest.type]);

        if (results.length === 0) {
            throw new NotFoundError('No Restrictions found', 'Could not find any Restrictions of that Type for the Server Command in the Database!');
        }

        return results.map(restriction => {
            return {
                type: restriction.type,
                id: restriction.id,
                permission: restriction.permission,
            };
        });
    }

    static async exists(command, rest) {
        if (rest.id) {
            const results = await query('SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2', [command.id, rest.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM server_command_restrictions WHERE cmd_id = $1 AND type = $2', [command.id, rest.type]);

        return results.length >= 1;
    }

    static async add(server, command, rest) {
        try {
            const restriction = await this.getOne(command, rest);

            if (restriction.permission === rest.permission) {
                throw new DuplicateError('Duplicate Restriction', 'That Restriction already exists for that Server Command in the Database!');
            }

            await query('UPDATE server_command_restrictions SET permission = $1 WHERE cmd_id = $2 AND id = $3', [
                rest.permission,
                command.id,
                rest.id,
            ]);

            return `Successfully updated restrictions of Command \"${command.name}\" in Server \"${server.name}\"`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            await query('INSERT INTO server_command_restrictions VALUES($1, $2, $3, $4)', [command.id, rest.type, rest.id, rest.permission]);

            return `Successfully added restriction to Command \"${command.name}\" in Server \"${server.name}\"`;
        }
    }

    static async remove(server, command, rest) {
        if (!(await this.exists(command, rest))) {
            throw new NotFoundError('Restriction not found', 'Could not find that Restriction for that Server Command in the Database!');
        }

        await query('DELETE FROM server_command_restrictions WHERE cmd_id = $1 AND id = $2', [command.id, rest.id]);

        return `Successfully removed restriction of Command \"${cmd.name}\" in Server \"${server.name}\"`;
    }

    static async toggle(command) {
        const sql = 'UPDATE server_command_restrictions SET enabled = NOT enabled WHERE cmd_id = $1';
        await query(sql, [command]);

        return `Successfully toggled restrictions of Command \"${command.name}\" in Server \"${server.name}\"`;
    }
}

export { ServerCommandRestriction };
