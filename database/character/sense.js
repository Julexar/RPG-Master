import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Senses } from '../global/senses.js';
const query = psql.query;

class CharacterSense {
    static async getAll(char) {
        const results = await this.query('SELECT * FROM character_senses WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Senses found', 'Could not find any Senses for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charSense) => {
                const dbSense = await Senses.getOne({ id: charSense.sense_id });

                return {
                    id: charSense.id,
                    char_id: char.id,
                    sense_id: dbSense.id,
                    name: dbSense.name,
                    range: charSense.range,
                };
            })
        );
    }

    static async getOne(char, sense) {
        if (sense.id) {
            const results = await this.query('SELECT * FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');
            }

            const charSense = results[0];
            const dbSense = await Senses.getOne({ id: charSense.sense_id });

            return {
                id: charSense.id,
                char_id: char.id,
                sense_id: dbSense.id,
                name: dbSense.name,
                range: charSense.range,
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await this.query('SELECT * FROM character_senses WHERE char_id = $1 AND sense_id = $2', [char.id, dbSense.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character Sense not found', 'Could not find a Sense with that name for that Character in the Database!');
        }

        const charSense = results[0];

        return {
            id: charSense.id,
            char_id: char.id,
            sense_id: dbSense.id,
            name: dbSense.name,
            range: charSense.range,
        };
    }

    static async exists(char, sense) {
        if (sense.id) {
            const results = await this.query('SELECT * FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]);

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await this.query('SELECT * FROM character_senses WHERE char_id = $1 AND sense_id = $2', [char.id, dbSense.id]);

        return results.length === 1;
    }

    static async add(char, sense) {
        try {
            const charSense = await this.getOne(char, sense);

            if (sense.range <= charSense.range) {
                throw new DuplicateError('Duplicate Character Sense', 'That Character already has that Sense with the same or a larger range!');
            }

            await query('UPDATE character_senses SET range = $1 WHERE char_id = $2 AND name = $3', [sense.range, char.id, sense.name]);

            return 'Successfully updated Character Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            if (!sense.sense_id) {
                const dbSense = await Senses.getOne({ name: sense.name });

                sense.sense_id = dbSense.id;
            }

            const sql = 'INSERT INTO character_senses (char_id, sense_id, range) VALUES($1, $2, $3)';
            await query(sql, [char.id, sense.sense_id, sense.range]);

            return 'Successfully added Character Sense to Database';
        }
    }

    static async remove(char, sense) {
        if (!(await this.exists(char, sense))) {
            throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');
        }

        await query('DELETE FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]);

        return 'Successfully removed Character Sense from Database';
    }

    static async update(char, sense) {
        if (!(await this.exists(char, sense))) {
            throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const sql = 'UPDATE character_senses SET sense_id = $1, range = $2 WHERE char_id = $3 AND id = $4';
        await query(sql, [dbSense.id, sense.range, char.id, sense.id]);

        return 'Successfully updated Character Sense in Database';
    }
}

export { CharacterSense };
