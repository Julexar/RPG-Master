import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface Rarity {
    id: bigint,
    name: string
};

class ItemRarity {
    static async getAll() {
        const results = await query('SELECT * FROM item_rarities', null) as Rarity[];

        if (results.length === 0) throw new NotFoundError('No Item Rarities found', 'Could not find any Item Rarities in the Database!');

        return results;
    }

    static async getOne(rarity: any) {
        if (rarity.id) {
            const results = await query('SELECT * FROM item_rarities WHERE id = $1', [rarity.id]) as Rarity[];

            if (results.length === 0) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM item_rarities WHERE name = $1', [rarity.name]) as Rarity[];

        if (results.length === 0) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        return results[0];
    }

    static async exists(rarity: any) {
        if (rarity.id) {
            const results = await query('SELECT * FROM item_rarities WHERE id = $1', [rarity.id]) as Rarity[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM item_rarities WHERE name = $1', [rarity.name]) as Rarity[];

        return results.length === 1;
    }

    static async add(rarity: any) {
        if (await this.exists(rarity)) throw new DuplicateError('Item Rarity already exists', 'An Item Rarity with that name already exists in the Database!');

        const results = await query('INSERT INTO item_rarities (name) VALUES ($1)', [rarity.name]) as Rarity[];

        if (results.length === 0) throw new DuplicateError('Item Rarity already exists', 'An Item Rarity with that name already exists in the Database!');

        return 'Successfully added Item Rarity to Database';
    }

    static async update(rarity: any) {
        if (!(await this.exists(rarity))) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        const results = await query('UPDATE item_rarities SET name = $1 WHERE id = $2', [rarity.name, rarity.id]) as Rarity[];

        if (results.length === 0) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        return 'Successfully updated Item Rarity in Database';
    }

    static async remove(rarity: any) {
        if (!(await this.exists(rarity))) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        const results = await query('DELETE FROM item_rarities WHERE id = $1', [rarity.id]) as Rarity[];

        if (results.length === 0) throw new NotFoundError('Item Rarity not found', 'Could not find that Item Rarity in the Database!');

        return 'Successfully removed Item Rarity from Database';
    }
}

export { ItemRarity };