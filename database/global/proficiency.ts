import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

interface DBProficiency {
    id: bigint;
    name: string;
    key: string;
}

interface AddProficiency {
    name: string;
    key: string;
}

class Proficiency {
    static async getAll() {
        const results = await query('SELECT * FROM proficiencies') as DBProficiency[];

        if (results.length === 0) throw new NotFoundError('No Proficiencies found', 'Could not find any Proficiencies in the Database!');

        return results;
    }

    static async getOne(prof: { id?: bigint; name?: string; key?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM proficiencies WHERE id = $1', [prof.id]) as DBProficiency[];

            if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

            return results[0];
        }

        if (prof.key) {
            const results = await query('SELECT * FROM proficiencies WHERE key = $1', [prof.key]) as DBProficiency[];

            if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Key in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM proficiencies WHERE name = $1', [prof.name]) as DBProficiency[];

        if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Name in the Database!');

        return results[0];
    }

    static async exists(prof: { id?: bigint; name?: string; key?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM proficiencies WHERE id = $1', [prof.id]) as DBProficiency[];

            return results.length === 1;
        }

        if (prof.key) {
            const results = await query('SELECT * FROM proficiencies WHERE key = $1', [prof.key]) as DBProficiency[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM proficiencies WHERE name = $1', [prof.name]) as DBProficiency[];

        return results.length === 1;
    }

    static async add(prof: AddProficiency) {
        if (await this.exists(prof)) throw new DuplicateError('Duplicate Proficiency', 'That Proficiency already exists in the Database!');

        await query('INSERT INTO proficiencies (name, key) VALUES($1, $2)', [prof.name, prof.key]);

        return 'Successfully added Proficiency to Database';
    }

    static async remove(prof: { id: bigint }) {
        if (!(await this.exists(prof))) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        await query('DELETE FROM proficiencies WHERE id = $1', [prof.id]);

        return 'Successfully removed Proficiency from Database';
    }

    static async update(prof: DBProficiency) {
        if (!(await this.exists(prof))) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        await query('UPDATE proficiencies SET name = $1, key = $2 WHERE id = $3', [prof.name, prof.key, prof.id]);

        return 'Successfully updated Proficiency in Database';
    }
}

export { Proficiency };