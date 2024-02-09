import { Guild, User } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../custom/errors';
import { DBSession } from './session';
import moment from 'moment';
const query = psql.query;

interface DBServerGM {
    id: bigint;
    server_id: bigint;
    user_id: bigint;
    xp: number;
    suggestions: boolean;
    session_id: bigint;
    created_at: Date;
}

class GameMaster {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_gms WHERE server_id = $1', [server.id]) as DBServerGM[];

        if (results.length === 0) throw new NotFoundError('No GMs found', 'Could not find any GMs in the Database!');

        return results;
    }

    static async getOne(server: Guild, user: User) {
        const results = await query('SELECT * FROM server_gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]) as DBServerGM[];

        if (results.length === 0) throw new NotFoundError('GM not found', 'Could not find that GM in the Database!');

        return results[0];
    }

    static async exists(server: Guild, user: User) {
        const results = await query('SELECT * FROM server_gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]) as DBServerGM[];

        return results.length === 1;
    }

    static async add(server: Guild, user: User) {
        if (await this.exists(server, user)) throw new DuplicateError('Duplicate GM', 'That GM already exists in the Database!');

        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        await query('INSERT INTO server_gms (server_id, user_id, created_at) VALUES ($1, $2, $3)', [server.id, user.id, date]);

        return `Successfully registered \"${user.displayName}\" as GM in Database`;
    }

    static async remove(server: Guild, user: User) {
        if (!(await this.exists(server, user))) throw new NotFoundError('GM not found', 'Could not find that GM in the Database!');

        await query('DELETE FROM server_gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]);

        return `Successfully unregistered \"${user.displayName} as GM in Database`;
    }

    static async editXP(server: Guild, user: User, xp: number) {
        const gm = await this.getOne(server, user);

        if (gm.xp - xp < 0) throw new ForbiddenError('Not enough XP', 'You do not have enough GMXP!');
        else gm.xp += xp;

        await query('UPDATE server_gms SET xp = $1 WHERE server_id = $2 AND user_id = $3', [gm.xp, server.id, user.id]);

        return `Successfully set XP of GM \"${user.displayName}\" to ${gm.xp}`;
    }

    static async toggleSuggestion(server: Guild, user: User) {
        const gm = await this.getOne(server, user);

        await query('UPDATE server_gms SET suggestions = $1 WHERE server_id = $2 AND user_id = $3', [!gm.suggestions, server.id, user.id]);

        return `Successfully set receiving of suggestions to ${!gm.suggestions}`;
    }

    static async setSession(server: Guild, user: User, session: DBSession) {
        if (!(await this.exists(server, user))) throw new NotFoundError('GM not found', 'Could not find that GM in the Database!');

        await query('UPDATE server_gms SET session_id = $1 WHERE server_id = $1 AND user_id = $2', [session.id, server.id, user.id]);

        return `Successfully changed active Session to ${session.name}`;
    }
}

export { GameMaster };
