import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Race } from '../global';
const query = psql.query;

class ServerRace {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_races WHERE server_id = $1', [server.id]);

        if (results.length === 0) throw new NotFoundError('No Server Races found', 'Could not find any Races registered for that Server in the Database!');

        return Promise.all(
            results.map(async (servRace) => {
                const dbRace = await Race.getOne({ id: servRace.race_id });

                if (servRace.deleted_at) return;

                return {
                    id: servRace.id,
                    server_id: server.id,
                    race_id: dbRace.id,
                    race: dbRace,
                    overwrites: servRace.overwrites,
                    deleted_at: servRace.deleted_at
                };
            })
        );
    }

    static async getOne(server, race) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]);

            if (results.length === 0) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

            const servRace = results[0];
            const dbRace = await Race.getOne({ id: servRace.race_id });

            if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to view has been deleted!');

            return {
                id: servRace.id,
                server_id: server.id,
                race_id: dbRace.id,
                race: dbRace,
                overwrites: servRace.overwrites,
                deleted_at: servRace.deleted_at
            };
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]);

        if (results.length === 0) throw new NotFoundError('Server Race not found', 'Could not find a Race with that name registered for that Server in the Database!');

        const servRace = results[0];

        if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to view has been deleted!')

        return {
            id: servRace.id,
            server_id: server.id,
            race_id: dbRace.id,
            race: dbRace,
            overwrites: servRace.overwrites,
            deleted_at: servRace.deleted_at
        };
    }

    static async exists(server, race) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]);

            return results.length === 1;
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]);

        return results.length === 1;
    }

    static async isDeleted(server, race) {
        if (race.id) {
            const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id])

            return !!results[0].deleted_at;
        }

        const dbRace = await Race.getOne({ name: race.name });
        const results = await query('SELECT * FROM server_races WHERE server_id = $1 AND race_id = $2', [server.id, dbRace.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, race) {
        if (await this.exists(server, race)) throw new DuplicateError('Duplicate Server Race', 'That Race is already registered for that Server in the Database!');

        const dbRace = await Race.getOne(race);
        await query('INSERT INTO server_races (server_id, race_id) VALUES($1, $2)', [server.id, dbRace.id]);

        return 'Successfully registered Race for Server in Database';
    }

    static async remove_final(server, race) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        await query('DELETE FROM server_races WHERE server_id = $1 AND id = $2', [server.id, race.id]);

        return 'Successfully unregistered Race from Server in Database';
    }

    static async remove(server, race) {
        if (!(await this.exists(server, race))) throw new NotFoundError('Server Race not found', 'Could not find that Race registered for that Server in the Database!');

        if (await this.isDeleted(server, race)) throw new BadRequestError('Race deleted', 'The Race you are trying to delete has already been deleted!')

        await query('UPDATE server_races SET deleted_at = $1 WHERE server_id $2 AND id = $3', [Date.now(), server.id, race.id]);

        return 'Successfully marked Race as deleted for Server in Database';
    }
}

export { ServerRace };
