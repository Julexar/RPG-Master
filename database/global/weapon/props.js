import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

class WeaponProps {
    static async getAll() {
        const results = await query('SELECT * FROM weapon_props');

        if (results.length === 0) {
            throw new NotFoundError('No Weapon Props found', 'Could not find any Weapon Properties in the Database!');
        }

        return results;
    }

    static async getOne(prop) {
        if (prop.id) {
            const results = await query('SELECT * FROM weapon_props WHERE id = $1', [prop.id]);

            if (results.length === 0) {
                throw new NotFoundError('Weapon Props not found', 'Could not find that Weapon Property in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM weapon_props WHERE name = $1', [prop.name]);

        if (results.length === 0) {
            throw new NotFoundError('Weapon Props not found', 'Could not find a Weapon Property with that Name in the Database!');
        }

        return results[0];
    }

    static async exists(prop) {
        if (prop.id) {
            const results = await query('SELECT * FROM weapon_props WHERE id = $1', [prop.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM weapon_props WHERE name = $1', [prop.name]);

        return results.length === 1;
    }

    static async add(prop) {
        if (await this.exists(prop)) {
            throw new DuplicateError('Weapon Props already exists', 'A Weapon Property with that Name already exists in the Database!');
        }

        const sql = 'INSERT INTO weapon_props (name, description) VALUES($1, $2)'
        await query(sql, [prop.name, prop.description]);

        return 'Successfully added Weapon Property to the Database';
    }

    static async remove(prop) {
        if (!await this.exists(prop)) {
            throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');
        }

        const sql = 'DELETE FROM weapon_props WHERE id = $1'
        await query(sql, [prop.id]);

        return 'Successfully removed Weapon Property from the Database';
    }

    static async update(prop) {
        if (!await this.exists(prop)) {
            throw new NotFoundError('Weapon Property not found', 'Could not find that Weapon Property in the Database!');
        }

        const sql = 'UPDATE weapon_props SET name = $1, description = $2 WHERE id = $3'
        await query(sql, [prop.name, prop.description, prop.id]);

        return 'Successfully updated Weapon Property in the Database';
    }
}

export { WeaponProps };