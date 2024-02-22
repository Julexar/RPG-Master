import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Proficiency } from '../../global';
const query = psql.query;

class CharacterClassProficiency {
    static async getAll(char, clas) {
        const results = await query('SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2', [char.id, clas.id]);

        if (results.length === 0)
            throw new NotFoundError(
                'No Character Class Proficiencies found',
                'Could not find any Proficiencies granted by that Class for that Character in the Database!'
            );

        return Promise.all(
            results.map(async charProf => {
                const dbProf = await Proficiency.getOne({ id: charProf.type_id });

                if (charProf.deleted_at) return;

                return {
                    id: charProf.id,
                    char_id: char.id,
                    class_id: clas.id,
                    name: charProf.name,
                    type: dbProf,
                    expert: charProf.expert,
                    deleted_at: charProf.deleted_at,
                };
            })
        );
    }

    static async getOne(char, clas, prof) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, prof.id]);

            if (results.length === 0)
                throw new NotFoundError(
                    'Character Class Proficiency not found',
                    'Could not find that Proficiency granted by that Class for that Character in the Database!'
                );

            const charProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charProf.id });

            if (charProf.deleted_at)
                throw new BadRequestError(
                    'Character Class Proficiency deleted',
                    'The Character Class Proficiency you are trying to view has been deleted!'
                );

            return {
                id: charProf.id,
                char_id: char.id,
                class_id: clas.id,
                name: charProf.name,
                type: dbProf,
                expert: charProf.expert,
                deleted_at: charProf.deleted_at,
            };
        }

        const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3';
        const results = await query(sql, [char.id, clas.id, prof.name]);

        if (results.length === 0)
            throw new NotFoundError(
                'Character Class Proficiency not found',
                'Could not find a Proficiency granted by that Class with that name for that Character in the Database!'
            );

        const charProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charProf.id });

        if (charProf.deleted_at)
            throw new BadRequestError(
                'Character Class Proficiency deleted',
                'The Character Class Proficiency you are trying to view has been deleted!'
            );

        return {
            id: charProf.id,
            char_id: char.id,
            class_id: clas.id,
            name: charProf.name,
            type: dbProf,
            expert: charProf.expert,
            deleted_at: charProf.deleted_at,
        };
    }

    static async exists(char, clas, prof) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, prof.id]);

            return results.length === 1;
        }

        const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3';
        const results = await query(sql, [char.id, clas.id, prof.name]);

        return results.length === 1;
    }

    static async isDeleted(char, clas, prof) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, prof.id]);

            return !!results[0].deleted_at;
        }

        const sql = 'SELECT * FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND name = $3';
        const results = await query(sql, [char.id, clas.id, prof.name]);

        return !!results[0].deleted_at;
    }

    static async add(char, clas, prof) {
        try {
            const charProf = await this.getOne(char, clas, prof);

            if (prof.expert === charProf.expert)
                throw new DuplicateError(
                    'Duplicate Character Class Proficiency',
                    'That Character already has that Proficiency granted by that Class!'
                );

            const sql = 'UPDATE character_class_profs SET expert = $1 WHERE char_id = $2 AND class_id = $3 AND id = $4';
            await query(sql, [prof.expert, char.id, clas.id, prof.id]);

            return 'Successfully updated Character Class Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO character_class_profs (char_id, class_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [char.id, clas.id, prof.name, prof.type, prof.expert]);

            return 'Successfully added Character Class Proficiency to Database';
        }
    }

    static async remove(char, clas, prof) {
        if (!(await this.exists(char, clas, prof)))
            throw new NotFoundError(
                'Character Class Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );

        if (await this.isDeleted(char, clas, prof))
            throw new BadRequestError(
                'Character Class Proficiency deleted',
                'The Character Class Proficiency you are trying to remove has already been deleted!'
            );

        const sql = 'UPDATE character_class_profs SET deleted_at = $1 WHERE char_id = $2 AND class_id = $3 AND id = $4';
        await query(sql, [Date.now(), char.id, clas.id, prof.id]);

        return 'Successfully marked Character Class Proficiency as deleted in Database';
    }

    static async remove_final(char, clas, prof) {
        if (!(await this.exists(char, clas, prof)))
            throw new NotFoundError(
                'Character Class Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );

        await query('DELETE FROM character_class_profs WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, prof.id]);

        return 'Successfully removed Character Class Proficiency from Database';
    }

    static async update(char, clas, prof) {
        if (!(await this.exists(char, clas, prof)))
            throw new NotFoundError(
                'Character Class Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );

        if (await this.isDeleted(char, clas, prof))
            throw new BadRequestError(
                'Character Class Proficiency deleted',
                'The Character Class Proficiency you are trying to update has been deleted!'
            );

        const sql = 'UPDATE character_class_profs SET name = $1, expert = $2 WHERE char_id = $3 AND class_id = $4 AND id = $5';
        await query(sql, [prof.name, prof.expert, char.id, clas.id, prof.id]);

        return 'Successfully updated Character Class Proficiency in Database';
    }

    static async restore(char, clas, prof) {
        if (!(await this.exists(char, clas, prof)))
            throw new NotFoundError(
                'Character Class Proficiency not found',
                'Could not find that Proficiency granted by that Class for that Character in the Database!'
            );

        if (!(await this.isDeleted(char, clas, prof)))
            throw new BadRequestError(
                'Character Class Proficiency not deleted',
                'The Character Class Proficiency you are trying to restore has not been deleted!'
            );

        const sql = 'UPDATE character_class_profs SET deleted_at = NULL WHERE char_id = $1 AND class_id = $2 AND id = $3';
        await query(sql, [char.id, clas.id, prof.id]);

        return 'Successfully restored Character Class Proficiency in Database';
    }
}

export { CharacterClassProficiency };
