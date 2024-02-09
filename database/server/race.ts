import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Race } from '..';
const query = psql.query;

interface DBServerRace {
    id: bigint;
    server_id: bigint;
    race_id: bigint;
    overwrites: JSON;
    deleted_at: Date | null;
}

class ServerRace {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_races WHERE server_id = $1', [server.id]) as DBServerRace[];

        if (results.length === 0) throw new NotFoundError('No Server Races found', 'Could not find any Races registered for that Server in the Database!');

        return Promise.all(
            results.map(async (servRace) => {
                const dbRace = await Race.getOne({ id: servRace.race_id });

                if (servRace.deleted_at) return;

                return {
                    id: servRace.id,
                    server_id: server.id,
                    race: dbRace,
                    overwrites: servRace.overwrites,
                    deleted_at: servRace.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, race: { id?: bigint; name?: string }) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]) as DBServerRace[];

            if (results.length === 0) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

            const servRace = results[0];
            const dbRace = await Race.getOne({ id: servRace.race_id });

            if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to view has been deleted!');

            return {
                id: servRace.id,
                server_id: server.id,
                race: dbRace,
                overwrites: servRace.overwrites,
                deleted_at: servRace.deleted_at
            };
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]) as DBServerRace[];

        if (results.length === 0) throw new NotFoundError('Server Race not found', 'Could not find a Race with that name registered for that Server in the Database!');

        const servRace = results[0];

        if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to view has been deleted!')

        return {
            id: servRace.id,
            server_id: server.id,
            race: dbRace,
            overwrites: servRace.overwrites,
            deleted_at: servRace.deleted_at
        };
    }

    static async exists(server: Guild, race: { id?: bigint; name?: string }) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]) as DBServerRace[];

            return results.length === 1;
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]) as DBServerRace[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, race: { id?: bigint; name?: string }) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]) as DBServerRace[];

            return !!results[0].deleted_at;
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]) as DBServerRace[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, race: { name: string }) {
        if (await this.exists(server, race)) throw new DuplicateError('Duplicate Server Race', 'That Race is already registered for that Server in the Database!');

        const dbRace = await Race.getOne(race);
        await query('INSERT INTO server_races (server_id, race_id) VALUES($1, $2)', [server.id, dbRace.id]);

        return 'Successfully registered Race for Server in Database';
    }

    static async remove_final(server: Guild, race: { id?: bigint }) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        await query('DELETE FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]);

        return 'Successfully unregistered Race from Server in Database';
    }

    static async remove(server: Guild, race: { id?: bigint }) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to delete has already been deleted!')

        await query('UPDATE server_races SET deleted_at = $1 WHERE server_id $2 AND id = $3', [Date.now(), server.id, race.id]);

        return 'Successfully marked Race as deleted for Server in Database';
    }

    static async update(server: Guild, race: { id: bigint; overwrites: JSON }) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to update has been deleted!');

        await query('UPDATE server_races SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3', [JSON.stringify(race.overwrites), server.id, race.id]);

        return 'Successfully updated Race for Server in Database';
    }

    static async restore(server: Guild, race: { id: bigint }) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        if (!(await this.isDeleted(server, race))) throw new BadRequestError('Race not deleted', 'The Race you are trying to restore has not been deleted!');

        await query('UPDATE server_races SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, race.id]);

        return 'Successfully restored Race for Server in Database';
    }
}

export { ServerRace };
