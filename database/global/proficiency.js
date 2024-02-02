import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

class Proficiency {
    static async getAll() {
        const results = await query('SELECT * FROM proficiency_types');

        if (results.length === 0) {
            throw new NotFoundError('No Proficiencies found', 'Could not find any Proficiencies in the Database!');
        }

        return results;
    }

    static async getOne(prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM proficiency_types WHERE id = $1', [prof.id]);

            if (results.length === 0) {
                throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');
            }

            return results[0];
        }

        if (prof.key) {
            const results = await query('SELECT * FROM proficiency_types WHERE key = $1', [prof.key]);

            if (results.length === 0) {
                throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Key in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM proficiency_types WHERE name = $1', [prof.name]);

        if (results.length === 0) {
            throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Name in the Database!');
        }

        return results[0];
    }

    static async exists(prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM proficiency_types WHERE id = $1', [prof.id]);

            return results.length === 1;
        }

        if (prof.key) {
            const results = await query('SELECT * FROM proficiency_types WHERE key = $1', [prof.key]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM proficiency_types WHERE name = $1', [prof.name]);

        return results.length === 1;
    }

    static async add(prof) {
        if (await this.exists(prof)) {
            throw new DuplicateError('Duplicate Proficiency', 'That Proficiency already exists in the Database!');
        }

        await query('INSERT INTO proficiency_types (name, key) VALUES($1, $2)', [prof.name, prof.key]);

        return 'Successfully added Proficiency to Database';
    }

    static async remove(prof) {
        if (!(await this.exists(prof))) {
            throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');
        }

        await query('DELETE FROM proficiency_types WHERE id = $1', [prof.id]);

        return 'Successfully removed Proficiency from Database';
    }

    static async update(prof) {
        if (!(await this.exists(prof))) {
            throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');
        }

        await query('UPDATE proficiency_types SET name = $1, key = $2 WHERE id = $3', [prof.name, prof.key, prof.id]);

        return 'Successfully updated Proficiency in Database';
    }
}

export { Proficiency };
