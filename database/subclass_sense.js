import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
import { Senses } from './senses.js';
const query = psql.query;

class SubclassSense {
    static async getAll(sub) {
        const results = await this.query('SELECT * FROM subclass_senses WHERE sub_id = $1', [sub.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Subclass Senses found', 'Could not find any Senses for that Subclass in the Database!');
        }

        return Promise.all(
            results.map(async (subSense) => {
                const dbSense = await Senses.getOne({ id: subSense.sense_id });

                return {
                    id: subSense.id,
                    sub_id: sub.id,
                    name: dbSense.name,
                    sense_id: dbSense.id,
                    range: subSense.range,
                };
            })
        );
    }

    static async getOne(sub, sense) {
        if (sense.id) {
            const results = await this.query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]);

            if (results.length === 0) {
                throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');
            }

            const subSense = results[0];
            const dbSense = await Senses.getOne({ id: subSense.sense_id });

            return {
                id: subSense.id,
                sub_id: sub.id,
                name: dbSense.name,
                sense_id: dbSense.id,
                range: subSense.range,
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await this.query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]);

        if (results.length === 0) {
            throw new NotFoundError('Subclass Sense not found', 'Could not find a Sense with that name for that Subclass in the Database!');
        }

        const subSense = results[0];

        return {
            id: subSense.id,
            sub_id: sub.id,
            name: dbSense.name,
            sense_id: dbSense.id,
            range: subSense.range,
        };
    }

    static async exists(sub, sense) {
        if (sense.id) {
            const results = await this.query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]);

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await this.query('SELECT * FROM subclass_senses WHERE sub_id = $1 AND sense_id = $2', [sub.id, dbSense.id]);

        return results.length === 1;
    }

    static async add(sub, sense) {
        try {
            const subSense = await this.getOne(sub, sense);

            if (sense.range <= subSense.range) {
                throw new DuplicateError('Duplicate Subclass Sense', 'That Sense is already linked to that Subclass with the same or a higher range!');
            }

            await query('UPDATE subclass_senses SET range = $1 WHERE sub_id = $2 AND id = $3', [sense.range, sub.id, sense.id]);

            return 'Successfully updated Subclass Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO subclass_senses (sub_id, sense_id, range) VALUES($1, $2, $3)';
            await query(sql, [sub.id, sense.sense_id, sense.range]);

            return 'Successfully added Subclass Sense to Database';
        }
    }

    static async remove(sub, sense) {
        if (!(await this.exists(sub, sense))) {
            throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');
        }

        await query('DELETE FROM subclass_senses WHERE sub_id = $1 AND id = $2', [sub.id, sense.id]);

        return 'Successfully removed Subclass Sense from Database';
    }

    static async update(sub, sense) {
        if (!(await this.exists(sub, sense))) {
            throw new NotFoundError('Subclass Sense not found', 'Could not find that Sense for that Subclass in the Database!');
        }

        const sql = 'UPDATE subclass_senses SET sense_id = $1, range = $2 WHERE sub_id = $3 AND id = $4';
        await query(sql, [sense.sense_id, sense.range, sub.id, sense.id]);

        return 'Successfully updated Subclass Sense in Database';
    }
}

export { SubclassSense };
