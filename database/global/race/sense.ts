import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Senses } from '..';
const query = psql.query;

interface DBRaceSense {
    id: bigint;
    race_id: bigint;
    sense_id: bigint;
    range: string;
}

interface AddRaceSense {
    name: string;
    range: string;
}

class RaceSense {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1', [race.id]) as DBRaceSense[];

        if (results.length === 0) throw new NotFoundError('No Race Senses found', 'Could not find any Senses for that Race in the Database!');

        return Promise.all(
            results.map(async (raceSense) => {
                const dbSense = await Senses.getOne({ id: raceSense.sense_id });

                return {
                    id: raceSense.id,
                    race_id: race.id,
                    sense: dbSense,
                    range: raceSense.range
                };
            })
        );
    }

    static async getOne(race: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]) as DBRaceSense[];

            if (results.length === 0) {
                throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');
            }

            const raceSense = results[0];
            const dbSense = await Senses.getOne({ id: raceSense.sense_id });

            return {
                id: raceSense.id,
                race_id: race.id,
                sense: dbSense,
                range: raceSense.range
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND sense_id = $2', [race.id, dbSense.id]) as DBRaceSense[];

        if (results.length === 0) throw new NotFoundError('Race Sense not found', 'Could not find a Sense with that name for that Race in the Database!');

        const raceSense = results[0];

        return {
            id: raceSense.id,
            race_id: race.id,
            sense: dbSense,
            range: raceSense.range
        };
    }

    static async exists(race: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]) as DBRaceSense[];

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM race_senses WHERE race_id = $1 AND sense_id = $2', [race.id, dbSense.id]) as DBRaceSense[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, sense: AddRaceSense) {
        if (await this.exists(race, sense)) throw new DuplicateError('Duplicate Race Sense', 'That Sense is already linked to that Race in the Database!');

        const dbSense = await Senses.getOne({ name: sense.name });
        const sql = 'INSERT INTO race_senses (race_id, sense_id, range) VALUES($1, $2, $3)';
        await query(sql, [race.id, dbSense.id, sense.range]);

        return 'Successfully added Race Sense to Database';
    }

    static async remove(race: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (!(await this.exists(race, sense))) throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');

        await query('DELETE FROM race_senses WHERE race_id = $1 AND id = $2', [race.id, sense.id]);

        return 'Successfully removed Race Sense from Database';
    }

    static async update(race: { id: bigint }, sense: DBRaceSense) {
        if (!(await this.exists(race, sense))) throw new NotFoundError('Race Sense not found', 'Could not find that Sense for that Race in the Database!');

        const sql = 'UPDATE race_senses SET range = $1, sense_id = $2 WHERE race_id = $3 AND id = $4';
        await query(sql, [sense.range, sense.sense_id, race.id, sense.id]);

        return 'Successfully updated Race Sense in Database';
    }
}

export { RaceSense };
