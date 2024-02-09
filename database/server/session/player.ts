import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Session } from './';
import { User } from 'discord.js';
import { DBCharacter } from '../../character';
const query = psql.query;

interface DBPlayer {
    id: bigint;
    session_id: bigint;
    user_id: bigint;
    char_id: bigint;
}

class SessionPlayer {
    static async getAll(session: { id: bigint }) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1', [session.id]) as DBPlayer[];

        if (results.length === 0) throw new NotFoundError('No Session Players found', 'Could not find any Players for that Session in the Database!');

        return results;
    }

    static async getOne(session: { id: bigint }, player: User) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1 AND id = $2', [session.id, player.id]) as DBPlayer[];

        if (results.length === 0) throw new NotFoundError('Session Player not found', 'Could not find that Player for that Session in the Database!');

        return results[0];
    }

    static async exists(session: { id: bigint }, player: User) {
        const results = await query('SELECT * FROM session_players WHERE session_id = $1 AND user_id = $2', [session.id, player.id]) as DBPlayer[];

        return results.length === 1;
    }

    static async add(session: { id: bigint }, player: User, char: DBCharacter) {
        try {
            const sesPlayer = await this.getOne(session, player);

            if (char.id === sesPlayer.char_id) throw new DuplicateError('Duplicate Session Player', 'You have already joined that Session with that Character!');

            const sql = 'UPDATE session_players SET char_id = $1 WHERE session_id = $2 AND user_id = $3';
            await query(sql, [char.id, session.id, player.id]);

            return 'Successfullly updated Playerdata for that Session';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO session_players VALUES($1, $2, $3)';
            await query(sql, [session.id, player.id, char.id]);

            return 'Successfully joined Session';
        }
    }

    static async remove(session: { id: bigint }, player: User) {
        if (!(await this.exists(session, player))) throw new NotFoundError('Session Player not found', 'Could not find that Player for that Session in the Database!');

        await query('DELETE FROM session_players WHERE session_id = $1 AND user_id = $2', [session.id, player.id]);

        return 'Successfully left Session';
    }

    static async update(session: { id: bigint }, player: User, char: DBCharacter) {
        if (!(await this.exists(session, player))) throw new NotFoundError('Session Player not found', 'Could not find that Player for that Session in the Database!');

        const sql = 'UPDATE session_players SET char_id = $1 WHERE session_id = $2 AND user_id = $3';
        await query(sql, [char.id, session.id, player.id]);

        return 'Successfully updated Playerdata for that Session';
    }
}

export { SessionPlayer };
