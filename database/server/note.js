import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors/index.js';
import { User } from '../user';
const query = psql.query;

class ServerNote {
    static async getAll(server, user) {
        if (!(await User.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        const results = await query('SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2', [server.id, user.id]);

        if (results.length === 0) throw new NotFoundError('No Server Notes found', 'Could not find any Server Notes for that User in the Database!');

        return results.map(note => {
            if (note.deleted_at) return;

            return note;
        });
    }

    static async getOne(server, user, note) {
        if (await this.isDeleted(server, user, note))
            throw new BadRequestError('Server Note deleted', 'The Server Note you are trying to view has been deleted!');

        if (note.id) {
            const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3';

            const results = await query(sql, [server.id, user.id, note.id]);

            if (results.length === 0)
                throw new NotFoundError('Server Note not found', 'Could not find that Server Note for that User in the Database!');

            return results[0];
        }

        const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3';

        const results = await query(sql, [server.id, user.id, note.title]);

        if (results.length === 0)
            throw new NotFoundError('Server Note not found', 'Could not find a Server Note with that title for that User in the Database!');

        return results[0];
    }

    static async exists(server, user, note) {
        if (note.id) {
            const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3';

            const results = await query(sql, [server.id, user.id, note.id]);

            return results.length === 1;
        }

        const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3';

        const results = await query(sql, [server.id, user.id, note.title]);

        return results.length === 1;
    }

    static async isDeleted(server, user, note) {
        if (note.id) {
            const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3';

            const results = await query(sql, [server.id, user.id, note.id]);

            if (results.length === 0)
                throw new NotFoundError('Server Note not found', 'Could not find that Server Note for that User in the Database!');

            return !!results[0].deleted_at;
        }

        const sql = 'SELECT * FROM server_notes WHERE server_id = $1 AND user_id = $2 AND title = $3';

        const results = await query(sql, [server.id, user.id, note.title]);

        if (results.length === 0)
            throw new NotFoundError('Server Note not found', 'Could not find a Server Note with that title for that User in the Database!');

        return !!results[0].deleted_at;
    }

    static async add(server, user, note) {
        try {
            const serverNote = await this.getOne(server, user, note);

            if (note.content === serverNote.content)
                throw new DuplicateError('Duplicate Server Note', 'A Server Note with that title and content already exists in the Database!');

            const sql = 'INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [server.id, user.id, note.title, note.content, note.private]);

            return 'Successfully added Server Note to Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO server_notes (server_id, user_id, title, content, private) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [server.id, user.id, note.title, note.content, note.private]);

            return 'Successfully added Server Note to Database';
        }
    }

    static async remove_final(server, user, note) {
        if (!(await this.exists(server, user, note)))
            throw new NotFoundError('Server Note not found', 'Could not find that Server Note for that User in the Database!');

        await query('DELETE FROM server_notes WHERE server_id = $1 AND user_id = $2 AND id = $3', [server.id, user.id, note.id]);

        return 'Successfully removed Server Note from Database';
    }

    static async remove(server, user, note) {
        if (!(await this.exists(server, user, note)))
            throw new NotFoundError('Server Note not found', 'Could not find that Server Note for that User in the Database!');
        if (await this.isDeleted(server, user, note))
            throw new BadRequestError('Server Note deleted', 'The Server Note you are trying to delete has already been deleted!');

        await query('UPDATE server_notes SET deleted_at = $1 WHERE server_id = $2 AND user_id = $3 AND id = $4', [
            Date.now(),
            server.id,
            user.id,
            note.id,
        ]);

        return 'Successfully removed Server Note from Database';
    }

    static async update(server, user, note) {
        if (!(await this.exists(server, user, note)))
            throw new NotFoundError('Server Note not found', 'Could not find that Server Note for that User in the Database!');

        if (await this.isDeleted(server, user, note))
            throw new BadRequestError('Server Note deleted', 'The Server Note you are trying to update has been deleted!');

        const sql = 'UPDATE server_notes SET title = $1, content = $2, private = $3 WHERE server_id = $4 AND user_id = $5 AND id = $6';
        await query(sql, [note.title, note.content, note.private, server.id, user.id, note.id]);

        return 'Successfully updated Server Note in Database';
    }
}

export { ServerNote };
