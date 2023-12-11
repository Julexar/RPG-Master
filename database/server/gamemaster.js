import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../custom/errors/index.js';
const query = psql.query;

class GameMaster {
    static async getAll(server) {
        const results = await query('SELECT * FROM gms WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No GMs found', 'Could not find any GMs in the Database!');
        }

        return results;
    }

    static async getOne(server, user) {
        const results = await query('SELECT * FROM gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]);

        if (results.length === 0) {
            throw new NotFoundError('GM not found', 'Could not find that GM in the Database!');
        }

        return results[0];
    }

    static async exists(server, user) {
        const results = await query('SELECT * FROM gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]);

        return results.length === 1;
    }

    static async add(server, user) {
        if (await this.exists(server, user)) {
            throw new DuplicateError('Duplicate GM', 'That GM already exists in the Database!');
        }

        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        await query('INSERT INTO gms (server_id, user_id, date) VALUES ($1, $2, $3)', [server.id, user.id, date]);

        return `Successfully registered \"${user.displayName}\" as GM in Database`;
    }

    static async remove(server, user) {
        if (!(await this.exists(server, user))) {
            throw new NotFoundError('GM not found', 'Could not find that GM in the Database!');
        }

        await query('DELETE FROM gms WHERE server_id = $1 AND user_id = $2', [server.id, user.id]);

        return `Successfully unregistered \"${user.displayName} as GM in Database`;
    }

    static async editXP(server, user, xp) {
        const gm = await this.getGM(server, user);

        if (gm.xp - xp < 0) {
            throw new ForbiddenError('Not enough XP', 'You do not have enough GMXP!');
        } else {
            gm.xp += xp;
        }

        await query('UPDATE gms SET xp = $1 WHERE server_id = $2 AND user_id = $3', [gm.xp, server.id, user.id]);

        return `Successfully set XP of GM \"${user.displayName}\" to ${gm.xp}`;
    }

    static async toggleSuggestion(server, user) {
        const gm = await this.getGM(server, user);

        await query('UPDATE gms SET suggestions = $1 WHERE server_id = $2 AND user_id = $3', [!gm.suggestions, server.id, user.id]);

        return `Successfully set receiving of suggestions to ${!gm.suggestions}`;
    }
}

export { GameMaster };
