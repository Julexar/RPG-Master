import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { WeaponProps } from './props.js';
const query = psql.query;

class weapon {
    constructor() {
        this.props = WeaponProps;
    }

    async getAll() {
        const results = await query('SELECT * FROM weapons');

        if (results.length === 0) {
            throw new NotFoundError('No Weapons found', 'Could not find any Weapons in the Database!');
        }

        return results;
    }

    async getOne(weapon) {
        if (weapon.id) {
            const results = await query('SELECT * FROM weapons WHERE id = $1', [weapon.id]);

            if (results.length === 0) {
                throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM weapons WHERE name = $1', [weapon.name]);

        if (results.length === 0) {
            throw new NotFoundError('Weapon not found', 'Could not find a Weapon with that Name in the Database!');
        }

        return results[0];
    }

    async exists(weapon) {
        if (weapon.id) {
            const results = await query('SELECT * FROM weapons WHERE id = $1', [weapon.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM weapons WHERE name = $1', [weapon.name]);

        return results.length === 1;
    }

    async add(weapon) {
        if (await this.exists(weapon)) {
            throw new DuplicateError('Weapon already exists', 'A Weapon with that Name already exists in the Database!');
        }

        const sql = 'INSERT INTO weapons (name, description, type_id, rarity_id, stats, props) VALUES($1, $2, $3, $4, $5::JSON, ARRAY$6)'
        await query(sql, [weapon.name, weapon.description, weapon.type_id, weapon.rarity_id, weapon.stats, weapon.props]);

        return 'Successfully added Weapon to Database';
    }

    async remove(weapon) {
        if (!await this.exists(weapon)) {
            throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');
        }

        await query('DELETE FROM weapons WHERE id = $1', [weapon.id]);

        return 'Successfully removed Weapon from Database';
    }

    async update(weapon) {
        if (!await this.exists(weapon)) {
            throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');
        }

        const sql = 'UPDATE weapons SET name = $1, description = $2, type_id = $3, rarity_id = $4, stats = $5::JSON, props = ARRAY$6 WHERE id = $7';
        await query(sql, [weapon.name, weapon.description, weapon.type_id, weapon.rarity_id, weapon.stats, weapon.props, weapon.id]);

        return 'Successfully updated Weapon in Database';
    }
}

const Weapon = new weapon();

export { Weapon };