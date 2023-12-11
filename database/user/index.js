import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { UserNote } from './note.js';
const query = psql.query;

class user {
    constructor() {
        this.notes = UserNote;
    }

    async getAll() {
        const results = await query('SELECT * FROM users');

        if (results.length === 0) {
            throw new NotFoundError('No Users found', 'Could not find any Users in the Database!');
        }

        return results;
    }

    async getOne(user) {
        if (user.id) {
            const results = await query('SELECT * FROM users WHERE id = $1', [user.id]);

            if (results.length === 0) {
                throw new NotFoundError('User not found', 'Could not find that User in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM users WHERE name = $1', [user.username]);

        if (results.length === 0) {
            throw new NotFoundError('User not found', 'Could not find a User with that name in the Database!');
        }

        return results[0];
    }

    async exists(user) {
        if (user.id) {
            const results = await query('SELECT * FROM users WHERE id = $1', [user.id]);

            if (results.length === 0) {
                throw new NotFoundError('User not found', 'Could not find that User in the Database!');
            }

            return results[0];
        }

        const userName = user.username ? user.username : user.name;
        const results = await query('SELECT * FROM users WHERE name = $1', [userName]);

        if (results.length === 0) {
            throw new NotFoundError('User not found', 'Could not find a User with that name in the Database!');
        }

        return results[0];
    }

    async add(user) {
        if (await this.exists(user)) {
            throw new DuplicateError('Duplicate User', 'That User already exists in the Database!');
        }

        await query('INSERT INTO users VALUES($1, $2, $3, $4)', [user.id, user.username, user.char_id, user.displayName]);

        return `Successfully added User \"${user.username}\" to Database`;
    }

    async remove(user) {
        if (!(await this.exists(user))) {
            throw new NotFoundError('User not found', 'Could not find that User in the Database!');
        }

        await query('DELETE FROM users WHERE id = $1', [user.id]);

        return `Successfully removed User \"${user.username}\" from Database`;
    }

    async update(user) {
        if (!(await this.exists(user))) {
            throw new NotFoundError('User not found', 'Could not find that User in the Database!');
        }

        await query('UPDATE users SET display_name = $1 WHERE id = $2', [user.displayName, user.id]);

        return `Successfully updated User \"${user.username}\" in Database`;
    }

    async selectChar(user, char) {
        if (!(await this.exists(user))) {
            throw new NotFoundError('User not found', 'Could not find that User in the Database!');
        }

        await query('UPDATE users SET char_id = $1 WHERE id = $2', [char.id, user.id]);

        return `Successfully changed active character to \"${char.name}\" for \"${user.username}\"`;
    }
}

const User = new user();

export { User };
