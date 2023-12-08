import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class SessionPlayer {
    static async getAll(session) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1', [session.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Session Players found', 'Could not find any Players for that Session in the Database!');
        }

        return results;
    }

    static async getOne(session, player) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1 AND id = $2', [session.id, player.id]);

        if (results.length === 0) {
            throw new NotFoundError('Session Player not found', 'Could not find that Player for that Session in the Database!');
        }

        return results[0];
    }

    static async exists(session, player) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1 AND user_id = $2', [session.id, player.id]);

        return results.length === 1;
    }

    static async add(session, player, char) {
        try {
            const sesPlayer = await getOne(session, player);

            if (char.id === sesPlayer.char_id) {
                throw new DuplicateError('Duplicate Session Player', 'That User has already joined that Session with that Character!');
            }

            const sql = 'UPDATE session_players SET char_id = $1 WHERE session_id = $2 AND user_id = $3';
            await query(sql, [char.id, session.id, player.id]);

            return 'Successfullly updated Playerdata for that Session';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO session_players VALUES($1, $2, $3)';
            await query(sql, [session.id, player.id, char.id]);

            return 'Successfully joined Session';
        }
    }

    static async remove(session, player) {
        if (!(await this.exists(session, player))) {
            throw new NotFoundError('Session Player not found', 'Could not find that Player for that Session in the Database!');
        }

        await query('DELETE FROM session_players WHERE session_id = $1 AND user_id = $2', [session.id, player.id]);

        return 'Successfully left Session';
    }
}

export { SessionPlayer };
