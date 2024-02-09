import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Senses } from '..';
const query = psql.query;

interface DBClassSense {
    id: bigint;
    class_id: bigint;
    sense_id: bigint;
    range: number;
}

interface AddClassSense {
    sense_id: bigint;
    range: number;
}

class ClassSense {
    static async getAll(clas: { id: bigint }) {
        const results = await query('SELECT * FROM class_senses WHERE class_id = $1', [clas.id]) as DBClassSense[];

        if (results.length === 0) throw new NotFoundError('No Class Senses found', 'Could not find any Senses for that Class in the Database!');

        return Promise.all(
            results.map(async (classSense) => {
                const dbSense = await Senses.getOne({ id: classSense.sense_id });

                return {
                    id: classSense.id,
                    class_id: clas.id,
                    sense: dbSense,
                    range: classSense.range
                };
            })
        );
    }

    static async getOne(clas: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM class_senses WHERE class_id = $1 AND id = $2', [clas.id, sense.id]) as DBClassSense[];

            if (results.length === 0) throw new NotFoundError('Class Sense not found', 'Could not find that Sense for that Class in the Database!');

            const classSense = results[0];
            const dbSense = await Senses.getOne({ id: classSense.sense_id });

            return {
                id: classSense.id,
                class_id: clas.id,
                sense: dbSense,
                range: classSense.range
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2', [clas.id, dbSense.id]) as DBClassSense[];

        if (results.length === 0) throw new NotFoundError('Class Sense not found', 'Could not find that Sense for that Class in the Database!');

        const classSense = results[0];

        return {
            id: classSense.id,
            class_id: clas.id,
            sense: dbSense.id,
            range: classSense.range
        };
    }

    static async exists(clas: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM class_senses WHERE class_id = $1 AND id = $2', [clas.id, sense.id]) as DBClassSense[];

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2', [clas.id, dbSense.id]) as DBClassSense[];

        return results.length === 1;
    }

    static async add(clas: { id: bigint }, sense: AddClassSense) {
        try {
            const classSense = await this.getOne(clas, { id: sense.sense_id });

            if (sense.range <= classSense.range) throw new DuplicateError('Duplicate Class Sense', 'That Sense is already linked to that Class with the same or a higher range!');

            await query('UPDATE class_senses SET range = $1 WHERE class_id = $2 AND sense_id = $3', [sense.range, clas.id, classSense.id]);

            return 'Successfully updated Class Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const classSense = await this.getOne(clas, { id: sense.sense_id });
            const sql = 'INSERT INTO class_senses (class_id, sense_id, range) VALUES($1, $2, $3)';
            await query(sql, [clas.id, classSense.id, sense.range]);

            return 'Successfully added Class Sense to Database';
        }
    }

    static async remove(clas: { id: bigint }, sense: { id: bigint, name?: string }) {
        if (!(await this.exists(clas, sense))) throw new NotFoundError('Class Sense not found', 'Could not find that Sense for that Class in the Database!');

        await query('DELETE FROM class_senses WHERE class_id = $1 AND id = $2', [clas.id, sense.id]);

        return 'Successfully removed Class Sense from Database';
    }

    static async update(clas: { id: bigint }, sense: DBClassSense) {
        if (!(await this.exists(clas, sense))) throw new NotFoundError('Class Sense not found', 'Could not find that Sense for that Class in the Database!');

        await query('UPDATE class_senses SET range = $1 WHERE class_id = $2 AND id = $3', [sense.range, clas.id, sense.id]);

        return 'Successfully updated Class Saves in Database';
    }
}

export { ClassSense };
