import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';
const query = psql.query;

interface DBSubraceProficiency {
    id: bigint;
    sub_id: bigint;
    name: string;
    type_id: bigint;
    expert: boolean;
}

interface AddSubraceProficiency {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class SubraceProficiency {
    static async getAll(sub: { id: bigint }) {
        const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1', [sub.id]) as DBSubraceProficiency[];

        if (results.length === 0) throw new NotFoundError('No Subrace Proficiencies found', 'Could not find any Subrace Proficiencies in the Database!');

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

    static async getOne(sub: { id: bigint }, prof: { id?: bigint; name?: string, type_id?: bigint }) {
        if (prof.id) {
            const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]) as DBSubraceProficiency[];

            if (results.length === 0) throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Subrace Proficiency in the Database!');

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
        const sql = 'SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2 AND type_id = $3'
        const results = await query(sql, [sub.id, prof.name, dbProf.id]) as DBSubraceProficiency[];

        if (results.length === 0) throw new NotFoundError('Subrace Proficiency not found', 'Could not find a Subrace Proficiency with that name in the Database!');

        const subProf = results[0];

        return {
            id: subProf.id,
            sub_id: sub.id,
            name: subProf.name,
            type: dbProf,
            expert: subProf.expert
        };
    }

    static async exists(sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]) as DBSubraceProficiency[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM subrace_proficiencies WHERE sub_id = $1 AND name = $2', [sub.id, prof.name]) as DBSubraceProficiency[];

        return results.length === 1;
    }

    static async add(sub: { id: bigint }, prof: AddSubraceProficiency) {
        try {
            const subProf = await this.getOne(sub, prof);

            if (prof.expert === subProf.expert) throw new DuplicateError('Duplicate Subrace Proficiency', 'That Subrace already has that Proficiency in the Database!');

            const sql = 'UPDATE subrace_proficiencies SET expert = $1, name = $2 WHERE sub_id = $3 AND id = $4';
            await query(sql, [prof.expert, prof.name, sub.id, subProf.id]);

            return 'Successfully updated Subrace Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO subrace_proficiencies (sub_id, name, type_id, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, prof.name, prof.type_id, prof.expert]);

            return 'Successfully added Subrace Proficiency to Database';
        }
    }

    static async remove(sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(sub, prof))) throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Proficiency for that Subrace in the Database!');

        await query('DELETE FROM subrace_proficiencies WHERE sub_id = $1 AND id = $2', [sub.id, prof.id]);

        return 'Successfully removed Subrace Proficiency from Database';
    }

    static async update(sub: { id: bigint }, prof: DBSubraceProficiency) {
        if (!(await this.exists(sub, prof))) throw new NotFoundError('Subrace Proficiency not found', 'Could not find that Proficiency for that Subrace in the Database!');

        const sql = 'UPDATE subrace_proficiencies SET name = $1, type_id = $2, expert = $3 WHERE sub_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.type_id, prof.expert, sub.id, prof.id]);

        return 'Successfully updated Subrace Proficiency in Database';
    }
}

export { SubraceProficiency };
