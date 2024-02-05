import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface DBSubraceTrait {
    id: bigint;
    sub_id: bigint;
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

interface AddSubraceTrait {
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

class SubraceTrait {
    static async getAll(sub: { id: bigint }) {
        const results = await query('SELECT * FROM subrace_traits WHERE sub_id = $1', [sub.id]) as DBSubraceTrait[];

        if (results.length === 0) throw new NotFoundError('No Subrace Traits found', 'Could not find any Traits for that Subrace in the Database!');

        return results.map((subTrait) => {
            return {
                id: subTrait.id,
                sub_id: sub.id,
                name: subTrait.name,
                description: subTrait.description,
                visible: subTrait.visible,
                options: JSON.parse(JSON.stringify(subTrait.options))
            };
        });
    }

    static async getOne(sub: { id: bigint }, trait: { id?: bigint; name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM subrace_traits WHERE sub_id = $1 AND id = $2', [sub.id, trait.id]) as DBSubraceTrait[];

            if (results.length === 0) throw new NotFoundError('Subrace Trait not found', 'Could not find that Trait for that Subrace in the Database!');

            return results.map((subTrait) => {
                return {
                    id: subTrait.id,
                    sub_id: sub.id,
                    name: subTrait.name,
                    description: subTrait.description,
                    visible: subTrait.visible,
                    options: JSON.parse(JSON.stringify(subTrait.options))
                };
            })[0];
        }

        const results = await query('SELECT * FROM subrace_traits WHERE sub_id = $1 AND name = $2', [sub.id, trait.name]) as DBSubraceTrait[];

        if (results.length === 0) throw new NotFoundError('Subrace Trait not found', 'Could not find a Trait with that name for that Subrace in the Database!');

        return results.map((subTrait) => {
            return {
                id: subTrait.id,
                sub_id: sub.id,
                name: subTrait.name,
                description: subTrait.description,
                visible: subTrait.visible,
                options: JSON.parse(JSON.stringify(subTrait.options))
            };
        })[0];
    }

    static async exists(sub: { id: bigint }, trait: { id?: bigint; name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM subrace_traits WHERE sub_id = $1 AND id = $2', [sub.id, trait.id]) as DBSubraceTrait[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM subrace_traits WHERE sub_id = $1 AND name = $2', [sub.id, trait.name]) as DBSubraceTrait[];

        return results.length === 1;
    }

    static async add(sub: { id: bigint }, trait: AddSubraceTrait) {
        if (await this.exists(sub, trait)) throw new DuplicateError('Duplicate Subrace Trait', 'That Trait is already linked to that Subrace in the Database!');

        const sql = 'INSERT INTO subrace_traits (sub_id, name, description, visible, options) VALUES($1, $2, $3, $4, $5::JSON)';
        await query(sql, [sub.id, trait.name, trait.description, trait.visible, JSON.stringify(trait.options)]);

        return 'Successfully added Subrace Trait to Database';
    }

    static async remove(sub: { id: bigint }, trait: { id: bigint }) {
        if (!(await this.exists(sub, trait))) throw new NotFoundError('Subrace Trait not found', 'Could not find that Trait for that Subrace in the Database!');

        await query('DELETE FROM subrace_traits WHERE sub_id = $1 AND id = $2', [sub.id, trait.id]);

        return 'Successfully removed Subrace Trait from Database';
    }

    static async update(sub: { id: bigint }, trait: DBSubraceTrait) {
        if (!(await this.exists(sub, trait))) throw new NotFoundError('Subrace Trait not found', 'Could not find that Trait for that Subrace in the Database!');

        const sql = 'UPDATE subrace_traits SET name = $1, description = $2, visible = $3, options = $4::JSON WHERE sub_id = $5 AND id = $6';
        await query(sql, [trait.name, trait.description, trait.visible, JSON.stringify(trait.options), sub.id, trait.id]);

        return 'Successfully updated Subrace Trait in Database';
    }
}

export { SubraceTrait };
