import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Class } from '.';
const query = psql.query;

class ClassTrait {
    static async getAll(clas) {
        if (!(await Class.exists(clas))) {
            throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1', [clas.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Class Traits found', 'Could not find any Traits for that Class in the Database!');
        }

        return results;
    }

    static async getOne(clas, trait) {
        if (!(await Class.exists(clas))) {
            throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');
        }

        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]);

            if (results.length === 0) {
                throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]);

        if (results.length === 0) {
            throw new NotFoundError('Class Trait not found', 'Could not find a Trait with that name for that Class in the Database!');
        }

        return results[0];
    }

    static async exists(clas, trait) {
        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]);

        return results.length === 1;
    }

    static async add(clas, trait) {
        if (await this.exists(clas, trait)) {
            throw new DuplicateError('Duplicate Class Trait', 'That Class already has that trait!');
        }

        const sql =
            'INSERT INTO class_traits (class_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [
            clas.id,
            trait.level,
            trait.name,
            trait.description,
            trait.type,
            trait.visible,
            trait.val,
            trait.replace,
            trait.abil_replace,
            trait.dmg_dice,
            trait.dmg_dice_size,
            trait.dmg_stat,
        ]);

        return 'Successfully added Class Trait to Database';
    }

    static async remove(clas, trait) {
        if (!(await this.exists(clas, trait))) {
            throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');
        }

        await query('DELETE FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]);

        return 'Successfully removed Class Trait from Database';
    }

    static async update(clas, trait) {
        if (!(await this.exists(clas, trait))) {
            throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');
        }

        const sql =
            'UPDATE class_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE class_id = $12 AND id = $13';
        await query(sql, [
            trait.level,
            trait.name,
            trait.description,
            trait.type,
            trait.visible,
            trait.val,
            trait.replace,
            trait.abil_replace,
            trait.dmg_dice,
            trait.dmg_dice_size,
            trait.dmg_stat,
            clas.id,
            trait.id,
        ]);

        return 'Successfully updated Class Trait in Database';
    }
}

export { ClassTrait };
