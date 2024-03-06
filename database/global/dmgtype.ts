import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBDmgtype {
    id: number;
    name: string;
}

export class Damagetype {
    static async getAll() {
        const results = await query('SELECT * FROM dmgtype') as DBDmgtype[];

        if (results.length === 0) throw new NotFoundError('No Damage Type found', 'Could not find any Damage Type in the Database!');

        return results;
    }

    static async getOne(dmgtype: { id?: number, name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM dmgtype WHERE id = $1', [dmgtype.id]) as DBDmgtype[];

            if (results.length === 0) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM dmgtype WHERE name = $1', [dmgtype.name]) as DBDmgtype[];

        if (results.length === 0) throw new NotFoundError('Damage Type not found', 'Could not find a Damage Type with that Name in the Database!');

        return results[0];
    }

    static async exists(dmgtype: { id?: number, name?: string }) {
        if (dmgtype.id) {
            const results = await query('SELECT * FROM dmgtype WHERE id = $1', [dmgtype.id]) as DBDmgtype[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM dmgtype WHERE name = $1', [dmgtype.name]) as DBDmgtype[];

        return results.length === 1;
    }

    static async add(dmgtype: { name: string }) {
        if (await this.exists(dmgtype)) throw new DuplicateError('Damage Type already exists', 'A Damage Type with that Name already exists in the Database!');

        const sql = 'INSERT INTO dmgtype (name) VALUES ($1)';
        await query(sql, [dmgtype.name]);

        return 'Successfully added Damage Type to the Database';
    }

    static async remove(dmgtype: { id: number }) {
        if (!await this.exists(dmgtype)) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

        await query('DELETE FROM dmgtype WHERE id = $1', [dmgtype.id]);

        return 'Successfully removed Damage Type from the Database';
    }

    static async update(dmgtype: DBDmgtype) {
        if (!(await this.exists({ id: dmgtype.id }))) throw new NotFoundError('Damage Type not found', 'Could not find that Damage Type in the Database!');

        await query('UPDATE dmgtype SET name = $1 WHERE id = $2', [dmgtype.name, dmgtype.id]);

        return 'Successfully updated Damage Type in the Database';
    }
}