import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Senses } from '../global/senses.js';
const query = psql.query;

class RaceSense {
    static async getAll(race) {
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1', [race.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Race Senses found', 'Could not find any Senses for that Race in the Database!');
        }

        return Promise.all(
            results.map(async (raceSense) => {
                const dbSense = await Senses.getOne({ id: raceSense.sense_id });

                return {
                    id: raceSense.id,
                    race_id: race.id,
                    name: dbSense.name,
                    sense_id: dbSense.id,
                    range: raceSense.range,
                };
            })
        );
    }

    static async getOne(race, sense) {
        if (sense.id) {
            const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]);

            if (results.length === 0) {
                throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');
            }

            const raceSense = results[0];
            const dbSense = await Senses.getOne({ id: raceSense.sense_id });

            return {
                id: raceSense.id,
                race_id: race.id,
                name: dbSense.name,
                sense_id: dbSense.id,
                range: raceSense.range,
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND key = $2', [race.id, dbSense.key]);

        if (results.length === 0) {
            throw new NotFoundError('Race Sense not found', 'Could not find a Sense with that name for that Race in the Database!');
        }

        const raceSense = results[0];

        return {
            id: raceSense.id,
            race_id: race.id,
            name: dbSense.name,
            sense_id: dbSense.id,
            range: raceSense.range,
        };
    }

    static async exists(race, sense) {
        if (sense.id) {
            const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]);

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND key = $2', [race.id, dbSense.key]);

        return results.length === 1;
    }

    static async add(race, sense) {
        if (await this.exists(race, sense)) {
            throw new DuplicateError('Duplicate Race Sense', 'That Sense is already linked to that Race in the Database!');
        }

        const sql = 'INSERT INTO race_senses (race_id, sense_id, range) VALUES($1, $2, $3)';
        await query(sql, [race.id, sense.sense_id, sense.range]);

        return 'Successfully added Race Sense to Database';
    }

    static async remove(race, sense) {
        if (!(await this.exists(race, sense))) {
            throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');
        }

        await query('DELETE FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]);

        return 'Successfully removed Race Sense from Database';
    }

    static async update(race, sense) {
        if (!(await this.exists(race, sense))) {
            throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');
        }

        const sql = 'UPDATE race_senses SET range = $1, sense_id = $2 WHERE race_id = $3 AND id = $4';
        await query(sql, [sense.range, sense.sense_id, race.id, sense.id]);

        return 'Successfully updated Race Sense in Database';
    }
}

export { RaceSense };
