import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

class RaceTrait {
    static async getAll(race) {
        const results = await query('SELECT * FROM race_traits WHERE race_id = $1', [race.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Race Traits found', 'Could not find any Traits for that Race in the Database!');
        }

        return results;
    }

    static async getOne(race, trait) {
        if (trait.id) {
            const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, trait.id]);

            if (results.length === 0) {
                throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND name = $2', [race.id, trait.name]);

        if (results.length === 0) {
            throw new NotFoundError('Race Trait not found', 'Could not find a Trait with that name for that Race in the Database!');
        }

        return results[0];
    }

    static async exists(race, trait) {
        if (trait.id) {
            const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, sense.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND name = $2', [race.id, sense.name]);

        return results.length === 1;
    }

    static async add(race, trait) {
        if (await this.exists(race, trait)) {
            throw new DuplicateError('Duplicate Race Trait', 'That Trait is already linked to that Race in the Database!');
        }

        const sql = 'INSERT INTO race_traits (race_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [race.id, trait.level, trait.name, trait.description, trait.type, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat]);

        return 'Successfully added Race Trait to Database';
    }

    static async remove(race, trait) {
        if (!(await this.exists(race, trait))) {
            throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');
        }

        await query('DELETE FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, trait.id]);

        return 'Successfully removed Race Trait from Database';
    }

    static async update(race, trait) {
        if (!(await this.exists(race, trait))) {
            throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');
        }

        const sql = 'UPDATE race_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE race_id = $12 AND id = $13';
        await query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, race.id, trait.id]);

        return 'Successfully updated Race Trait in Database';
    }
}

export { RaceTrait };
