import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Character } from './';
const query = psql.query;

class CharacterNote {
    static async getAll(user, char) {
        if (!(await Character.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1', [char.id]);

        if (results.length === 0) throw new NotFoundError('No Character Notes found', 'Could not find any Notes for this Character in the Database!');

        return results.map((note) => {
            if (note.deleted_at) return;

            return note;
        });
    }

    static async getOne(user, char, note) {
        if (!(await Character.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]);

            if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find that Character Note in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Character Note deleted', 'That Character Note has been deleted!');

            return results[0];
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]);

        if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find a Character Note with that title in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Character Note deleted', 'That Character Note has been deleted!');

        return results[0];
    }

    static async exists(char, note) {
        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]);

        return results.length === 1;
    }

    static async isDeleted(char, note) {
        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]);

        if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find a Character Note with that title in the Database!');

        return !!results[0].deleted_at;
    }

    static async add(user, char, note) {
        try {
            const charNote = await this.getOne(user, char, note);

            if (note.content === charNote.content && !charNote.deleted_at) throw new DuplicateError('Duplicate Character Note', 'A Character Note with that title and content already exists in the Database!');

            const sql = 'INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)';
            await query(sql, [char.id, note.title, note.content, note.private]);

            return 'Successfully added Character Note to Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO character_notes (char_id, title, content, private) VALUES($1, $2, $3, $4)';
            await query(sql, [char.id, note.title, note.content, note.private]);

            return 'Successfully added Character Note to Database';
        }
    }

    static async remove(char, note) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        if (await this.isDeleted(char, note)) throw new BadRequestError('Character Note deleted', 'The Character Note you are trying to delete has already been deleted!');

        const sql = 'UPDATE character_notes SET deleted_at = $1 WHERE char_id = $2 AND id = $3';
        await query(sql, [Date.now(), char.id, note.id]);

        return 'Successfully removed Character Note from Database';
    }

    static async remove_final(char, note) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        await query('DELETE FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]);

        return 'Successfully removed Character Note from Database';
    }

    static async update(char, note) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        if (await this.isDeleted(char, note)) throw new BadRequestError('Character Note deleted', 'The Character Note you are trying to update has been deleted!');

        const sql = 'UPDATE character_notes SET title = $1, content = $2, private = $3 WHERE char_id = $4 AND id = $5';
        await query(sql, [note.title, note.content, note.private, char.id, note.id]);

        return 'Successfully updated Character Note in Database';
    }
}

export { CharacterNote };
