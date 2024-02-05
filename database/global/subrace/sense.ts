import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Senses } from '..';
const query = psql.query;

interface DBSubraceSense {
    id: bigint;
    sub_id: bigint;
    sense_id: bigint;
    range: bigint;
    add: boolean;
}

interface AddSubraceSense {
    name: string;
    range: bigint;
    add: boolean;
}

class SubraceSense {
    static async getAll(sub: { id: bigint }) {
        const results = await query('SELECT * FROM subrace_senses WHERE sub_id = $1', [sub.id]) as DBSubraceSense[];

        if (results.length === 0) throw new NotFoundError('No Subrace Senses found', 'Could not find any Senses for that Subrace in the Database!');

        return Promise.all(
            results.map(async (subSense) => {
                const dbSense = await Senses.getOne({ id: subSense.sense_id });

                return {
                    id: subSense.id,
                    sub_id: sub.id,
                    sense: dbSense,
                    range: subSense.range,
                    add: subSense.add
                };
            })
        );
    }

    static async getOne(sub: { id: bigint }, sense: { id?: bigint; name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM subrace_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]) as DBSubraceSense[];

            if (results.length === 0) throw new NotFoundError('Subrace Sense not found', 'Could not find that Sense for that Subrace in the Database!');

            const subSense = results[0];
            const dbSense = await Senses.getOne({ id: subSense.sense_id });

            return {
                id: subSense.id,
                sub_id: sub.id,
                sense: dbSense,
                range: subSense.range,
                add: subSense.add
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM subrace_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]) as DBSubraceSense[];

        if (results.length === 0) throw new NotFoundError('Subrace Sense not found', 'Could not find a Sense with that name for that Subrace in the Database!');

        const subSense = results[0];

        return {
            id: subSense.id,
            sub_id: sub.id,
            sense: dbSense,
            range: subSense.range,
            add: subSense.add
        };
    }

    static async exists(sub: { id: bigint }, sense: { id?: bigint; name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM subrace_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]) as DBSubraceSense[];

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM subrace_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]) as DBSubraceSense[];

        return results.length === 1;
    }

    static async add(sub: { id: bigint }, sense: AddSubraceSense) {
        try {
            const subSense = await this.getOne(sub, sense);

            if (sense.range <= subSense.range) throw new DuplicateError('Duplicate Subrace Sense', 'That Sense is already linked to that Subrace with an equal or higher range!');

            const sql = 'UPDATE subrace_senses SET range = $1, add = $2 WHERE sub_id = $3 AND id = $4';
            await query(sql, [sense.range, sense.add, sub.id, subSense.id]);

            return 'Successfully updated Subrace Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const dbSense = await Senses.getOne({ name: sense.name });
            const sql = 'INSERT INTO subrace_senses (sub_id, sense_id, range, add) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, dbSense.id, sense.range, sense.add]);

            return 'Successfully added Subrace Sense to Database';
        }
    }

    static async remove(sub: { id: bigint }, sense: { id: bigint }) {
        if (!(await this.exists(sub, sense))) throw new NotFoundError('Subrace Sense not found', 'Could not find that Sense for that Subrace in the Database!');

        await query('DELETE FROM subrace_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]);

        return 'Successfully removed Subrace Sense from Database';
    }

    static async update(sub: { id: bigint }, sense: DBSubraceSense) {
        if (!(await this.exists(sub, sense))) throw new NotFoundError('Subrace Sense not found', 'Could not find that Sense for that Subrace in the Database!');

        const sql = 'UPDATE subrace_senses SET range = $1, sense_id = $2, add = $3 WHERE sub_id = $4 AND id = $5';
        await query(sql, [sense.range, sense.sense_id, sense.add, sub.id, sense.id]);

        return 'Successfully updated Subrace Sense in Database';
    }
}

export { SubraceSense };
