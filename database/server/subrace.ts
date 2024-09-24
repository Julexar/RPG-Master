import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Subrace } from '..';
const query = psql.query;

interface DBServerSubrace {
    id: bigint;
    server_id: bigint;
    race_id: bigint;
    sub_id: bigint;
    overwrites: JSON;
    deleted_at: Date | null;
}

class ServerSubrace {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_subraces WHERE server_id = $1', [server.id]) as DBServerSubrace[];

        if (results.length === 0) throw new NotFoundError('No Server Subraces found', 'Could not find any Subraces registered for that Server in the Database!');

        return Promise.all(
            results.map(async (serverSub) => {
                const dbSub = await Subrace.getOne({ id: serverSub.race_id }, { id: serverSub.sub_id });

                if (serverSub.deleted_at) return;

                return {
                    id: serverSub.id,
                    server_id: server.id,
                    race_id: serverSub.race_id,
                    sub: dbSub,
                    overwrites: serverSub.overwrites,
                    deleted_at: serverSub.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, sub: { id?: bigint, race_id?: bigint, name?: string }) {
        if (sub.id) {
            const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND id = $2', [server.id, sub.id]) as DBServerSubrace[];

            if (results.length === 0) throw new NotFoundError('Server Subrace not found', 'Could not find that Subrace registered for that Server in the Database!');

            const serverSub = results[0];
            const dbSub = await Subrace.getOne({ id: serverSub.race_id }, { id: serverSub.sub_id });

            if (serverSub.deleted_at) throw new BadRequestError('Server Subrace deleted', 'The Subrace you are trying to view has been deleted!');

            return {
                id: serverSub.id,
                server_id: server.id,
                race_id: serverSub.race_id,
                sub: dbSub,
                overwrites: serverSub.overwrites,
                deleted_at: serverSub.deleted_at
            };
        }

        if (!sub.race_id) throw new BadRequestError('Invalid Race', 'You must provide a valid RaceID to view a Server Subrace!');

        const dbSub = await Subrace.getOne({ id: sub.race_id }, { name: sub.name });
        const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND sub_id = $2', [server.id, dbSub.id]) as DBServerSubrace[];

        if (results.length === 0) throw new NotFoundError('Server Subrace not found', 'Could not find a Subrace with that name registered for that Server in the Database!');

        const serverSub = results[0];

        if (serverSub.deleted_at) throw new BadRequestError('Server Subrace deleted', 'The Subrace you are trying to view has been deleted!');

        return {
            id: serverSub.id,
            server_id: server.id,
            race_id: serverSub.race_id,
            sub: dbSub,
            overwrites: serverSub.overwrites,
            deleted_at: serverSub.deleted_at
        };
    }

    static async exists(server: Guild, sub: { id?: bigint, race_id?: bigint, name?: string }) {
        if (sub.id) {
            const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND id = $2', [server.id, sub.id]) as DBServerSubrace[];

            return results.length === 1;
        }

        if (!sub.race_id) throw new BadRequestError('Invalid Race', 'You must provide a valid RaceID to check if a Server Subrace exists!');

        const dbSub = await Subrace.getOne({ id: sub.race_id }, { name: sub.name });
        const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND sub_id = $2', [server.id, dbSub.id]) as DBServerSubrace[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, sub: { id?: bigint, race_id?: bigint, name?: string }) {
        if (sub.id) {
            const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND id = $2', [server.id, sub.id]) as DBServerSubrace[];

            return !!results[0].deleted_at;
        }

        if (!sub.race_id) throw new BadRequestError('Invalid Race', 'You must provide a valid RaceID to check if a Server Subrace is deleted!');

        const dbSub = await Subrace.getOne({id: sub.race_id}, {name: sub.name});
        const results = await query('SELECT * FROM server_subraces WHERE server_id = $1 AND sub_id = $2', [server.id, dbSub.id]) as DBServerSubrace[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, sub: { race_id: bigint; name: string }) {
        if (await this.exists(server, sub)) throw new DuplicateError('Duplicate Server Subrace', 'That Subrace is already registered for that Server in the Database!');

        const dbSub = await Subrace.getOne({ id: sub.race_id }, { name: sub.name });
        const sql = 'INSERT INTO server_subraces (server_id, race_id, sub_id) VALUES($1, $2, $3)';
        await query(sql, [server.id, sub.race_id, dbSub.id]);

        return 'Successfully registered Subrace for Server in Database';
    }

    static async remove(server: Guild, sub: { id: bigint }) {
        if (!(await this.exists(server, sub))) throw new NotFoundError('Server Subrace not found', 'Could not find that Subrace registered for that Server in the Database!');

        if (await this.isDeleted(server, sub)) throw new BadRequestError('Server Subrace deleted', 'The Subrace you are trying to delete has already been deleted!');

        await query('UPDATE server_subraces SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, sub.id]);

        return 'Successfully marked Subrace as deleted for Server in Database';
    }

    static async remove_final(server: Guild, sub: { id: bigint }) {
        if (!(await this.exists(server, sub))) throw new NotFoundError('Server Subrace not found', 'Could not find that Subrace registered for that Server in the Database!');

        await query('DELETE FROM server_subraces WHERE server_id = $1 AND id = $2', [server.id, sub.id]);

        return 'Successfully unregistered Subrace from Server in Database';
    }

    static async update(server: Guild, sub: DBServerSubrace) {
        if (!(await this.exists(server, sub))) throw new NotFoundError('Server Subrace not found', 'Could not find that Subrace registered for that Server in the Database!');

        if (await this.isDeleted(server, sub)) throw new BadRequestError('Server Subrace deleted', 'The Subrace you are trying to update has been deleted!');

        const sql = 'UPDATE server_subraces SET overwrites = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [sub.overwrites, server.id, sub.id]);

        return 'Successfully updated Subrace for Server in Database';
    }

    static async restore(server: Guild, sub: { id: bigint }) {
        if (!(await this.exists(server, sub))) throw new NotFoundError('Server Subrace not found', 'Could not find that Subrace registered for that Server in the Database!');

        if (!(await this.isDeleted(server, sub))) throw new BadRequestError('Server Subrace not deleted', 'The Subrace you are trying to restore has not been deleted!');

        await query('UPDATE server_subraces SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, sub.id]);

        return 'Successfully restored Subrace for Server in Database';
    }
}

export { ServerSubrace };
