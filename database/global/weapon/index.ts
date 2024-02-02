import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { WeaponProperty } from './props.ts';
const query = psql.query;

interface DBWeapon {
    id: bigint,
    name: string,
    description: string,
    type_id: bigint,
    rarity_id: bigint,
    stats: JSON | null,
    props: bigint[] | null
};

interface AddWeapon {
    name: string,
    description: string,
    type_id: bigint,
    rarity_id: bigint,
    stats: JSON | null,
    props: bigint[] | null
};

class weapon {
    props: WeaponProperty;
    constructor() {
        this.props = WeaponProperty;
    }

    async getAll() {
        const results = await query('SELECT * FROM weapons', null) as DBWeapon[];

        if (results.length === 0) throw new NotFoundError('No Weapons found', 'Could not find any Weapons in the Database!');

        return results;
    }

    async getOne(weapon: any) {
        if (weapon.id) {
            const results = await query('SELECT * FROM weapons WHERE id = $1', [weapon.id]) as DBWeapon[];

            if (results.length === 0) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM weapons WHERE name = $1', [weapon.name]) as DBWeapon[];

        if (results.length === 0) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        return results[0];
    }

    async exists(weapon: any) {
        if (weapon.id) {
            const results = await query('SELECT * FROM weapons WHERE id = $1', [weapon.id]) as DBWeapon[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM weapons WHERE name = $1', [weapon.name]) as DBWeapon[];

        return results.length === 1;
    }

    async add(weapon: AddWeapon) {
        if (await this.exists(weapon)) throw new DuplicateError('Weapon already exists', 'A Weapon with that name already exists in the Database!');

        if (weapon.props !== null) {
            const sql = 'INSERT INTO weapons (name, description, type_id, rarity_id, stats, props) VALUES ($1, $2, $3, $4, $5::JSON, ARRAY$6)';
            const results = await query(sql, [weapon.name, weapon.description, weapon.type_id, weapon.rarity_id, JSON.stringify(weapon.stats), weapon.props.toString()]) as DBWeapon[];

            if (results.length === 0) throw new DuplicateError('Weapon already exists', 'A Weapon with that name already exists in the Database!');

            return 'Successfully added Weapon to the Database';
        }

        const sql = 'INSERT INTO weapons (name, description, type_id, rarity_id, stats, props) VALUES ($1, $2, $3, $4, $5::JSON, $6)';
        const results = await query(sql, [weapon.name, weapon.description, weapon.type_id, weapon.rarity_id, JSON.stringify(weapon.stats), weapon.props]) as DBWeapon[];

        if (results.length === 0) throw new DuplicateError('Weapon already exists', 'A Weapon with that name already exists in the Database!');

        return 'Successfully added Weapon to the Database';
    }

    async update(weapon: any) {
        if (!(await this.exists(weapon))) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        const results = await query('UPDATE weapons SET name = $1, description = $2, type_id = $3, rarity_id = $4, stats = $5::JSON, props = $6 WHERE id = $7', [weapon.name, weapon.description, weapon.type_id, weapon.rarity_id, JSON.stringify(weapon.stats), weapon.props, weapon.id]) as DBWeapon[];

        if (results.length === 0) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        return 'Successfully updated Weapon in the Database';
    }

    async remove(weapon: any) {
        if (!(await this.exists(weapon))) throw new NotFoundError('Weapon not found', 'Could not find that Weapon in the Database!');

        await query('DELETE FROM weapons WHERE id = $1', [weapon.id]);

        return 'Successfully removed Weapon from the Database';
    }
}

const Weapon = new weapon();

export { Weapon };