import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors/index.js';
import { User } from './index.js';
const query = psql.query;

class UserNote {
    static async getAll(user) {
        if (!(await User.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        const results = await query('SELECT * FROM user_notes WHERE user_id = $1 ORDER BY created_at', [user.id]);

        if (results.length === 0) throw new NotFoundError('No Notes found', 'Could not find any Notes for that User in the Database!');

        return results.map(note => {
            if (note.deleted_at) return;

            return note;
        });
    }

    static async getOne(user, note) {
        if (!(await User.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]);

            if (results.length === 0) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Note deleted', 'The Note you are trying to view has been deleted!');

            return results[0];
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]);

        if (results.length === 0) throw new NotFoundError('Note not found', 'Could not find a Note with that name for that User in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Note deleted', 'The Note you are trying to view has been deleted!');

        return results[0];
    }

    static async exists(user, note) {
        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]);

        return results.length === 1;
    }

    static async isDeleted(user, note) {
        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]);

        return !!results[0].deleted_at;
    }

    static async add(user, note) {
        try {
            const globNote = await this.getOne(user, note);

            if (note.content === globNote.content && !note.deleted_at)
                throw new DuplicateError('Duplicate Note', 'A Note with that title and content already exists in the Database!');

            const sql = 'INSERT INTO user_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)';
            await query(sql, [user.id, note.title, note.content, note.private]);

            return 'Successfully added User Note to Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO user_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)';
            await query(sql, [user.id, note.title, note.content, note.private]);

            return 'Successfully added User Note to Database';
        }
    }

    static async remove(user, note) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        if (await this.isDeleted(user, note))
            throw new BadRequestError('Note deleted', 'The Note you are trying to remove has already been deleted!');

        const sql = 'UPDATE user_notes SET deleted_at = $1 WHERE user_id = $2 AND id = $3';
        await query(sql, [Date.now(), user.id, note.id]);

        return 'Successfully marked Note as deleted for User in Database';
    }

    static async remove_final(user, note) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        await query('DELETE FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]);

        return 'Successfully removed User Note from Database';
    }

    static async update(user, note) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        if (await this.isDeleted(user, note)) throw new BadRequestError('Note deleted', 'The Note you are trying to update has been deleted!');

        const sql = 'UPDATE user_notes SET title = $1, content = $2, private = $3 WHERE user_id = $4 AND id = $5';
        await query(sql, [note.title, note.content, note.private, user.id, note.id]);

        return 'Successfully updated User Note in Database';
    }
}

export { UserNote };
