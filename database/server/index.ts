import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { DuplicateError, NotFoundError } from '../../custom/errors';
import { ServerArmor } from './armor.ts';
import { ServerCommand } from './command';
import { ServerCondition } from './condition.ts';
import { ServerDmgtype } from './dmgtype.ts';
import { ServerLog } from './log.ts';
import { ServerMember } from './member.ts';
import { ServerNote } from './note.ts';
import { ServerFeats } from './feat.ts';
import { ServerClass } from './class.ts';
import { ServerSubclass } from './subclass.ts';
import { ServerRace } from './race.ts';
import { ServerSubrace } from './subrace.ts';
import { GameMaster } from './gamemaster.ts';
import { Session } from './session';
import { Prefix } from './prefix.ts';
import { ServerWeapon } from './weapon.ts';
import { ServerSpell } from './spell.ts';
const query = psql.query;

interface DBServer {
    id: bigint;
    name: string;
    gm_roleid: bigint;
    admin_roleid: bigint;
    mod_roleid: bigint;
    sumary_channelid: bigint;
    log_channelid: bigint;
    ping_roleid: bigint;
    hp_method: number;
    leveling_method: number;
    gm_edit: boolean;
    duplicate_sessions: boolean;
    print_logs: boolean;
}

interface AddServer {
    id: bigint;
    name: string;
}

class server {
    armors: typeof ServerArmor;
    commands: typeof ServerCommand;
    conditions: typeof ServerCondition;
    dmgtypes: typeof ServerDmgtype;
    logs: typeof ServerLog;
    members: typeof ServerMember;
    notes: typeof ServerNote;
    feats: typeof ServerFeats;
    gms: typeof GameMaster;
    sessions: typeof Session;
    prefixes: typeof Prefix;
    classes: typeof ServerClass;
    subclasses: typeof ServerSubclass
    races: typeof ServerRace;
    subraces: typeof ServerSubrace;
    weapons: typeof ServerWeapon;
    spells: typeof ServerSpell;
    constructor() {
        this.armors = ServerArmor;
        this.commands = ServerCommand;
        this.conditions = ServerCondition;
        this.dmgtypes = ServerDmgtype;
        this.logs = ServerLog;
        this.members = ServerMember;
        this.notes = ServerNote;
        this.feats = ServerFeats;
        this.gms = GameMaster;
        this.sessions = Session;
        this.prefixes = Prefix;
        this.classes = ServerClass;
        this.subclasses = ServerSubclass;
        this.races = ServerRace;
        this.subraces = ServerSubrace;
        this.weapons = ServerWeapon;
        this.spells = ServerSpell;
    }

    async getAll() {
        const results = await query('SELECT * FROM servers') as DBServer[];

        if (results.length === 0) throw new NotFoundError('No Servers found', 'Could not find any Servers in the Database!');

        return results;
    }

    async getOne(server: Guild) {
        if (server.id) {
            const results = await query('SELECT * FROM servers WHERE id = $1', [server.id]) as DBServer[];

            if (results.length === 0) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM servers WHERE name = $1', [server.name]) as DBServer[];

        if (results.length === 0) throw new NotFoundError('Server not found', 'Could not find a Server with that name in the Database!');

        return results[0];
    }

    async exists(server: Guild | DBServer | AddServer) {
        if (server.id) {
            const results = await query('SELECT * FROM servers WHERE id = $1', [server.id]) as DBServer[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM servers WHERE name = $1', [server.name]) as DBServer[];

        return results.length === 1;
    }

    async add(server: AddServer) {
        if (await this.exists(server)) throw new DuplicateError('Duplicate Server', 'This Server already exists in the Database!');

        const sql = 'INSERT INTO servers (id, name) VALUES ($1, $2, $3)';
        await query(sql, [server.id, server.name]);

        return `Successfully added Server \"${server.name}\" to Database`;
    }

    async remove(server: Guild | DBServer) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('DELETE FROM servers WHERE id = $1', [server.id]);

        return `Successfully removed Server \"${server.name}\" from Database`;
    }

    async update(server: Guild) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        const sql = 'UPDATE servers SET name = $1 WHERE id = $3';
        await query(sql, [server.name, server.id]);

        return `Successfully updated Server \"${server.name}\" in Database`;
    }

    async setDupSessions(server: Guild, bool: boolean) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('UPDATE servers SET duplicate_sessions = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set duplicate Sessions to ${bool}`;
    }

    async setSumChannel(server: Guild, channelId: bigint) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('UPDATE servers SET sumary_channelid = $1 WHERE id = $2', [channelId, server.id]);

        return `Successfully changed the Summary Channel to <#${channelId}>`;
    }

    async setLogChannel(server: Guild, channelId: bigint) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('UPDATE servers SET log_chan = $1 WHERE id = $2', [channelId, server.id]);

        return `Succesfully changed the Log Channel to <#${channelId}>`;
    }

    async setGMEdit(server: Guild, bool: boolean) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('UPDATE servers SET gm_edit = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set the Ability for GMs to edit to ${bool}`;
    }

    async getStaffRole(server: Guild, type?: string) {
        if (!type) {
            const results = await query('SELECT admin_roleid, mod_roleid FROM servers WHERE id = $1', [server.id]) as { admin_roleid: bigint, mod_roleid: bigint }[];

            if (results.length === 0) throw new NotFoundError('No Staff Roles found', 'Could not find any Staff Roles in the Database!');

            return results[0];
        }

        switch (type) {
            case 'admin':
                const adminRoleId = await this.getAdminRole(server);
                return adminRoleId;
            case 'mod':
                const modRoleId = await this.getModRole(server);
                return modRoleId;
            default:
        }
    }

    async getAdminRole(server: Guild) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        const results = await query('SELECT admin_roleid FROM servers WHERE id = $1', [server.id]) as { admin_roleid: bigint }[];

        if (results.length === 0) throw new NotFoundError('No Admin Role found', 'Could not find an Admin Role in the Database!');

        return results[0].admin_roleid;
    }

    async getModRole(server: Guild) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        const results = await query('SELECT mod_roleid FROM servers WHERE id = $1', [server.id]) as { mod_roleid: bigint }[];

        if (results.length === 0) throw new NotFoundError('No Mod Role found', 'Could not find a Mod Role in the Database!');

        return results[0].mod_roleid;
    }

    async setStaffRole(server: Guild, type: string, roleId: bigint) {
        try {
            const staffRoleId = await this.getStaffRole(server, type);

            if (staffRoleId === roleId) throw new DuplicateError('Duplicate Staff Role', 'This Staff Role already exists in the Database!');

            await query(`UPDATE servers SET ${type}_roleid = $1 WHERE id = $2`, [roleId, server.id]);

            return `Successfully set ${type} role to <@&${roleId}>`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            await query(`UPDATE servers SET ${type}_role = $1 WHERE id = $2`, [roleId, server.id]);

            return `Successfully set ${type} role to <@&${roleId}>`;
        }
    }

    async getDMRole(server: Guild) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        const results = await query('SELECT gm_roleid FROM servers WHERE id = $1', [server.id]) as { gm_roleid: bigint }[];

        if (results.length === 0) throw new NotFoundError('No GM Role found', 'Could not find a GM Role in the Database!');

        return results[0].gm_roleid;
    }

    async setDMRole(server: Guild, roleId: bigint) {
        try {
            const dmRoleID = await this.getDMRole(server);
            if (dmRoleID == roleId) throw new DuplicateError('Duplicate GM Role', 'This GM Role already exists in the Database!');

            await query('UPDATE servers SET dm_role = $1 WHERE id = $2', [roleId, server.id]);

            return `Successfully set GM Role to <@&${roleId}>`;
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            await query('UPDATE servers SET dm_role = $1 WHERE id = $2', [roleId, server.id]);

            return `Successfully set GM Role to <@&${roleId}>`;
        }
    }

    async toggleLogs(server: Guild, bool: boolean) {
        if (!(await this.exists(server))) throw new NotFoundError('Server not found', 'Could not find that Server in the Database!');

        await query('UPDATE servers SET print_logs = $1 WHERE id = $2', [bool, server.id]);

        return `Successfully set automatic printing of logs to ${bool}`;
    }
}

const Server = new server();

export { Server };
