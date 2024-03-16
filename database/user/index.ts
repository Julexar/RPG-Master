import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { UserNote } from './note.ts';
import { DBCharacter } from '../character';
import { User } from 'discord.js';
const query = psql.query;

interface DBUser {
    id: bigint;
    name: string;
    display_name: string;
    join_date: Date;
    selected_char: bigint;
}

class user {
    notes: typeof UserNote;
    constructor() {
        this.notes = UserNote;
    }

    async getAll() {
        const results = await query('SELECT * FROM users') as DBUser[];

        if (results.length === 0) throw new NotFoundError('No Users found', 'Could not find any Users in the Database!');

        return results;
    }

    async getOne(user: { id?: bigint, username?: string } | User) {
        if (user.id) {
            const results = await query('SELECT * FROM users WHERE id = $1', [user.id]) as DBUser[];

            if (results.length === 0) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM users WHERE name = $1', [user.username]) as DBUser[];

        if (results.length === 0) throw new NotFoundError('User not found', 'Could not find a User with that name in the Database!');

        return results[0];
    }

    async exists(user: { id?: bigint, username?: string } | User) {
        if (user.id) {
            const results = await query('SELECT * FROM users WHERE id = $1', [user.id]) as DBUser[];

            if (results.length === 0) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM users WHERE name = $1', [user.username]) as DBUser[];

        if (results.length === 0) throw new NotFoundError('User not found', 'Could not find a User with that name in the Database!');

        return results[0];
    }

    async add(user: { id: bigint, username: string, displayName: string } | User) {
        if (await this.exists(user)) throw new DuplicateError('Duplicate User', 'That User already exists in the Database!');

        await query('INSERT INTO users (id, name, display_name) VALUES($1, $2, $3)', [user.id, user.username, user.displayName]);

        return `Successfully added User \"${user.username}\" to Database`;
    }

    async remove(user: { id: bigint, username: string } | User) {
        if (!(await this.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        await query('DELETE FROM users WHERE id = $1', [user.id]);

        return `Successfully removed User \"${user.username}\" from Database`;
    }

    async update(user: { id: bigint; username: string, displayName: string } | User) {
        if (!(await this.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        await query('UPDATE users SET display_name = $1 WHERE id = $2', [user.displayName, user.id]);

        return `Successfully updated User \"${user.username}\" in Database`;
    }

    async selectChar(user: { id: bigint; username: string } | User, char: DBCharacter) {
        if (!(await this.exists(user))) throw new NotFoundError('User not found', 'Could not find that User in the Database!');

        await query('UPDATE users SET char_id = $1 WHERE id = $2', [char.id, user.id]);

        return `Successfully changed active character to \"${char.name}\" for \"${user.username}\"`;
    }
}

const dbUser = new user();

export { dbUser };
