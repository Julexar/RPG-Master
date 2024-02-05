import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

interface DBDmgtype {
    id: bigint;
    name: string;
}

class Damagetype {
    static async getAll() {
        const results = await query('SELECT * FROM damagetypes') as DBDmgtype[];

        if (results.length === 0) throw new NotFoundError('No Damagetypes found', 'Could not find any Damagetypes in the Database!');

        return results;
    }

    static async getOne(dmgtype: { id?: bigint; name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM damagetypes WHERE id = $1', [dmgtype.id]) as DBDmgtype[];

            if (results.length === 0) throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM damagetypes WHERE name = $1', [dmgtype.name]) as DBDmgtype[];

        if (results.length === 0) throw new NotFoundError('Damagetype not found', 'Could not find a Damagetype with that name in the Database!');

        return results[0];
    }

    static async exists(dmgtype: { id?: bigint; name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM damagetypes WHERE id = $1', [dmgtype.id]) as DBDmgtype[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM damagetypes WHERE name = $1', [dmgtype.name]) as DBDmgtype[];

        return results.length === 1;
    }

    static async add(dmgtype: { name: string; description: string }) {
        if (await this.exists(dmgtype)) throw new DuplicateError('Duplicate Damagetype', 'That Damagetype already exists in the Database!');

        await query('INSERT INTO damagetypes (name, description) VALUES($1, $2)', [dmgtype.name, dmgtype.description]);

        return 'Successfully added Damagetype to Database';
    }

    static async remove(dmgtype: { id: bigint }) {
        if (!(await this.exists(dmgtype))) throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');

        await query('DELETE FROM damagetypes WHERE id = $1', [dmgtype.id]);

        return 'Successfully removed Damagetype from Database';
    }

    static async update(dmgtype: DBDmgtype) {
        if (!(await this.exists(dmgtype))) throw new NotFoundError('Damagetype not found', 'Could not find that Damagetype in the Database!');

        const sql = 'UPDATE damagetypes SET name = $1 WHERE id = $2';
        await query(sql, [dmgtype.name, dmgtype.id]);

        return 'Successfully updated Damagetype in Database';
    }
}

export { Damagetype };
