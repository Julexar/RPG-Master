import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Character } from './';
import { User } from 'discord.js';
const query = psql.query;

interface Note {
    id: bigint;
    char_id: bigint;
    title: string;
    content: string;
    private: boolean;
    created_at: Date;
    deleted_at: Date | null;
}

interface AddNote {
    title?: string;
    content: string;
    private: boolean;
}

class CharacterNote {
    static async getAll(user: User, char: { id: bigint }) {
        if (!(await Character.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1', [char.id]) as Note[];

        if (results.length === 0) throw new NotFoundError('No Character Notes found', 'Could not find any Notes for this Character in the Database!');

        return results.map((note) => {
            if (note.deleted_at) return;

            return note;
        });
    }

    static async getOne(user: User, char: { id: bigint }, note: { id?: bigint; title?: string }) {
        if (!(await Character.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]) as Note[];

            if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find that Character Note in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Character Note deleted', 'That Character Note has been deleted!');

            return results[0];
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]) as Note[];

        if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find a Character Note with that title in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Character Note deleted', 'That Character Note has been deleted!');

        return results[0];
    }

    static async exists(char: { id: bigint }, note: { id?: bigint; title?: string }) {
        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]) as Note[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]) as Note[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, note: { id?: bigint; title?: string }) {
        if (note.id) {
            const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]) as Note[];

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_notes WHERE char_id = $1 AND title = $2', [char.id, note.title]) as Note[];

        if (results.length === 0) throw new NotFoundError('Character Note not found', 'Could not find a Character Note with that title in the Database!');

        return !!results[0].deleted_at;
    }

    static async add(user: User, char: { id: bigint }, note: AddNote) {
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

    static async remove(char: { id: bigint }, note: { id: bigint }) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        if (await this.isDeleted(char, note)) throw new BadRequestError('Character Note deleted', 'The Character Note you are trying to delete has already been deleted!');

        const sql = 'UPDATE character_notes SET deleted_at = $1 WHERE char_id = $2 AND id = $3';
        await query(sql, [Date.now(), char.id, note.id]);

        return 'Successfully removed Character Note from Database';
    }

    static async remove_final(char: { id: bigint }, note: { id: bigint }) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        await query('DELETE FROM character_notes WHERE char_id = $1 AND id = $2', [char.id, note.id]);

        return 'Successfully removed Character Note from Database';
    }

    static async update(char: { id: bigint }, note: Note) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        if (await this.isDeleted(char, note)) throw new BadRequestError('Character Note deleted', 'The Character Note you are trying to update has been deleted!');

        const sql = 'UPDATE character_notes SET title = $1, content = $2, private = $3 WHERE char_id = $4 AND id = $5';
        await query(sql, [note.title, note.content, note.private, char.id, note.id]);

        return 'Successfully updated Character Note in Database';
    }

    static async restore(char: { id: bigint }, note: { id: bigint }) {
        if (!(await this.exists(char, note))) throw new NotFoundError('Character Note not found', 'Could not find that Note for that Character in the Database!');

        if (!(await this.isDeleted(char, note))) throw new BadRequestError('Character Note not deleted', 'The Character Note you are trying to restore has not been deleted!');

        const sql = 'UPDATE character_notes SET deleted_at = NULL WHERE char_id = $2 AND id = $3';
        await query(sql, [char.id, note.id]);

        return 'Successfully restored Character Note in Database';
    }
}

export { CharacterNote };
