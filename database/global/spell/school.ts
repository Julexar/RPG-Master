import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface School {
    id: bigint | null | undefined,
    name: string
};

class SpellSchool {
    static async getAll() {
        const results = await query('SELECT * FROM spell_schools', null) as School[];

        if (results.length === 0) throw new NotFoundError('No spell schools found', 'Could not find any Spell Schools in the Database!');

        return results;
    }

    static async getOne(school: any) {
        if (school.id) {
            const results = await query('SELECT * FROM spell_schools WHERE id = $1', [school.id]) as School[];

            if (results.length === 0) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM spell_schools WHERE name = $1', [school.name]) as School[];

        if (results.length === 0) throw new NotFoundError('Spell School not found', 'Could not find a Spell School with that Name in the Database!');

        return results[0];
    }

    static async exists(school: any) {
        if (school.id) {
            const results = await query('SELECT * FROM spell_schools WHERE id = $1', [school.id]) as School[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM spell_schools WHERE name = $1', [school.name]) as School[];

        return results.length === 1;
    }

    static async add(schoolName: string) {
        if (await this.exists({ id: null, name: schoolName })) throw new DuplicateError('Spell School already exists', 'A Spell School with that name already exists in the Database!');

        await query('INSERT INTO spell_schools (name) VALUES ($1)', [schoolName]);

        return 'Successfully added Spell School to Database';
    }

    static async remove(school: any) {
        if (!await this.exists(school)) throw new NotFoundError('Spell School not found', 'Could not find that Spell School in the Database!');

        await query('DELETE FROM spell_schools WHERE id = $1', [school.id]);

        return 'Successfully removed Spell School from Database';
    }
}

export { SpellSchool };