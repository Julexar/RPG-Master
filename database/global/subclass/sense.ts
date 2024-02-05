import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Senses } from '..';
const query = psql.query;

interface DBSubclassSense {
    id: bigint;
    sub_id: bigint;
    sense_id: bigint;
    range: bigint;
    add: boolean;
}

interface AddSubclassSense {
    name: string;
    range: bigint;
    add: boolean;
}

class SubclassSense {
    static async getAll(sub: { id: bigint }) {
        const results = await query('SELECT * FROM subclass_senses WHERE sub_id = $1', [sub.id]) as DBSubclassSense[];

        if (results.length === 0) throw new NotFoundError('No Subclass Senses found', 'Could not find any Senses for that Subclass in the Database!');

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
            const results = await query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]) as DBSubclassSense[];

            if (results.length === 0) throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');

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
        const results = await query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]) as DBSubclassSense[];

        if (results.length === 0) throw new NotFoundError('Subclass Sense not found', 'Could not find a Sense with that name for that Subclass in the Database!');

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
            const results = await query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]) as DBSubclassSense[];

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]) as DBSubclassSense[];

        return results.length === 1;
    }

    static async add(sub: { id: bigint }, sense: AddSubclassSense) {
        try {
            const subSense = await this.getOne(sub, sense);

            if (sense.range <= subSense.range) throw new DuplicateError('Duplicate Subclass Sense', 'That Sense is already linked to that Subclass with the same or a higher range!');

            await query('UPDATE subclass_senses SET range = $1, add = $2 WHERE sub_id = $3 AND id = $4', [sense.range, sense.add, sub.id, subSense.id]);

            return 'Successfully updated Subclass Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const dbSense = await Senses.getOne({ name: sense.name });
            const sql = 'INSERT INTO subclass_senses (sub_id, sense_id, range, add) VALUES($1, $2, $3, $4)';
            await query(sql, [sub.id, dbSense.id, sense.range, sense.add]);

            return 'Successfully added Subclass Sense to Database';
        }
    }

    static async remove(sub: { id: bigint }, sense: { id: bigint }) {
        if (!(await this.exists(sub, sense))) throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');

        await query('DELETE FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]);

        return 'Successfully removed Subclass Sense from Database';
    }

    static async update(sub: { id: bigint }, sense: DBSubclassSense) {
        if (!(await this.exists(sub, sense))) throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');

        const sql = 'UPDATE subclass_senses SET sense_id = $1, range = $2, add = $3 WHERE sub_id = $4 AND id = $5';
        await query(sql, [sense.sense_id, sense.range, sense.add, sub.id, sense.id]);

        return 'Successfully updated Subclass Sense in Database';
    }
}

export { SubclassSense };
