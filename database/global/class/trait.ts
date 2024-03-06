import { psql } from "../../psql";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
const { query } = psql;

interface DBClassTrait {
    id: number;
    class_id: number;
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

export class ClassTrait {
    static async getAll(clas: { id: number }) {
        const results = await query('SELECT * FROM class_traits WHERE class_id = $1', [clas.id]) as DBClassTrait[];

        if (results.length === 0) throw new NotFoundError('No Class Traits found', 'Could not find any Class Traits in the Database!');

        return results;
    }

    static async getOne(clas: { id: number }, trait: { id?: number, name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE id = $1', [trait.id]) as DBClassTrait[];

            if (results.length === 0) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]) as DBClassTrait[];

        if (results.length === 0) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        return results[0];
    }

    static async exists(clas: { id: number }, trait: { id?: number, name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM class_traits WHERE id = $1', [trait.id]) as DBClassTrait[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_traits WHERE class_id = $1 AND name = $2', [clas.id, trait.name]) as DBClassTrait[];

        return results.length === 1;
    }

    static async add(clas: { id: number }, trait: AddClassTrait) {
        if (await this.exists(clas, { name: trait.name })) throw new DuplicateError('Class Trait already exists', 'A Class Trait with that name already exists in the Database!');

        const sql = 'INSERT INTO class_traits (class_id, name, description, visible, options) VALUES ($1, $2, $3, $4, $5)';
        await query(sql, [clas.id, trait.name, trait.description, trait.visible, trait.options]) as { id: number }[];

        return 'Successfully added Class Trait to the Database';
    }

    static async remove(clas: { id: number }, trait: { id: number }) {
        if (!await this.exists(clas, trait)) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        await query('DELETE FROM class_traits WHERE id = $1', [trait.id]);

        return 'Successfully removed Class Trait from the Database';
    }

    static async update(clas: { id: number }, trait: DBClassTrait) {
        if (!await this.exists(clas, { id: trait.id })) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        const sql = 'UPDATE class_traits SET name = $1, description = $2, visible = $3, options = $4 WHERE id = $5';
        await query(sql, [trait.name, trait.description, trait.visible, trait.options, trait.id]);

        return 'Successfully updated Class Trait in the Database';
    }
}