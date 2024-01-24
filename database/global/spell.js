import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class Spell {
    static async getAll() {
        const results = await query('SELECT * FROM spells');

        if (results.length === 0) {
            throw new NotFoundError('No Spells found', 'Could not find any Spells in the Database!');
        }

        return results;
    }

    static async getOne(spell) {
        if (spell.id) {
            const results = await query('SELECT * FROM spells WHERE id = $1', [spell.id]);

            if (results.length === 0) {
                throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM spells WHERE name = $1', [spell.name]);

        if (results.length === 0) {
            throw new NotFoundError('Spell not found', 'Could not find a Spell with that Name in the Database!');
        }

        return results[0];
    }

    static async exists(spell) {
        if (spell.id) {
            const results = await query('SELECT * FROM spells WHERE id = $1', [spell.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM spells WHERE name = $1', [spell.name]);

        return results.length === 1;
    }

    static async add(spell) {
        if (await this.exists(spell)) {
            throw new DuplicateError('Duplicate Spell', 'This Spell already exists in the Database!');
        }

        const sql = 'INSERT INTO spells (name, description, level, school, casting_time_id, castin_time_amount, range, components, duration, stats, higher_lvl, class_restrict) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::JSON, $11::JSON, ARRAY$12)';
        await query(sql, [spell.name, spell.description, spell.level, spell.school, spell.casting_time_id, spell.casting_time_amount, spell.range, spell.components, spell.duration, spell.stats, spell.higher_lvl, spell.class_restrict]);

        return 'Successfully added Spell to Database';
    }

    static async remove(spell) {
        if (!(await this.exists(spell))) {
            throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');
        }

        await query('DELETE FROM spells WHERE id = $1', [spell.id]);

        return 'Successfully removed Spell from Database';
    }

    static async update(spell) {
        if (!(await this.exists(spell))) {
            throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');
        }

        const sql = 'UPDATE spells SET name = $1, description = $2, level = $3, school = $4, casting_time_id = $5, casting_time_amount = $6, range = $7, components = $8, duration = $9, stats = $10::JSON, higher_lvl = $11::JSON, class_restrict = ARRAY$12 WHERE id = $13';
        await query(sql, [spell.name, spell.description, spell.level, spell.school, spell.casting_time_id, spell.casting_time_amount, spell.range, spell.components, spell.duration, spell.stats, spell.higher_lvl, spell.class_restrict, spell.id]);

        return 'Successfully updated Spell in Database';
    }
}

export { Spell };