import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const query = psql.query;

class CharacterAttack {
    static async getAll(char) {
        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Attacks found', 'Could not find any Attacks for that Character in the Database!');
        }

        return results;
    }

    static async getOne(char, atk) {
        if (atk.id) {
            const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

            if (results.length === 0) {
                throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM character_attacks WHERE char_id = $1 AND name = $2', [char.id, atk.name]);

        if (results.length === 0) {
            throw new NotFoundError('Attack not found', 'Could not find an Attack with that name in the Database!');
        }

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

    static async add(char, atk) {
        if (await this.exists(char, atk)) {
            throw new DuplicateError('Duplicate Attack', 'An Attack with that name already exists for that Character!');
        }

        const sql = 'INSERT INTO character_attacks (char_id, name, description, atk_stat, save, save_stat, on_fail, dmg_dice, dmg_dice_size, dmg, dmg_type_id, magical, magic_bonus) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)';
        await query(sql, [char.id, atk.name, atk.description, atk.atk_stat, atk.save, atk.on_fail, atk.dmg_dice, atk.dmg_dice_size, atk.dmg, atk.dmg_type_id, atk.magical, atk.magic_bonus]);

        return 'Successfully added Attack to Character in Database';
    }

    static async remove(char, atk) {
        if (!(await this.exists(char, atk))) {
            throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');
        }

        await query('DELETE FROM character_attacks WHERE char_id = $1 AND id = $2', [char.id, atk.id]);

        return 'Successfully removed Attack from Character in Database';
    }

    static async update(char, atk) {
        if (!(await this.exists(char, atk))) {
            throw new NotFoundError('Attack not found', 'Could not find that Attack for that Character in the Database!');
        }

        const sql =
            'UPDATE character_attacks SET name = $1, description = $2, atk_stat = $3, save = $4, save_stat = $5, on_fail = $6, dmg_dice = $7, dmg_dice_size = $8, dmg = $9, dmg_type_id = $10, magical = $11, magic_bonus = $12 WHERE char_id = $13 AND id = $14';
        await query(sql, [atk.name, atk.description, atk.atk_stat, atk.save, atk.on_fail, atk.dmg_dice, atk.dmg_dice_size, atk.dmg, atk.dmg_type_id, atk.magical, atk.magic_bonus, char.id, atk.id]);

        return 'Successfully updated Character Attack in Database';
    }
}

export { CharacterAttack };
