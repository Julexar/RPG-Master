import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface Property {
    id: bigint,
    name: string,
    description: string
};

class WeaponProperty {
    static async getAll() {
        const results = await query('SELECT * FROM weapon_properties', null) as Property[];

        if (results.length === 0) throw new NotFoundError('No Weapon Properties found', 'Could not find any Weapon Properties in the Database!');

        return results;
    }

    static async getOne(property: any) {
        if (property.id) {
            const results = await query('SELECT * FROM weapon_properties WHERE id = $1', [property.id]) as Property[];

            if (results.length === 0) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM weapon_properties WHERE name = $1', [property.name]) as Property[];

        if (results.length === 0) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        return results[0];
    }

    static async exists(property: any) {
        if (property.id) {
            const results = await query('SELECT * FROM weapon_properties WHERE id = $1', [property.id]) as Property[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM weapon_properties WHERE name = $1', [property.name]) as Property[];

        return results.length === 1;
    }

    static async add(property: any) {
        if (await this.exists(property)) throw new DuplicateError('Weapon Property already exists', 'A Weapon Property with that name already exists in the Database!');

        const results = await query('INSERT INTO weapon_properties (name, description) VALUES ($1, $2)', [property.name, property.description]) as Property[];

        if (results.length === 0) throw new DuplicateError('Weapon Property already exists', 'A Weapon Property with that name already exists in the Database!');

        return 'Successfully added Weapon Property to the Database';
    }

    static async update(property: any) {
        if (!(await this.exists(property))) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        const results = await query('UPDATE weapon_properties SET name = $1, description = $2 WHERE id = $3', [property.name, property.description, property.id]) as Property[];

        if (results.length === 0) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        return 'Successfully updated Weapon Property in the Database';
    }

    static async remove(property: any) {
        if (!(await this.exists(property))) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        const results = await query('DELETE FROM weapon_properties WHERE id = $1', [property.id]) as Property[];

        if (results.length === 0) throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');

        return 'Successfully removed Weapon Property from the Database';
    }
}

export { WeaponProperty };