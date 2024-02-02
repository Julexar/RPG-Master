import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface Type {
    id: bigint,
    name: string
};

class ItemType {
    static async getAll() {
        const results = await query('SELECT * FROM item_types', null) as Type[];

        if (results.length === 0) throw new NotFoundError('No Item Types found', 'Could not find any Item Types in the Database!');

        return results;
    }

    static async getOne(type: any) {
        if (type.id) {
            const results = await query('SELECT * FROM item_types WHERE id = $1', [type.id]) as Type[];

            if (results.length === 0) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM item_types WHERE name = $1', [type.name]) as Type[];

        if (results.length === 0) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        return results[0];
    }

    static async exists(type: any) {
        if (type.id) {
            const results = await query('SELECT * FROM item_types WHERE id = $1', [type.id]) as Type[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM item_types WHERE name = $1', [type.name]) as Type[];

        return results.length === 1;
    }

    static async add(type: any) {
        if (await this.exists(type)) throw new DuplicateError('Item Type already exists', 'An Item Type with that name already exists in the Database!');

        const results = await query('INSERT INTO item_types (name) VALUES ($1)', [type.name]) as Type[];

        if (results.length === 0) throw new DuplicateError('Item Type already exists', 'An Item Type with that name already exists in the Database!');

        return 'Successfully added Item Type to the Database';
    }

    static async update(type: any) {
        if (!(await this.exists(type))) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        const results = await query('UPDATE item_types SET name = $1 WHERE id = $2', [type.name, type.id]) as Type[];

        if (results.length === 0) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        return 'Successfully updated Item Type in the Database';
    }

    static async remove(type: any) {
        if (!(await this.exists(type))) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        const results = await query('DELETE FROM item_types WHERE id = $1', [type.id]) as Type[];

        if (results.length === 0) throw new NotFoundError('Item Type not found', 'Could not find that Item Type in the Database!');

        return 'Successfully removed Item Type from the Database';
    }
}

export { ItemType };