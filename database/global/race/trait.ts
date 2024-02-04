import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
const query = psql.query;

interface DBRaceTrait {
    id: bigint;
    name: string;
    description: string;
    visible: boolean;
    options: JSON | null;
}

interface AddRaceTrait {
    name: string;
    description: string;
    visible: boolean;
    options: JSON | null;
}

class RaceTrait {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_traits WHERE race_id = $1', [race.id]) as DBRaceTrait[];

        if (results.length === 0) throw new NotFoundError('No Race Traits found', 'Could not find any Traits for that Race in the Database!');

        return results;
    }

    static async getOne(race: { id: bigint }, trait: { id?: bigint; name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, trait.id]) as DBRaceTrait[];

            if (results.length === 0) throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND name = $2', [race.id, trait.name]) as DBRaceTrait[];

        if (results.length === 0) throw new NotFoundError('Race Trait not found', 'Could not find a Trait with that name for that Race in the Database!');

        return results[0];
    }

    static async exists(race: { id: bigint }, trait: { id?: bigint; name?: string }) {
        if (trait.id) {
            const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, trait.id]) as DBRaceTrait[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM race_traits WHERE race_id = $1 AND name = $2', [race.id, trait.name]) as DBRaceTrait[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, trait: AddRaceTrait) {
        if (await this.exists(race, trait)) throw new DuplicateError('Duplicate Race Trait', 'That Trait is already linked to that Race in the Database!');

        const sql = 'INSERT INTO race_traits (race_id, name, description, visible, options) VALUES($1, $2, $3, $4, $5::JSON)';
        await query(sql, [race.id, trait.name, trait.description, trait.visible, trait.options]);

        return 'Successfully added Race Trait to Database';
    }

    static async remove(race: { id: bigint }, trait: { id: bigint, name?: string }) {
        if (!(await this.exists(race, trait))) throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');

        await query('DELETE FROM race_traits WHERE race_id = $1 AND id = $2', [race.id, trait.id]);

        return 'Successfully removed Race Trait from Database';
    }

    static async update(race: { id: bigint }, trait: DBRaceTrait) {
        if (!(await this.exists(race, trait))) throw new NotFoundError('Race Trait not found', 'Could not find that Trait for that Race in the Database!');

        const sql = 'UPDATE race_traits SET name = $1, description = $2, visible = $3, options = $4::JSON WHERE race_id = $5 AND id = $6';
        await query(sql, [trait.name, trait.description, trait.visible, trait.options, race.id, trait.id]);

        return 'Successfully updated Race Trait in Database';
    }
}

export { RaceTrait };
