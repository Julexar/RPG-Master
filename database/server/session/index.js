import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors/index.js';
import { SessionPlayer } from './player.js';
import moment from 'moment';
const query = psql.query;

class session {
    constructor() {
        this.players = SessionPlayer;
    }

    async getAll(server, user) {
        if (!user) {
            const results = await query('SELECT * FROM sessions WHERE server_id = $1', [server.id]);

            if (results.length === 0) {
                throw new NotFoundError('No Sessions found', 'Could not find any Sessions in the Database!');
            }

            return results;
        }

        const results = await query('SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2', [server.id, user.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Sessions found', 'Could not find any Sessions of that User in the Database!');
        }

        return results;
    }

    async getOne(server, user, session) {
        if (session.id) {
            const results = await this.query('SELECT * FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]);

            if (results.length === 0) {
                throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');
            }

            return results[0];
        }

        const results = await this.query('SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2 AND name = $3', [
            server.id,
            user.id,
            session.name,
        ]);

        if (results.length === 0) {
            throw new NotFoundError('Session not found', 'Could not find a Session with that name of that User in the Database!');
        }

        return results[0];
    }

    async exists(server, user, session) {
        if (session.id) {
            const results = await this.query('SELECT * FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2 AND name = $3', [
            server.id,
            user.id,
            session.name,
        ]);

        return results.length === 1;
    }

    async add(server, user, session) {
        if (await this.exists(server, user, session)) {
            throw new DuplicateError('Duplicate Session', 'A Session with that name already exists in the Database!');
        }

        const date = moment().format('YYYY-MM-DD HH:mm:ss');

        const sql =
            'INSERT INTO sessions (server_id, gm_id, name, description, levels, players, min_runtime, max_runtime, start_time, end_time, date, channel, difficulty, started, finished) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [
            server.id,
            user.id,
            session.name,
            session.description,
            session.levels,
            session.players,
            session.min_runtime,
            session.max_runtime,
            session.start_time,
            date,
            session.channel,
            session.difficulty,
        ]);

        return 'Successfully added Session to Database';
    }

    async remove(server, user, session) {
        if (!(await this.exists(server, user, session))) {
            throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');
        }

        await query('DELETE FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]);

        return 'Successfully removed Session from Database';
    }

    async update(server, user, session) {
        if (!(await this.exists(server, user, session))) {
            throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');
        }

        const sql =
            'UPDATE sessions SET name = $1, description = $2, levels = $3, players = $4, min_runtime = $5, max_runtime = $6, start_time = $7, end_time = $8, channel = $9, difficulty = $10, started = $11, ended = $12 WHERE server_id = $13 AND id = $14';
        await query(sql, [
            session.name,
            session.description,
            session.levels,
            session.players,
            session.min_runtime,
            session.max_runtime,
            session.start_time,
            session.end_time,
            session.channel,
            session.difficulty,
            session.started,
            session.ended,
            server.id,
            session.id,
        ]);

        return 'Successfully updated Session in Database';
    }
}

const Session = new session();

export { Session };
