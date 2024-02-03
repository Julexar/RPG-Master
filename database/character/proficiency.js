import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Proficiency } from '..';
const query = psql.query;

class CharacterProficiency {
    static async getAll(char, prof) {
        if (!prof.type) {
            const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1', [char.id]);

            if (results.length === 0) throw new NotFoundError('No Character Proficiencies found', 'Could not find any Proficiencies for that Character in the Database!');

            return Promise.all(
                results.map(async (charProf) => {
                    const dbProf = await Proficiency.getOne({ id: charProf.type_id });

                    if (charProf.deleted_at) return;

                    return {
                        id: charProf.id,
                        char_id: char.id,
                        type: dbProf,
                        name: charProf.name,
                        expert: charProf.expert,
                        deleted_at: charProf.deleted_at
                    };
                })
            );
        }

        const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND type = $2', [char.id, prof.type]);

        if (results.length === 0) throw new NotFoundError('No Character Proficiencies found', 'Could not find any Proficiencies of that type for that Character in the Database!');

        return Promise.all(
            results.map(async (charProf) => {
                const dbProf = await Proficiency.getOne({ id: charProf.type_id });

                if (charProf.deleted_at) return;

                return {
                    id: charProf.id,
                    char_id: char.id,
                    type: dbProf,
                    name: charProf.name,
                    expert: charProf.expert,
                    deleted_at: charProf.deleted_at
                };
            })
        );
    }

    static async getOne(char, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2', [char.id, prof.id]);

            if (results.length === 0) throw new NotFoundError('Character Proficiency not found', 'Could not find that Proficiency for that Character in the Database!');

            const charProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charProf.type });

            if (charProf.deleted_at) throw new BadRequestError('Character Proficiency deleted', 'The Proficiency of that Character that you are trying to view has been deleted!');

            return {
                id: charProf.id,
                char_id: char.id,
                type: dbProf,
                name: charProf.name,
                expert: charProf.expert,
                deleted_at: charProf.deleted_at
            };
        }

        const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2', [char.id, prof.name]);

        if (results.length === 0) throw new NotFoundError('Character Proficiency not found', 'Could not find a Character Proficiency with that name in the Database!');

        const charProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charProf.type });

        if (charProf.deleted_at) throw new BadRequestError('Character Proficiency deleted', 'The Proficiency of that Character that you are trying to view has been deleted!');

        return {
            id: charProf.id,
            char_id: char.id,
            type: dbProf,
            name: charProf.name,
            expert: charProf.expert,
            deleted_at: charProf.deleted_at
        };
    }

    static async exists(char, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2', [char.id, prof.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2', [char.id, prof.name]);

        return results.length === 1;
    }

    static async isDeleted(char, prof) {
        if (prof.id) {
            const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND id = $2', [char.id, prof.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_proficiencies WHERE char_id = $1 AND name = $2', [char.id, prof.name]);

        return !!results[0].deleted_at;
    }

    static async add(char, prof) {
        try {
            const charProf = await this.getOne(char, prof);

            if (prof.expert === charProf.expert) throw new DuplicateError('Duplicate Character Proficiency', 'That Character already has that Proficiency!');

            const sql = 'UPDATE character_proficiencies SET expert = $1 WHERE char_id = $2 AND id = $3';
            await query(sql, [prof.expert, char.id, charProf.id]);

            return 'Successfully updated Character Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO character_proficiencies (char_id, name, type, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [char.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Character Proficiency to Database';
        }
    }

    static async remove(char, prof) {
        if (!(await this.exists(char, prof))) throw new NotFoundError('Character Proficiency not found', 'Could not find that Proficiency for that Character in the Database!');

        if (await this.isDeleted(char, prof)) throw new BadRequestError('Character Proficiency deleted', 'The Proficiency of that Character that you are trying to remove has already been deleted!');

        const sql = 'UPDATE character_proficiencies SET deleted_at = $1 WHERE char_id = $2 AND id = $3';
        await query(sql, [Date.now(), char.id, prof.id]);

        return 'Successfully deleted Character Proficiency';
    }

    static async remove_final(char, prof) {
        if (!(await this.exists(char, prof))) throw new NotFoundError('Character Proficiency not found', 'Could not find that Proficiency for that Character in the Database!');

        await query('DELETE FROM character_proficiencies WHERE char_id = $1 AND id = $2', [char.id, prof.id]);

        return 'Successfully removed Character Proficiency from Database';
    }

    static async update(char, prof) {
        if (!(await this.exists(char, prof))) throw new NotFoundError('Character Proficiency not found', 'Could not find that Proficiency for that Character in the Database!');

        if (await this.isDeleted(char, prof)) throw new BadRequestError('Character Proficiency deleted', 'The Proficiency of that Character that you are trying to update has been deleted!');

        const sql = 'UPDATE character_proficiencies SET name = $1, type = $2, expert = $3 WHERE char_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.type, prof.expert, char.id, prof.id]);

        return 'Successfully updated Character Proficiency in Database';
    }

    static async restore(char, prof) {
        if (!(await this.exists(char, prof))) throw new NotFoundError('Character Proficiency not found', 'Could not find that Proficiency for that Character in the Database!');

        const sql = 'UPDATE character_proficiencies SET deleted_at = NULL WHERE char_id = $1 AND id = $2';
        await query(sql, [char.id, prof.id]);

        return 'Successfully restored Character Proficiency in Database';
    }
}

export { CharacterProficiency };
