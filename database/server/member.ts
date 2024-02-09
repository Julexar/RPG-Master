import { Guild, GuildMember} from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError} from '../../custom/errors';
import { User } from '..';
const query = psql.query;

interface DBServerMember {
    id: bigint;
    server_id: bigint;
    user_id: bigint;
    display_name: string | null;
}

class ServerMember {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_members WHERE server_id = $1', [server.id]) as DBServerMember[];

        if (results.length === 0) throw new NotFoundError('No Server Members found', 'Could not find any Members for that Server in the Database!');

        return Promise.all(
            results.map(async (servMember) => {
                const dbUser = await User.getOne({ id: servMember.user_id });

                return {
                    id: servMember.id,
                    server_id: server.id,
                    user: dbUser,
                    displayName: servMember.display_name
                };
            })
        );
    }

    static async getOne(server: Guild, member: GuildMember) {
        if (member.id) {
            const results = await query('SELECT * FROM server_members WHERE server_id = $1 AND id = $2', [server.id, member.id]) as DBServerMember[];

            if (results.length === 0) throw new NotFoundError('Server Member not found', 'Could not find that Server Member in the Database!');

            const servMember = results[0];
            const dbUser = await User.getOne({ id: member.user.id });

            return {
                id: servMember.id,
                server_id: server.id,
                user: dbUser,
                displayName: servMember.display_name
            };
        }

        const dbUser = await User.getOne({ name: member.user.username });
        const results = await query('SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2', [server.id, dbUser.id]) as DBServerMember[];

        if (results.length === 0) throw new NotFoundError('Server Member not found', 'Could not find a Server Member with that name in the Database!');

        const servMember = results[0];

        return {
            id: servMember.id,
            server_id: server.id,
            user: dbUser,
            displayName: servMember.display_name
        };
    }

    static async exists(server: Guild, member: GuildMember) {
        if (member.id) {
            const results = await query('SELECT * FROM server_members WHERE server_id = $1 AND id = $2', [server.id, member.id]) as DBServerMember[];

            return results.length === 1;
        }

        const dbUser = await User.getOne({ name: member.user.username });

        const results = await query('SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2', [server.id, dbUser.id]) as DBServerMember[];

        return results.length === 1;
    }

    static async add(server: Guild, member: GuildMember) {
        if (await this.exists(server, member)) throw new DuplicateError('Duplicate Server Member', `The User \"${member.user.username}\" is already a Member of the Server \"${server.name}\"!`);

        const sql = 'INSERT INTO server_members (server_id, user_id, display_name) VALUES($1, $2, $3)';

        if (!(await User.exists(member.user))) await User.add(member.user);

        const displayName = member.displayName || member.user.username;

        await query(sql, [server.id, member.user.id, displayName]);

        return `Successfully added User \"${displayName}\" to Server \"${server.name}\"`;
    }

    static async remove(server: Guild, member: GuildMember) {
        if (!(await this.exists(server, member))) throw new NotFoundError('Server Member not found', 'Could not find that Server Member in the Database!');

        await query('DELETE FROM server_members WHERE server_id = $1 AND id = $2', [server.id, member.id]);

        const name = member.displayName || member.user.displayName;
        return `Successfully removed User \"${name}\" from Server \"${server.name}\"`;
    }

    static async update(server: Guild, member: GuildMember) {
        if (!(await this.exists(server, member))) throw new NotFoundError('Server Member not found', 'Could not find that Server Member in the Database!');

        const sql = 'UPDATE server_members SET display_name = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [member.displayName, server.id, member.id]);

        const name = member.displayName || member.user.displayName;
        return `Successfully updated User \"${name}\" in Server \"${server.name}\"`;
    }
}

export { ServerMember };
