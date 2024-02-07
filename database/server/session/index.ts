import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { SessionPlayer } from './player.ts';
import moment from 'moment';
const query = psql.query;

interface DBSession {
    id: bigint;
    server_id: bigint;
    gm_id: bigint;
    name: string;
    description: string;
    levels: string;
    players: string;
    min_runtime: number;
    max_runtime: number;
    date: EpochTimeStamp;
    started_at: EpochTimeStamp;
    ended_at: EpochTimeStamp;
    channel_id: bigint;
    difficulty: number;
    deleted_at: Date | null;
}

interface AddSession {
    name: string;
    description: string;
    levels: string;
    players: string;
    min_runtime: number;
    max_runtime: number;
    date: EpochTimeStamp;
    channel_id: bigint;
    difficulty: number;
}

class session {
    players: typeof SessionPlayer;
    constructor() {
        this.players = SessionPlayer;
    }

    async getAll(server: { id: bigint }, user: { id: bigint }) {
        if (!user) {
            const results = await query('SELECT * FROM sessions WHERE server_id = $1', [server.id]) as DBSession[];

            if (results.length === 0) throw new NotFoundError('No Sessions found', 'Could not find any Sessions in the Database!');

            return results.map((session) => {
                if (session.deleted_at) return;

                return session;
            });
        }

        const results = await query('SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2', [server.id, user.id]) as DBSession[];

        if (results.length === 0) throw new NotFoundError('No Sessions found', 'Could not find any Sessions of that User in the Database!');

        return results.map((session) => {
            if (session.deleted_at) return;

            return session;
        });
    }

    async getOne(server: { id: bigint }, user: { id: bigint }, session: { id?: bigint; name?: string }) {
        if (session.id) {
            const results = await query('SELECT * FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]) as DBSession[];	

            if (results.length === 0) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Session deleted', 'That Session has been deleted from the Database!');

            return results[0];
        }

        const sql = 'SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2 AND name = $3';
        const results = await query(sql, [server.id, user.id, session.name]) as DBSession[];

        if (results.length === 0) throw new NotFoundError('Session not found', 'Could not find a Session with that name of that User in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Session deleted', 'That Session has been deleted from the Database!');

        return results[0];
    }

    async exists(server: { id: bigint }, user: { id: bigint }, session: { id?: bigint; name?: string }) {
        if (session.id) {
            const results = await query('SELECT * FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]) as DBSession[];

            return results.length === 1;
        }

        const sql = 'SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2 AND name = $3';
        const results = await query(sql, [server.id, user.id, session.name]) as DBSession[];

        return results.length === 1;
    }

    async isDeleted(server: { id: bigint }, user: { id: bigint }, session: { id?: bigint; name?: string }) {
        if (session.id) {
            const results = await query('SELECT * FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]) as DBSession[];

            return !!results[0].deleted_at;
        }

        const sql = 'SELECT * FROM sessions WHERE server_id = $1 AND gm_id = $2 AND name = $3';
        const results = await query(sql, [server.id, user.id, session.name]) as DBSession[];

        return !!results[0].deleted_at;
    }

    async add(server: { id: bigint }, user: { id: bigint }, session: AddSession) {
        if (await this.exists(server, user, session)) throw new DuplicateError('Duplicate Session', 'A Session with that name already exists in the Database!');

        const date = moment().format('YYYY-MM-DD HH:mm:ss');

        const sql = 'INSERT INTO sessions (server_id, gm_id, name, description, levels, players, min_runtime, max_runtime, date, channelid, difficulty) VALUES($1, $2, $3, $4, $5, $6, $7, $8)';
        await query(sql, [
            server.id,
            user.id,
            session.name,
            session.description,
            session.levels,
            session.players,
            session.min_runtime,
            session.max_runtime,
            date,
            session.channel_id,
            session.difficulty
        ]);

        return 'Successfully added Session to Database';
    }

    async remove(server: { id: bigint }, user: { id: bigint }, session: { id: bigint }) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        if (await this.isDeleted(server, user, session)) throw new BadRequestError('Session deleted', 'That Session has already been deleted from the Database!');

        const sql = 'UPDATE sessions SET deleted_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [Date.now(), server.id, session.id]);

        return 'Successfully marked Session as deleted in Database';
    }

    async remove_final(server: { id: bigint }, user: { id: bigint }, session: { id: bigint }) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        await query('DELETE FROM sessions WHERE server_id = $1 AND id = $2', [server.id, session.id]);

        return 'Successfully removed Session from Database';
    }

    async update(server: { id: bigint }, user: { id: bigint }, session: DBSession) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        if (await this.isDeleted(server, user, session)) throw new BadRequestError('Session deleted', 'That Session has been deleted from the Database!');

        const sql = 'UPDATE sessions SET name = $1, description = $2, levels = $3, players = $4, min_runtime = $5, max_runtime = $6, started_at = $7, ended_at = $8, channelid = $9, difficulty = $10 WHERE server_id = $11 AND id = $12';
        await query(sql, [
            session.name,
            session.description,
            session.levels,
            session.players,
            session.min_runtime,
            session.max_runtime,
            session.started_at,
            session.ended_at,
            session.channel_id,
            session.difficulty,
            server.id,
            session.id,
        ]);

        return 'Successfully updated Session in Database';
    }

    async restore(server: { id: bigint }, user: { id: bigint }, session: { id: bigint }) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        if (!(await this.isDeleted(server, user, session))) throw new BadRequestError('Session not deleted', 'That Session has not been deleted from the Database!');

        const sql = 'UPDATE sessions SET deleted_at = NULL WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, session.id]);

        return 'Successfully restored Session in Database';
    }

    async start(server: { id: bigint }, user: { id: bigint }, session: { id: bigint }) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        if (await this.isDeleted(server, user, session)) throw new BadRequestError('Session deleted', 'That Session has been deleted from the Database!');

        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = 'UPDATE sessions SET started_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [date, server.id, session.id]);

        return 'Successfully started Session';
    }

    async end(server: { id: bigint }, user: { id: bigint }, session: { id: bigint }) {
        if (!(await this.exists(server, user, session))) throw new NotFoundError('Session not found', 'Could not find that Session in the Database!');

        if (await this.isDeleted(server, user, session)) throw new BadRequestError('Session deleted', 'That Session has been deleted from the Database!');

        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = 'UPDATE sessions SET ended_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [date, server.id, session.id]);

        return 'Successfully ended Session';
    }
}

const Session = new session();

export { Session };
