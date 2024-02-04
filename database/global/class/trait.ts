import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Class } from '.';
const query = psql.query;

interface DBClassTrait {
    id: bigint;
    class_id: bigint;
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

interface AddClassTrait {
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

class ClassTrait {
    static async getAll(clas: { id: bigint }) {
        if (!(await Class.exists(clas))) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1', [clas.id]) as DBClassTrait[];

        if (results.length === 0) throw new NotFoundError('No Class Traits found', 'Could not find any Traits for that Class in the Database!');

        return results;
    }

    static async getOne(clas: { id: bigint }, trait: { id?: bigint, name?: string }) {
        if (!(await Class.exists(clas))) throw new NotFoundError('Class not found', 'Could not find that Class in the Database!');

        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]) as DBClassTrait[];

            if (results.length === 0) throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]) as DBClassTrait[];

        if (results.length === 0) throw new NotFoundError('Class Trait not found', 'Could not find a Trait with that name for that Class in the Database!');

        return results[0];
    }

    static async exists(clas: { id: bigint }, trait: { id?: bigint, name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]) as DBClassTrait[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]) as DBClassTrait[];

        return results.length === 1;
    }

    static async add(clas: { id: bigint }, trait: AddClassTrait) {
        if (await this.exists(clas, trait)) throw new DuplicateError('Duplicate Class Trait', 'That Class already has that trait!');

        const sql = 'INSERT INTO class_traits (class_id, name, description, visible, options) VALUES($1, $2, $3, $4, $5::JSON)';
        await query(sql, [clas.id, trait.name, trait.description, trait.visible, trait.options]);

        return 'Successfully added Class Trait to Database';
    }

    static async remove(clas: { id: bigint }, trait: { id: bigint, name?: string }) {
        if (!(await this.exists(clas, trait))) throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');

        await query('DELETE FROM class_traits WHERE class_id = $1 AND id = $2', [clas.id, trait.id]);

        return 'Successfully removed Class Trait from Database';
    }

    static async update(clas: { id: bigint }, trait: DBClassTrait) {
        if (!(await this.exists(clas, trait))) throw new NotFoundError('Class Trait not found', 'Could not find that Trait for that Class in the Database!');

        const sql = 'UPDATE class_traits SET name = $1, description = $2, visible = $3, options = $4::JSON WHERE class_id = $5 AND id = $6';
        await query(sql, [trait.name, trait.description, trait.visible, trait.options, clas.id, trait.id]);

        return 'Successfully updated Class Trait in Database';
    }
}

export { ClassTrait };
