import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

class Armor {
    static async getAll() {
        const results = await query('SELECT * FROM armors');

        if (results.length === 0) {
            throw new NotFoundError('No Armor found', 'Could not find any Armors in the Database!');
        }

        return results;
    }

    static async getOne(armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]);

            if (results.length === 0) {
                throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM armors WHERE name = $1', [armor.name]);

        if (results.length === 0) {
            throw new NotFoundError('Armor not found', 'Could not find an Armor with that name in the Database!');
        }

        return results[0];
    }

    static async exists(armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM armors WHERE name = $1', [armor.name]);

        return results.length === 1;
    }

    static async add(armor) {
        if (await this.exists(armor)) {
            throw new DuplicateError('Duplicate Armor', 'That Armor already exists in the Database!');
        }

        const sql =
            'INSERT INTO armors (name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
        await query(sql, [
            armor.name,
            armor.description,
            armor.type,
            armor.rarity,
            armor.dex_bonus,
            armor.ac,
            armor.str_req,
            armor.magical,
            armor.magic_bonus,
            armor.attune,
            armor.attune_req,
        ]);

        return 'Successfully added Armor to Database';
    }

    static async remove(armor) {
        if (!(await this.exists(armor))) {
            throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
        }

        await query('DELETE FROM armors WHERE id = $1', [armor.id]);

        return 'Successfully removed Armor from Database';
    }

    static async update(armor) {
        if (!(await this.exists(armor))) {
            throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
        }

        const sql =
            'UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE id = $12';
        await query(sql, [
            armor.name,
            armor.description,
            armor.type,
            armor.rarity,
            armor.dex_bonus,
            armor.ac,
            armor.str_req,
            armor.magical,
            armor.magic_bonus,
            armor.attune,
            armor.attune_req,
            armor.id,
        ]);

        return 'Successfully updated Armor in Database';
    }
}

export { Armor };
