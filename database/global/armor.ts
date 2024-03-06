import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError } from '../../custom/errors';
const { query } = psql;

interface DBArmor {
    id: number;
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
}

interface AddArmor {
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
}

export class Armor {
    static async getAll() {
        const results = await query('SELECT * FROM armors') as DBArmor[];

        if (results.length === 0) throw new NotFoundError('No Armor found', 'Could not find any Armor in the Database!');

        return results;
    }

    static async getOne(armor: { id?: number, name?: string, source?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]) as DBArmor[];

            if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM armors WHERE name = $1 AND source = $2', [armor.name, armor.source]) as DBArmor[];

        if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find an Armor with that Name in the Database!');

        return results[0];
    }

    static async exists(armor: { id?: number, name?: string, source?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE id = $1', [armor.id]) as DBArmor[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM armors WHERE name = $1 AND source = $2', [armor.name, armor.source]) as DBArmor[];

        return results.length === 1;
    }

    static async add(armor: AddArmor) {
        if (await this.exists(armor)) throw new DuplicateError('Armor already exists', 'An Armor with that Name and Source already exists in the Database!');

        const sql = 'INSERT INTO armors (name, description, source, type_id, rarity_id, stats) VALUES ($1, $2, $3, $4, $5, $6)'
        await query(sql, [armor.name, armor.description, armor.source, armor.type_id, armor.rarity_id, armor.stats]);

        return 'Successfully added Armor to the Database';
    }

    static async remove(armor: { id: number }) {
        if (!await this.exists(armor)) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        await query('DELETE FROM armors WHERE id = $1', [armor.id]);

        return 'Successfully removed Armor from the Database'
    }

    static async update(armor: DBArmor) {
        if (!await this.exists(armor)) throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');

        const sql = 'UPDATE armors SET name = $1, description = $2, source = $3, type_id = $4, rarity_id = $5, stats = $6 WHERE id = $7';
        await query(sql, [armor.name, armor.description, armor.source, armor.type_id, armor.rarity_id, armor.stats, armor.id]);

        return 'Successfully updated Armor in the Database';
    }
}