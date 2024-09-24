import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Proficiency } from '../..';
import { psql } from '../../psql.ts';
const query = psql.query;

interface CharSubraceProf {
    id: bigint;
    char_id: bigint;
    sub_id: bigint;
    name: string;
    type_id: bigint;
    expert: boolean;
    deleted_at: Date | null;
}

interface AddCharSubraceProf {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class CharacterSubraceProf {
    static async getAll(char: { id: bigint }, sub: { id: bigint }) {
        const results = await query('SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2', [char.id, sub.id]) as CharSubraceProf[];

        if (results.length === 0) throw new NotFoundError('No Character Subrace Proficiencies found', 'Could not find any Subrace Proficiencies for that Character in the Database!');

        return Promise.all(
            results.map(async (charSubProf) => {
                const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

                if (charSubProf.deleted_at) return;

                return {
                    id: charSubProf.id,
                    char_id: char.id,
                    sub_id: sub.id,
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
            const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubraceProf[];

            if (results.length === 0) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');

            const charSubProf = results[0];
            const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

            if (charSubProf.deleted_at) throw new BadRequestError('Character Subrace Proficiency deleted', 'The Subrace Proficiency of that Character that you are trying to view has been deleted!');

            return {
                id: charSubProf.id,
                char_id: char.id,
                sub_id: sub.id,
                type: dbProf,
                name: charSubProf.name,
                expert: charSubProf.expert,
                deleted_at: charSubProf.deleted_at
            };
        }

        const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubraceProf[];

        if (results.length === 0) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find a Subrace Proficiency with that name for that Character in the Database!');

        const charSubProf = results[0];
        const dbProf = await Proficiency.getOne({ id: charSubProf.type_id });

        if (charSubProf.deleted_at) throw new BadRequestError('Character Subrace Proficiency deleted', 'The Subrace Proficiency of that Character that you are trying to view has been deleted!');

        return {
            id: charSubProf.id,
            char_id: char.id,
            sub_id: sub.id,
            type: dbProf,
            name: charSubProf.name,
            expert: charSubProf.expert,
            deleted_at: charSubProf.deleted_at
        };
    }

    static async exists(char: { id: bigint }, sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubraceProf[];

            return results.length === 1;
        }

        const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubraceProf[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, sub: { id: bigint }, prof: { id?: bigint; name?: string }) {
        if (prof.id) {
            const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3';
            const results = await query(sql, [char.id, sub.id, prof.id]) as CharSubraceProf[];

            return !!results[0].deleted_at;
        }

        const sql = 'SELECT * FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND name = $3';
        const results = await query(sql, [char.id, sub.id, prof.name]) as CharSubraceProf[];

        return !!results[0].deleted_at;
    }

    static async add(char: { id: bigint }, sub: { id: bigint }, prof: AddCharSubraceProf) {
        try {
            const charSubProf = await this.getOne(char, sub, prof);

            if (prof.expert === charSubProf.expert) throw new DuplicateError('Duplicate Character Subrace Proficiency', 'That Character already has that Subrace Proficiency in the Database!');

            const sql = 'UPDATE character_subrace_profs SET expert = $1, name = $2 WHERE char_id = $3 AND sub_id = $4 AND id = $5';
            await query(sql, [prof.expert, prof.name, char.id, sub.id, charSubProf.id]);

            return 'Successfully updated Character Subrace Proficiency in Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO character_subrace_profs (char_id, sub_id, name, type, expert) VALUES($1, $2, $3, $4, $5)';
            await query(sql, [char.id, sub.id, prof.name, prof.type_id, prof.expert]);

            return 'Successfully added Subrace Proficiency to Character in Database';
        }
    }

    static async remove(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');

        if (await this.isDeleted(char, sub, prof)) throw new BadRequestError('Character Subrace Proficiency deleted', 'The Subrace Proficiency of that Character that you are trying to remove has already been deleted!');

        const sql = 'UPDATE character_subrace_profs SET deleted_at = $1 WHERE char_id = $2 AND sub_id = $3 AND id = $4';
        await query(sql, [Date.now(), char.id, sub.id, prof.id]);

        return 'Successfully marked Subrace Proficiency as deleted for Character in Database';
    }

    static async remove_final(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');

        await query('DELETE FROM character_subrace_profs WHERE char_id = $1 AND sub_id = $2 AND id = $3', [char.id, sub.id, prof.id]);

        return 'Successfully removed Subrace Proficiency from Character in Database';
    }

    static async update(char: { id: bigint }, sub: { id: bigint }, prof: CharSubraceProf) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');

        if (await this.isDeleted(char, sub, prof)) throw new BadRequestError('Character Subrace Proficiency deleted', 'The Subrace Proficiency of that Character that you are trying to update has been deleted!');

        const sql = 'UPDATE character_subrace_profs SET name = $1, type = $2, expert = $3 WHERE char_id = $4 AND sub_id = $5 AND id = $6';
        await query(sql, [prof.name, prof.type_id, prof.expert, char.id, sub.id, prof.id]);

        return 'Successfully updated Subrace Proficiency of Character in Database';
    }

    static async restore(char: { id: bigint }, sub: { id: bigint }, prof: { id: bigint }) {
        if (!(await this.exists(char, sub, prof))) throw new NotFoundError('Character Subrace Proficiency not found', 'Could not find that Subrace Proficiency for that Character in the Database!');

        if (!(await this.isDeleted(char, sub, prof))) throw new BadRequestError('Character Subrace Proficiency not deleted', 'The Subrace Proficiency of that Character that you are trying to restore has not been deleted!');

        const sql = 'UPDATE character_subrace_profs SET deleted_at = NULL WHERE char_id = $1 AND sub_id = $2 AND id = $3';
        await query(sql, [char.id, sub.id, prof.id]);

        return 'Successfully restored Subrace Proficiency for Character in Database';
    }
}

export { CharacterSubraceProf };
