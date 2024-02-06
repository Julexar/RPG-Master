import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Senses } from '..';
const query = psql.query;

interface CharSense {
    id: bigint;
    char_id: bigint;
    sense_id: bigint;
    range: number;
    deleted_at: Date | null;
}

interface AddCharSense {
    name?: string;
    sense_id?: bigint;
    range: number;
}

class CharacterSense {
    static async getAll(char: { id: bigint }) {
        const results = await query('SELECT * FROM character_senses WHERE char_id = $1', [char.id]) as CharSense[];

        if (results.length === 0) throw new NotFoundError('No Character Senses found', 'Could not find any Senses for that Character in the Database!');

        return Promise.all(
            results.map(async (charSense) => {
                const dbSense = await Senses.getOne({ id: charSense.sense_id });

                if (charSense.deleted_at) return;

                return {
                    id: charSense.id,
                    char_id: char.id,
                    sense: dbSense,
                    range: charSense.range,
                    deleted_at: charSense.deleted_at
                };
            })
        );
    }

    static async getOne(char: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]) as CharSense[];

            if (results.length === 0) throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');

            const charSense = results[0];
            const dbSense = await Senses.getOne({ id: charSense.sense_id });

            if (charSense.deleted_at) throw new BadRequestError('Character Sense deleted', 'The Sense of that Character that you are trying to view has been deleted!');

            return {
                id: charSense.id,
                char_id: char.id,
                sense: dbSense,
                range: charSense.range,
                deleted_at: charSense.deleted_at
            };
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND sense_id = $2', [char.id, dbSense.id]) as CharSense[];

        if (results.length === 0) throw new NotFoundError('Character Sense not found', 'Could not find a Sense with that name for that Character in the Database!');

        const charSense = results[0];

        if (charSense.deleted_at) throw new BadRequestError('Character Sense deleted', 'The Sense of that Character that you are trying to view has been deleted!');

        return {
            id: charSense.id,
            char_id: char.id,
            sense: dbSense,
            range: charSense.range,
            deleted_at: charSense.deleted_at
        };
    }

    static async exists(char: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]) as CharSense[];

            return results.length === 1;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND sense_id = $2', [char.id, dbSense.id]) as CharSense[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, sense: { id?: bigint, name?: string }) {
        if (sense.id) {
            const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]) as CharSense[];

            return !!results[0].deleted_at;
        }

        const dbSense = await Senses.getOne({ name: sense.name });
        const results = await query('SELECT * FROM character_senses WHERE char_id = $1 AND sense_id = $2', [char.id, dbSense.id]) as CharSense[];

        return !!results[0].deleted_at;
    }

    static async add(char: { id: bigint }, sense: AddCharSense) {
        try {
            const charSense = await this.getOne(char, sense);

            if (sense.range <= charSense.range) throw new DuplicateError('Duplicate Character Sense', 'That Character already has that Sense with the same or a larger range!');

            await query('UPDATE character_senses SET range = $1 WHERE char_id = $2 AND id = $3', [sense.range, char.id, charSense.id]);

            return 'Successfully updated Character Sense in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            if (!sense.sense_id) {
                const dbSense = await Senses.getOne({ name: sense.name });

                sense.sense_id = dbSense.id;
            }

            const sql = 'INSERT INTO character_senses (char_id, sense_id, range) VALUES($1, $2, $3)';
            await query(sql, [char.id, sense.sense_id, sense.range]);

            return 'Successfully added Character Sense to Database';
        }
    }

    static async remove(char: { id: bigint }, sense: { id: bigint }) {
        if (!(await this.exists(char, sense))) throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');

        if (await this.isDeleted(char, sense)) throw new BadRequestError('Character Sense deleted', 'The Sense of that Character that you are trying to remove has already been deleted!');

        await query('UPDATE character_senses SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, sense.id]);

        return 'Successfully marked Character Sense as deleted in Database';
    }

    static async remove_final(char: { id: bigint }, sense: { id: bigint }) {
        if (!(await this.exists(char, sense))) throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');

        await query('DELETE FROM character_senses WHERE char_id = $1 AND id = $2', [char.id, sense.id]);

        return 'Successfully removed Character Sense from Database';
    }

    static async update(char: { id: bigint }, sense: CharSense) {
        if (!(await this.exists(char, sense))) throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');

        if (await this.isDeleted(char, sense)) throw new BadRequestError('Character Sense deleted', 'The Sense of that Character that you are trying to update has been deleted!');

        const dbSense = await Senses.getOne({ id: sense.sense_id });
        const sql = 'UPDATE character_senses SET sense_id = $1, range = $2 WHERE char_id = $3 AND id = $4';
        await query(sql, [dbSense.id, sense.range, char.id, sense.id]);

        return 'Successfully updated Character Sense in Database';
    }

    static async restore(char: { id: bigint }, sense: { id: bigint }) {
        if (!(await this.exists(char, sense))) throw new NotFoundError('Character Sense not found', 'Could not find that Sense for that Character in the Database!');

        if (!(await this.isDeleted(char, sense))) throw new BadRequestError('Character Sense not deleted', 'The Sense of that Character that you are trying to restore has not been deleted!');

        await query('UPDATE character_senses SET deleted_at = NULL WHERE char_id = $1 AND id = $2', [char.id, sense.id]);

        return 'Successfully restored Character Sense in Database';
    }
}

export { CharacterSense };
