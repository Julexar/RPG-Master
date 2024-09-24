import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Damagetype } from '..';
const query = psql.query;

interface DBServerDmgtype {
    id: bigint;
    server_id: bigint;
    dmgtype_id: bigint;
    deleted_at: Date | null;
}

class ServerDmgtype {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1', [server.id]) as DBServerDmgtype[];

        if (results.length === 0) throw new NotFoundError('No Server Damagetypes found', 'Could not find any Damagetypes for that Server in the Database!');

        return Promise.all(
            results.map(async (servDmgtype) => {
                const dbDmgtype = await Damagetype.getOne({ id: servDmgtype.dmgtype_id });

                if (servDmgtype.deleted_at) return;

                return {
                    id: servDmgtype.id,
                    server_id: server.id,
                    dmgtype: dbDmgtype,
                    deleted_at: servDmgtype.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, dmgtype: { id?: bigint; name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]) as DBServerDmgtype[];

            if (results.length === 0) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

            const servDmgtype = results[0];
            const dbDmgtype = await Damagetype.getOne({ id: servDmgtype.dmgtype_id });

            if (servDmgtype.deleted_at) throw new BadRequestError('Damagetype deleted', 'The Damagetype you are trying to view has been deleted!')

            return {
                id: servDmgtype.id,
                server_id: server.id,
                dmgtype: dbDmgtype,
                deleted_at: servDmgtype.deleted_at
            };
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]) as DBServerDmgtype[];

        if (results.length === 0) throw new NotFoundError('Server Damagetype not found', 'Could not find a Damagetype with that name for that Server in the Database!');

        const servDmgtype = results[0];

        if (servDmgtype.deleted_at) throw new BadRequestError('Damagetype deleted', 'The Damagetype you are trying to view has been deleted!')

        return {
            id: servDmgtype.id,
            server_id: server.id,
            dmgtype: dbDmgtype,
            deleted_at: servDmgtype.deleted_at
        };
    }

    static async exists(server: Guild, dmgtype: { id?: bigint; name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]) as DBServerDmgtype[];

            return results.length === 1;
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]) as DBServerDmgtype[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, dmgtype: { id?: bigint; name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND id = $2', [server.id, dmgtype.id]) as DBServerDmgtype[];

            return !!results[0].deleted_at;
        }

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const results = await query('SELECT * FROM server_damagetypes WHERE server_id = $1 AND dmgtype_id = $2', [server.id, dbDmgtype.id]) as DBServerDmgtype[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, dmgtype: { name: string }) {
        if (await this.exists(server, dmgtype)) throw new DuplicateError('Duplicate Server Damagetype', 'This Damagetype already exists for that Server in the Database!');

        const dbDmgtype = await Damagetype.getOne({ name: dmgtype.name });
        const sql = 'INSERT INTO server_damagetypes (server_id, dmgtype_id) VALUES ($1, $2)';
        await query(sql, [server.id, dbDmgtype.id]);

        return 'Successfully added Damagetype to Server';
    }

    static async remove_final(server: Guild, dmgtype: { id: bigint }) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

        const sql = 'DELETE FROM server_damagetypes WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully removed Damagetype from Server';
    }

    static async remove(server: Guild, dmgtype: { id: bigint }) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');

        if (await this.isDeleted(server, dmgtype)) throw new BadRequestError('Server Damagetype deleted', 'The Server Damagetype you are trying to remove has already been deleted!');

        const sql = 'UPDATE server_damagetypes SET deleted_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [Date.now(), server.id, dmgtype.id]);

        return 'Successfully marked Damagetype as deleted in Server';
    }

    static async restore(server: Guild, dmgtype: { id: bigint }) {
        if (!(await this.exists(server, dmgtype))) throw new NotFoundError('Server Damagetype not found', 'Could not find that Damagetype for that Server in the Database!');
        
        if (!(await this.getOne(server, dmgtype)).deleted_at) throw new BadRequestError('Damagetype not deleted', 'That Damagetype for that Server is not deleted!');

        const sql = 'UPDATE server_damagetypes SET deleted_at = NULL WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, dmgtype.id]);

        return 'Successfully restored Damagetype in Server';
    }
}

export { ServerDmgtype };
