import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

class ItemRarity {
    static async getAll() {
        const results = await query('SELECT * FROM item_rarity');

        if (results.length === 0) {
            throw new NotFoundError('No Item Rarity found', 'Could not find any Item Rarity in the Database!');
        }

        return results;
    }

    static async getOne(rarity) {
        if (rarity.id) {
            const results = await query('SELECT * FROM item_rarity WHERE id = $1', [rarity.id]);

            if (results.length === 0) {
                throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM item_rarity WHERE name = $1', [rarity.name]);

        if (results.length === 0) {
            throw new NotFoundError('Item Rarity not found', 'Could not find a Item Rarity with that Name in the Database!');
        }

        return results[0];
    }

    static async exists(rarity) {
        if (rarity.id) {
            const results = await query('SELECT * FROM item_rarity WHERE id = $1', [rarity.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM item_rarity WHERE name = $1', [rarity.name]);

        return results.length === 1;
    }

    static async add(rarity) {
        if (await this.exists(rarity)) {
            throw new DuplicateError('Item Rarity already exists', 'A Item Rarity with that Name already exists in the Database!');
        }

        await query('INSERT INTO item_rarity (name) VALUES($1)', [rarity.name]);

        return 'Successfully added Item Rarity to the Database';
    }

    static async remove(rarity) {
        if (!await this.exists(rarity)) {
            throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');
        }

        await query('DELETE FROM item_rarity WHERE id = $1', [rarity.id]);

        return 'Successfully removed Item Rarity from the Database';
    }

    static async update(rarity) {
        if (!await this.exists(rarity)) {
            throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');
        }

        await query('UPDATE item_rarity SET name = $1 WHERE id = $2', [rarity.name, rarity.id]);

        return 'Successfully updated Item Rarity in the Database';
    }
}

export { ItemRarity };