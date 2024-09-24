import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';
const query = psql.query;

interface SubclassProf {
    id: bigint;
    sub_id: bigint;
    name: string;
    type_id: bigint;
    expert: boolean;
}

interface AddSubclassProf {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class SubclassProficiency {
    static async getAll(sub: { id: bigint }) {
        const results = await query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1', [sub.id]) as SubclassProf[];

        if (results.length === 0) throw new NotFoundError('No Subclass Proficiencies found', 'Could not find any Proficiencies for that Subclass in the Database!');

        return Promise.all(
            results.map(async (subProf) => {
                const dbProf = await Proficiency.getOne({ id: subProf.type_id });

                return {
                    id: subProf.id,
                    sub_id: sub.id,
                    name: subProf.name,
                    type: dbProf,
                    expert: subProf.expert
                };
            })
        );
    }

    static async getOne(sub: { id: bigint }, prof: { id?: bigint; name?: string; type_id?: bigint }) {
        if (prof.id) {
            const results = await query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]) as SubclassProf[];

            if (results.length === 0) throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');

            const subProf = results[0];
            const dbProf = await Proficiency.getOne({ id: subProf.type_id });

            return {
                id: subProf.id,
                sub_id: sub.id,
                name: subProf.name,
                type: dbProf,
                expert: subProf.expert
            };
        }

        const dbProf = await Proficiency.getOne({ id: prof.type_id });
        const sql = 'SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type_id = $3';
        const results = await query(sql, [sub.id, prof.name, dbProf.id]) as SubclassProf[];

        if (results.length === 0) throw new NotFoundError('Subclass Proficiency not found', 'Could not find a Subclass Proficiency with that name in the Database!');

        const subProf = results[0];

        return {
            id: subProf.id,
            sub_id: sub.id,
            name: subProf.name,
            type: dbProf,
            expert: subProf.expert
        };
    }

    static async exists(sub: { id: bigint }, prof: { id?: bigint; name?: string; type_id?: bigint }) {
        if (prof.id) {
            const results = await query('SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]) as SubclassProf[];

            return results.length === 1;
        }

        const sql = 'SELECT * FROM subclass_proficiencies WHERE sub_id = $1 AND name = $2 AND type_id = $3';
        const results = await query(sql, [sub.id, prof.name, prof.type_id]) as SubclassProf[];

        return results.length === 1;
    }

    static async add(sub: { id: bigint }, prof: AddSubclassProf) {
        try {
            const subProf = await this.getOne(sub, prof);

            if (prof.expert === subProf.expert) throw new DuplicateError('Duplicate Subclass Proficiency', 'That Subclass Proficiency already exists in the Database!');

            await query('UPDATE subclass_proficiencies SET expert = $1 WHERE sub_id = $2 AND id = $2', [prof.expert, sub.id, subProf.id]);

            return 'Successfully updated Subclass Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO subclass_proficiencies (sub_id, name, type_id, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, prof.name, prof.type_id, prof.expert]);

            return 'Successfully added Subclass Proficiency to Database';
        }
    }

    static async remove(sub: { id: bigint }, prof: { id: bigint, name?: string, type_id?: bigint }) {
        if (!(await this.exists(sub, prof))) throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');

        await query('DELETE FROM subclass_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

        return 'Successfully removed Subclass Proficiency from Database';
    }

    static async update(sub: { id: bigint }, prof: SubclassProf) {
        if (!(await this.exists(sub, prof))) throw new NotFoundError('Subclass Proficiency not found', 'Could not find that Proficiency for that Subclass in the Database!');

        const sql = 'UPDATE subclass_proficiencies SET name = $1, expert = $2, type = $3 WHERE sub_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.expert, prof.type_id, sub.id, prof.id]);

        return 'Successfully updated Subclass Proficiency in Database';
    }
}

export { SubclassProficiency };
