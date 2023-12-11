import { psql } from '../psql.js';
import { DuplicateError, NotFoundError } from '../../custom/errors/index.js';
import { ServerCommand } from './command/index.js';
import { ServerLog } from './log.js';
import { ServerMember } from './member.js';
import { ServerNote } from './note.js';
import { ServerFeats } from './feat.js';
import { GameMaster } from './gamemaster.js';
import { Session } from './session/session.js';
import { Prefix } from './prefix.js';
const query = psql.query;

class server {
    constructor() {
        this.commands = ServerCommand;
        this.logs = ServerLog;
        this.members = ServerMember;
        this.notes = ServerNote;
        this.feats = ServerFeats;
        this.gms = GameMaster;
        this.sessions = Session;
        this.prefixes = Prefix;
    }

    async getAll() {
        const results = await query('SELECT * FROM servers');

        if (results.length === 0) {
            throw new NotFoundError('No Servers found', 'Could not find any Servers in the Database!');
        }

        return results;
    }

    async getOne(server) {
        if (server.id) {
            const results = await query('SELECT * FROM servers WHERE id = $1', [server.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM servers WHERE name = $1', [server.name]);

        if (results.length === 0) {
            throw new NotFoundError('Server not found', 'Could not find a Server with that name in the Database!');
        }

        return results[0];
    }

    async exists(server) {
        if (server.id) {
            const results = await query('SELECT * FROM servers WHERE id = $1', [server.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM servers WHERE name = $1', [server.name]);

        return results.length === 1;
    }

    async add(server) {
        if (await this.exists(server)) {
            throw new DuplicateError('Duplicate Server', 'This Server already exists in the Database!');
        }

        const sql = 'INSERT INTO servers (id, name, dm_role) VALUES ($1, $2, $3)';
        await query(sql, [server.id, server.name, server.dm_role]);

        return `Successfully added Server \"${server.name}\" to Database`;
    }

    async remove(server) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('DELETE FROM servers WHERE id = $1', [server.id]);

        return `Successfully removed Server \"${server.name}\" from Database`;
    }

    async update(server) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        const sql = 'UPDATE servers SET name = $1, dm_role = $2 WHERE id = $3';
        await query(sql, [server.name, server.dm_role, server.id]);

        return `Successfully updated Server \"${server.name}\" in Database`;
    }

    async setDupSessions(server, bool) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('UPDATE servers SET dup_sessions = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set duplicate Sessions to ${bool}`;
    }

    async setSumChannel(server, channel) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('UPDATE servers SET sum_chan = $1 WHERE id = $2', [channel.id, server.id]);

        return `Successfully changed the Summary Channel to <#${channel.id}>`;
    }

    async setLogChannel(server, channel) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('UPDATE servers SET log_chan = $1 WHERE id = $2', [channel.id, server.id]);

        return `Succesfully changed the Log Channel to <#${channel.id}>`;
    }

    async setGMEdit(server, bool) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('UPDATE servers SET gm_edit = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set the Ability for GMs to edit to ${bool}`;
    }

    async getStaffRole(server, type, role) {
        if (!type && !role) {
            const results = await query('SELECT admin_role, mod_role FROM servers WHERE id = $1', [server.id]);

            if (results.length === 0) {
                throw new NotFoundError('No Staff Roles found', 'Could not find any Staff Roles in the Database!');
            }

            return results;
        }

        const results = await query(`SELECT ${type}_role FROM servers WHERE id = $1`, [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('Staff Role not found', 'Could not find that Staff Role in the Database!');
        }

        return results[0];
    }

    async setStaffRole(server, type, role) {
        try {
            const staffRole = await this.getStaffRole(server, type);

            if ((staffRole.admin_role || staffRole.mod_role) && (staffRole.admin_role == role.id || staffRole.mod_role == role.id)) {
                throw new DuplicateError('Duplicate Staff Role', 'This Staff Role already exists in the Database!');
            }

            await query(`UPDATE servers SET ${type}_role = $1 WHERE id = $2`, [role.id, server.id]);

            return `Successfully set ${type} role to <@&${role.id}>`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            await query(`UPDATE servers SET ${type}_role = $1 WHERE id = $2`, [role.id, server.id]);

            return `Successfully set ${type} role to <@&${role.id}>`;
        }
    }

    async getDMRole(server) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        const results = await query('SELECT dm_role FROM servers WHERE id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No GM Role found', 'Could not find a GM Role in the Database!');
        }

        return results[0];
    }

    async setDMRole(server, role) {
        try {
            const dmRoleID = await this.getDMRole(server);
            if (dmRoleID == role.id) {
                throw new DuplicateError('Duplicate GM Role', 'This GM Role already exists in the Database!');
            }

            await query('UPDATE servers SET dm_role = $1 WHERE id = $2', [role.id, server.id]);

            return `Successfully set GM Role to <@&${role.id}>`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            await query('UPDATE servers SET dm_role = $1 WHERE id = $2', [role.id, server.id]);

            return `Successfully set GM Role to <@&${role.id}>`;
        }
    }

    async toggleLogs(server, bool) {
        if (!(await this.exists(server))) {
            throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');
        }

        await query('UPDATE servers SET print_logs = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set automatic printing of logs to ${bool}`;
    }
}

const Server = new server();

export { Server };
