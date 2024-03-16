import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Proficiency } from '../..';
const query = psql.query;

interface CharSubclassProf {
    id: bigint;
    char_id: bigint;
    sub_id: bigint;
    name: string;
    type_id: bigint;
    expert: boolean;
    deleted_at: Date | null;
}

interface AddCharSubclassProf {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class CharacterSubclassProficiency {
    static async getAll(char: { id: bigint }, sub: { id: bigint }) {
        const results = await query('SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2', [char.id, sub.id]) as CharSubclassProf[];

        if (results.length === 0) throw new NotFoundError('No Character Subclass Proficiencies found','Could not find any Subclass Proficiencies for that Character in the Database!');

        return Promise.all(
            results.map(async (charSubProf) => {
                const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

                if (charSubProf.deleted_at) return;

                return {
                    id: charSubProf.id,
                    sub_id: sub.id,
                    char_id: char.id,
                    type: dbProf,
                    name: charSubProf.name,
                    expert: charSubProf.expert,
                    deleted_at: charSubProf.deleted_at
                };
            })
        );
    }

    static async getOne(char: { id: bigint }, sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubclassProf[];

            if (results.length === 0) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find that Subclass Proficiency for that Character in the Database!');

            const charSubProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

            if (charSubProf.deleted_at) throw new BadRequestError('Character Subclass Proficiency deleted', 'That Subclass Proficiency has been deleted from the Character!');

            return {
                id: charSubProf.id,
                sub_id: sub.id,
                char_id: char.id,
                type: dbProf,
                name: charSubProf.name,
                expert: charSubProf.expert,
                deleted_at: charSubProf.deleted_at
            };
        }

        const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubclassProf[];

        if (results.length === 0) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find a Subclass Proficiency with that name for that Character in the Database!');

        const charSubProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

        if (charSubProf.deleted_at) throw new BadRequestError('Character Subclass Proficiency deleted', 'That Subclass Proficiency has been deleted from the Character!');

        return {
            id: charSubProf.id,
            sub_id: sub.id,
            char_id: char.id,
            type: dbProf,
            name: charSubProf.name,
            expert: charSubProf.expert,
            deleted_at: charSubProf.deleted_at
        };
    }

    static async exists(char: { id: bigint }, sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubclassProf[];

            return results.length === 1;
        }

        const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubclassProf[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubclassProf[];

            return !!results[0].deleted_at;
        }

        const sql = 'SELECT * FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubclassProf[];

        return !!results[0].deleted_at;
    }

    static async add(char: { id: bigint }, sub: { id: bigint }, prof: AddCharSubclassProf) {
        try {
            const charSubProf = await this.getOne(char, sub, prof);

            if (prof.expert === charSubProf.expert) throw new DuplicateError('Duplicate Character Subclass Proficiency', 'That Subclass Proficiency is already linked to that Character!');

            const sql = 'UPDATE character_subclass_profs SET expert = $1 WHERE char_id = $2 AND sub_id = $3 AND id = $4';
            await query(sql, [prof.expert, char.id, sub.id, charSubProf.id]);

            return 'Successfully updated Character Subclass Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO character_subclass_profs (char_id, sub_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [char.id, sub.id, prof.name, prof.type_id, prof.expert]);

            return 'Successfully added Subclass Proficiency to that Character in Database';
        }
    }

    static async remove(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find that Subclass Proficiency of that Character in the Database!');

        const sql = 'UPDATE character_subclass_profs SET deleted_at = $1 WHERE char_id = $2 AND sub_id = $3 AND id = $4';
        await query(sql, [Date.now(), char.id, sub.id, prof.id]);

        return 'Successfully marked Subclass Proficiency as deleted for that Character in Database';
    }

    static async remove_final(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find that Subclass Proficiency of that Character in the Database!');

        await query('DELETE FROM character_subclass_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3', [char.id, sub.id, prof.id]);

        return 'Successfully removed Subclass Proficiency of that Character from Database';
    }

    static async update(char: { id: bigint }, sub: { id: bigint }, prof: CharSubclassProf) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find that Subclass Proficiency of that Character in the Database!');

        if (await this.isDeleted(char, sub, prof)) throw new BadRequestError('Character Subclass Proficiency deleted', 'The Subclass Proficiency you are trying to update has been deleted from the Character!');

        const sql = 'UPDATE character_subclass_profs SET name = $1, type_id = $2, expert = $3 WHERE char_id = $4 AND sub_id = $5 AND id = $6';
        await query(sql, [prof.name, prof.type_id, prof.expert, char.id, sub.id, prof.id]);

        return 'Successfully updated Character Subclass Proficiency in Database';
    }

    static async restore(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subclass Proficiency not found', 'Could not find that Subclass Proficiency of that Character in the Database!');

        if (!(await this.isDeleted(char, sub, prof))) throw new BadRequestError('Character Subclass Proficiency not deleted', 'The Subclass Proficiency you are trying to restore has not been deleted from the Character!');

        const sql = 'UPDATE character_subclass_profs SET deleted_at = NULL WHERE char_id = $1 AND sub_id = $2 AND id = $3';
        await query(sql, [char.id, sub.id, prof.id]);

        return 'Successfully restored Subclass Proficiency for that Character in Database';
    }
}

export { CharacterSubclassProficiency };
