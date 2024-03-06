import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBProficiency {
    id: number;
    name: string;
    key: string;
}

interface AddProficiency {
    name: string;
    key: string;
}

export class Proficiency {
    static async getAll() {
        const results = await query('SELECT * FROM proficiencies') as DBProficiency[];

        if (results.length === 0) throw new NotFoundError('No Proficiency found', 'Could not find any Proficiencies in the Database!');

        return results;
    }

    static async getOne(proficiency: { id?: number, name?: string, key?: string }) {
        if (proficiency.id) {
            const results = await query('SELECT * FROM proficiencies WHERE id = $1', [proficiency.id]) as DBProficiency[];

            if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

            return results[0];
        }

        if (proficiency.key) {
            const results = await query('SELECT * FROM proficiencies WHERE key = $1', [proficiency.key]) as DBProficiency[];

            if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Key in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM proficiencies WHERE name = $1', [proficiency.name]) as DBProficiency[];

        if (results.length === 0) throw new NotFoundError('Proficiency not found', 'Could not find a Proficiency with that Name in the Database!');

        return results[0];
    }

    static async exists(proficiency: { id?: number, name?: string, key?: string }) {
        if (proficiency.id) {
            const results = await query('SELECT * FROM proficiencies WHERE id = $1', [proficiency.id]) as DBProficiency[];

            return results.length === 1;
        }

        if (proficiency.key) {
            const results = await query('SELECT * FROM proficiencies WHERE key = $1', [proficiency.key]) as DBProficiency[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM proficiencies WHERE name = $1', [proficiency.name]) as DBProficiency[];

        return results.length === 1;
    }

    static async add(proficiency: AddProficiency) {
        if (await this.exists(proficiency)) throw new DuplicateError('Proficiency already exists', 'A Proficiency with that Name already exists in the Database!');

        const sql = 'INSERT INTO proficiencies (name, key) VALUES ($1, $2)';
        await query(sql, [proficiency.name, proficiency.key]);

        return 'Successfully added Proficiency to the Database';
    }

    static async remove(proficiency: { id: number }) {
        if (!await this.exists(proficiency)) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        await query('DELETE FROM proficiencies WHERE id = $1', [proficiency.id]);

        return 'Successfully removed Proficiency from the Database';
    }

    static async update(proficiency: DBProficiency) {
        if (!(await this.exists({ id: proficiency.id }))) throw new NotFoundError('Proficiency not found', 'Could not find that Proficiency in the Database!');

        const sql = 'UPDATE proficiencies SET name = $1, key = $2 WHERE id = $3';
        await query(sql, [proficiency.name, proficiency.key, proficiency.id]);

        return 'Successfully updated Proficiency in Database';
    }
}