import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class Damagetype {
    static async getAll() {
        const results = await query('SELECT * FROM damagetypes');

        if (results.length === 0) {
            throw new NotFoundError('No Damagetypes found', 'Could not find any Damagetypes in the Database!');
        }

        return results;
    }

    static async getOne(dmgtype) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM damagetypes WHERE id = $1', [dmgtype.id]);

            if (results.length === 0) {
                throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM damagetypes WHERE name = $1', [dmgtype.name]);

        if (results.length === 0) {
            throw new NotFoundError('Damagetype not found', 'Could not find a Damagetype with that name in the Database!');
        }

        return results[0];
    }

    static async exists(dmgtype) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM damagetypes WHERE id = $1', [dmgtype.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM damagetypes WHERE name = $1', [dmgtype.name]);

        return results.length === 1;
    }

    static async add(dmgtype) {
        if (await this.exists(dmgtype)) {
            throw new DuplicateError('Duplicate Damagetype', 'That Damagetype already exists in the Database!');
        }

        await query('INSERT INTO damagetypes (name, description) VALUES($1, $2)', [dmgtype.name, dmgtype.description]);

        return 'Successfully added Damagetype to Database';
    }

    static async remove(dmgtype) {
        if (!(await this.exists(dmgtype))) {
            throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');
        }

        await query('DELETE FROM damagetypes WHERE id = $1', [dmgtype.id]);

        return 'Successfully removed Damagetype from Database';
    }

    static async update(dmgtype) {
        if (!(await this.exists(dmgtype))) {
            throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');
        }

        const sql = 'UPDATE damagetypes SET name = $1, description = $2 WHERE id = $3';
        await query(sql, [dmgtype.name, dmgtype.description, dmgtype.id]);

        return 'Successfully updated Damagetype in Database';
    }
}

export { Damagetype };
