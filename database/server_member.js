import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { User } from "./user.js";
const query = psql.query;

class ServerMember {
    static async getAll(server) {
        const results = await query("SELECT * FROM server_members WHERE server_id = $1", [server.id])

        if (results.length === 0) {
            throw new NotFoundError("No Server Members found", "Could not find any Members for that Server in the Database!");
        }

        return Promise.all(results.map(async (servMember) => {
            const dbUser = await User.getOne({id: member.user_id})

            const displayName = !servMember.display_name ? dbUser.display_name : servMember.display_name
            return {
                id: servMember.id,
                user_id: dbUser.id,
                name: dbUser.name,
                display_name: displayName,
                server_id: server.id
            };
        }));
    };

    static async getOne(server, member) {
        if (member.id) {
            const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND id = $2", [server.id, member.id])

            if (results.length === 0) {
                throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
            }

            const servMember = results[0];
            const dbUser = await User.getOne({id: member.user_id})

            const displayName = !servMember.display_name ? dbUser.display_name : servMember.display_name
            return {
                id: servMember.id,
                user_id: dbUser.id,
                name: dbUser.name,
                display_name: displayName,
                server_id: server.id
            };
        }

        const userID = member.user ? member.user.id : member.user_id

        if (userID) {
            const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2", [server.id, userID])

            if (results.length === 0) {
                throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
            }

            const servMember = results[0];
            const dbUser = await User.getOne({id: userID})

            const displayName = !servMember.display_name ? dbUser.display_name : servMember.display_name
            return {
                id: servMember.id,
                user_id: dbUser.id,
                name: dbUser.name,
                display_name: displayName,
                server_id: server.id
            };
        }

        const userName = member.user ? member.user.username : member.name
        const dbUser = await User.getOne({name: userName})

        const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2", [server.id, dbUser.id])

        if (results.length === 0) {
            throw new NotFoundError("Server Member not found", "Could not find a Server Member with that name in the Database!");
        }

        const servMember = results[0];
        const displayName = !servMember.display_name ? dbUser.display_name : servMember.display_name
        return {
            id: servMember.id,
            user_id: dbUser.id,
            name: dbUser.name,
            display_name: displayName,
            server_id: server.id
        };
    };

    static async exists(server, member) {
        if (member.id) {
            const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND id = $2", [server.id, member.id])

            return results.length === 1;
        }

        const userID = member.user ? member.user.id : member.user_id

        if (userID) {
            const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2", [server.id, userID])

            return results.length === 1;
        }

        const userName = member.user ? member.user.username : member.name
        const dbUser = await User.getOne({name: userName})

        const results = await query("SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2", [server.id, dbUser.id])

        return results.length === 1;
    };

    static async add(server, member) {
        if (await this.exists(server, member)) {
            throw new DuplicateError("Duplicate Server Member", `The User \"${member.user.username}\" is already a Member of the Server \"${server.name}\"!`);
        }

        const sql = "INSERT INTO server_members (server_id, user_id, display_name) VALUES($1, $2, $3)";
        const displayName = member.displayName ? member.displayName : member.user.displayName

        if (!(await User.exists(member.user))) {
            await User.add(member.user);
        }

        await query(sql, [server.id, member.user.id, displayName])
    
        return `Successfully added User \"${user.username}\" to Server \"${server.name}\"`;
    };

    static async remove(server, member) {
        if (!(await this.exists(server, member))) {
            throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
        }

        const userID = member.user ? member.user.id : member.user_id
        await query("DELETE FROM server_members WHERE server_id = $1 AND id = $2 AND user_id = $3", [server.id, member.id, userID])

        const name = member.user ? member.user.username : member.displayName
        return `Successfully removed User \"${name}\" from Server \"${server.name}\"`;
    };

    static async update(server, member) {
        if (!(await this.exists(server, member))) {
            throw new NotFoundError("Server Member not found", "Could not find that Server Member in the Database!");
        }

        const userID = member.user ? member.user.id : member.user_id
        const sql = "UPDATE server_members SET display_name = $1 WHERE server_id = $2 AND user_id = $3 AND id = $4";
        await query(sql, [member.displayName, server.id, userID, member.id])

        const name = member.user ? member.user.username : member.displayName
        return `Successfully updated User \"${name}\" in Server \"${server.name}\"`;
    };
};

export { ServerMember };