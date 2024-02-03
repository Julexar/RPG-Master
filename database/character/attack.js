import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
const query = psql.query;

class CharacterAttack {
    static async getAll(char) {
        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1', [char.id]);

        if (results.length === 0) throw new NotFoundError('No Attacks found', 'Could not find any Attacks for that Character in the Database!');

        return results.map((atk) => {
            if (atk.deleted_at) return;

            return atk;
        });
    }

    static async getOne(char, atk) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

            if (results.length === 0) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Attack deleted', 'The Attack you are trying to view has been deleted!');

            return results[0];
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]);

        if (results.length === 0) throw new NotFoundError('Attack not found', 'Could not find an Attack with that name in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Attack deleted', 'The Attack you are trying to view has been deleted!');

        return results[0];
    }

    static async exists(char, atk) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]);

        return results.length === 1;
    }

    static async isDeleted(char, atk) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]);

        return !!results[0].deleted_at;
    }

    static async add(char, atk) {
        if (await this.exists(char, atk)) throw new DuplicateError('Duplicate Attack', 'An Attack with that name already exists for that Character!');

        const sql = 'INSERT INTO character_attacks (char_id, name, description, atk_stat, save_dc, save_stat, on_fail_dmg, damage, dmg_bonus, dmgtype_id, magic_bonus, proficient) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [
            char.id,
            atk.name,
            atk.description,
            atk.atk_stat,
            atk.save_dc,
            atk.save_stat,
            atk.on_fail_dmg,
            atk.damage,
            atk.dmg_bonus,
            atk.dmgtype_id,
            atk.magic_bonus,
            atk.proficient
        ]);

        return 'Successfully added Attack to Character in Database';
    }

    static async remove(char, atk) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        if (await this.isDeleted(char, atk)) throw new BadRequestError('Attack deleted', 'The Attack you are trying to remove has already been deleted!');

        await query('UPDATE character_attacks SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, atk.id]);

        return 'Successfully marked Attack as deleted for Character in Database';
    }

    static async remove_final(char, atk) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        await query('DELETE FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

        return 'Successfully removed Attack from Character in Database';
    }

    static async update(char, atk) {
        if (!(await this.exists(char, atk))) throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');

        if (await this.isDeleted(char, atk)) throw new BadRequestError('Attack deleted', 'The Attack you are trying to update has been deleted!');

        const sql = 'UPDATE character_attacks SET name = $1, description = $2, atk_stat = $3, save_dc = $4, save_stat = $5, on_fail_dmg = $6, damage = $7, dmg_bonus = $8, dmgtype_id = $9, magic_bonus = $10, proficient = $11 WHERE char_id = $12 AND id = $13';
        await query(sql, [
            atk.name,
            atk.description,
            atk.atk_stat,
            atk.save_dc,
            atk.save_stat,
            atk.on_fail_dmg,
            atk.damage,
            atk.dmg_bonus,
            atk.dmgtype_id,
            atk.magic_bonus,
            atk.proficient,
            char.id,
            atk.id
        ]);

        return 'Successfully updated Character Attack in Database';
    }
}

export { CharacterAttack };
