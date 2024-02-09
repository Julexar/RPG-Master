import { User } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { User as DBUser } from '.';
const query = psql.query;

interface DBUserNote {
    id: bigint;
    user_id: bigint;
    title: string;
    content: string;
    private: boolean;
    deleted_at: Date | null;
}

interface AddNote {
    title: string;
    content: string;
    private: boolean;
}

class UserNote {
    static async getAll(user: User) {
        if (!(await DBUser.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        const results = await query('SELECT * FROM user_notes WHERE user_id = $1 ORDER BY created_at', [user.id]) as DBUserNote[];

        if (results.length === 0) throw new NotFoundError('No Notes found', 'Could not find any Notes for that User in the Database!');

        return results.map((note) => {
            if (note.deleted_at) return;

            return note;
        });
    }

    static async getOne(user: User, note: { id?: bigint; title?: string }) {
        if (!(await DBUser.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]) as DBUserNote[];

            if (results.length === 0) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Note deleted', 'The Note you are trying to view has been deleted!');

            return results[0];
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]) as DBUserNote[];

        if (results.length === 0) throw new NotFoundError('Note not found', 'Could not find a Note with that name for that User in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Note deleted', 'The Note you are trying to view has been deleted!');

        return results[0];
    }

    static async exists(user: User, note: { id?: bigint; title?: string }) {
        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]) as DBUserNote[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]) as DBUserNote[];

        return results.length === 1;
    }

    static async isDeleted(user: User, note: { id?: bigint; title?: string }) {
        if (note.id) {
            const results = await query('SELECT * FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]) as DBUserNote[];

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2', [user.id, note.title]) as DBUserNote[];

        return !!results[0].deleted_at;
    }

    static async add(user: User, note: AddNote) {
        try {
            const dbNote = await this.getOne(user, note);

            if (note.content === dbNote.content) throw new DuplicateError('Duplicate Note', 'A Note with that title and content already exists in the Database!');

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

    static async remove(user: User, note: { id: bigint }) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        if (await this.isDeleted(user, note)) throw new BadRequestError('Note deleted', 'The Note you are trying to remove has already been deleted!');

        const sql = 'UPDATE user_notes SET deleted_at = $1 WHERE user_id = $2 AND id = $3';
        await query(sql, [Date.now(), user.id, note.id]);

        return 'Successfully marked Note as deleted for User in Database';
    }

    static async remove_final(user: User, note: { id: bigint }) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        await query('DELETE FROM user_notes WHERE user_id = $1 AND id = $2', [user.id, note.id]);

        return 'Successfully removed User Note from Database';
    }

    static async update(user: User, note: DBUserNote) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        if (await this.isDeleted(user, note)) throw new BadRequestError('Note deleted', 'The Note you are trying to update has been deleted!');

        const sql = 'UPDATE user_notes SET title = $1, content = $2, private = $3 WHERE user_id = $4 AND id = $5';
        await query(sql, [note.title, note.content, note.private, user.id, note.id]);

        return 'Successfully updated User Note in Database';
    }

    static async restore(user: User, note: { id: bigint }) {
        if (!(await this.exists(user, note))) throw new NotFoundError('Note not found', 'Could not find that Note for that User in the Database!');

        if (!(await this.isDeleted(user, note))) throw new BadRequestError('Note not deleted', 'The Note you are trying to restore is not deleted!');

        const sql = 'UPDATE user_notes SET deleted_at = $1 WHERE user_id = $2 AND id = $3';
        await query(sql, [null, user.id, note.id]);

        return 'Successfully restored User Note in Database';
    }
}

export { UserNote };
