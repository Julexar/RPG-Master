import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface DBArmor {
    id: bigint,
    name: string,
    description: string,
    type_id: bigint,
    rarity_id: bigint,
    stats: JSON
};

interface AddArmor {
    name: string,
    description: string,
    type_id: bigint,
    rarity_id: bigint,
    stats: JSON
};

class Armor {
    static async getAll() {
        const results = await query('SELECT * FROM armors') as DBArmor[];

        if (results.length === 0) throw new NotFoundError('No Armor found', 'Could not find any Armors in the Database!');

        return results;
    }

    static async getOne(armor: { id?: bigint, name?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]) as DBArmor[];

            if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM armors WHERE name = $1', [armor.name]) as DBArmor[];

        if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find an Armor with that name in the Database!');

        return results[0];
    }

    static async exists(armor: { id?: bigint, name?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]) as DBArmor[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM armors WHERE name = $1', [armor.name]) as DBArmor[];

        return results.length === 1;
    }

    static async add(armor: AddArmor) {
        if (await this.exists(armor)) throw new DuplicateError('Duplicate Armor', 'That Armor already exists in the Database!');

        const sql = 'INSERT INTO armors (name, description, type_id, rarity_id, stats) VALUES ($1, $2, $3, $4, $5::JSON)';
        await query(sql, [armor.name, armor.description, armor.type_id, armor.rarity_id, armor.stats]);

        return 'Successfully added Armor to Database';
    }

    static async remove(armor: { id: bigint }) {
        if (!(await this.exists(armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        await query('DELETE FROM armors WHERE id = $1', [armor.id]);

        return 'Successfully removed Armor from Database';
    }

    static async update(armor: DBArmor) {
        if (!(await this.exists(armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        const sql = 'UPDATE armors SET name = $1, description = $2, type_id = $3, rarity_id = $4, stats = $5::JSON WHERE id = $6';
        await query(sql, [armor.name, armor.description, armor.type_id, armor.rarity_id, armor.stats, armor.id]);

        return 'Successfully updated Armor in Database';
    }
}

export { Armor };