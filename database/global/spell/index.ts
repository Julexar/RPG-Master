import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { SpellSchool } from './school.ts';
const query = psql.query;

interface DBSpell {
    id: bigint,
    name: string,
    description: string,
    level: number,
    school_id: bigint | null,
    classes: bigint[] | null,
    higher_lvl: JSON | null,
    dmgtype_id: bigint | null,
    dmg_stat: string | null,
    save_stat: string | null,
    stats: JSON | null
};

interface AddSpell {
    name: string,
    description: string,
    level: number,
    school_id: bigint | null,
    classes: bigint[] | null,
    higher_lvl: JSON | null,
    dmgtype_id: bigint | null,
    dmg_stat: string | null,
    save_stat: string | null,
    stats: JSON | null
};

class spell {
    school: SpellSchool;
    constructor() {
        this.school = SpellSchool;
    }

    static async getAll() {
        const results = await query('SELECT * FROM spells', null) as DBSpell[];

        if (results.length === 0) throw new NotFoundError('No Spells found', 'Could not find any Spells in the Database!');

        return results;
    }

    static async getOne(spell: any) {
        if (spell.id) {
            const results = await query('SELECT * FROM spells WHERE id = $1', [spell.id]) as DBSpell[];

            if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM spells WHERE name = $1', [spell.name]) as DBSpell[];

        if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        return results[0];
    }

    static async exists(spell: any) {
        if (spell.id) {
            const results = await query('SELECT * FROM spells WHERE id = $1', [spell.id]) as DBSpell[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM spells WHERE name = $1', [spell.name]) as DBSpell[];

        return results.length === 1;
    }

    static async add(spell: AddSpell) {
        if (await this.exists(spell)) throw new DuplicateError('Spell already exists', 'A Spell with that Name already exists in the Database!');

        const sql = 'INSERT INTO spells (name, description, level, school_id, classes, higher_lvl, dmgtype_id, dmg_stat, save_stat, stats) VALUES ($1, $2, $3, $4, ARRAY$5, $6, $7, $8, $9, $10::JSON)';
        await query(sql, [spell.name, spell.description, spell.level, spell.school_id, spell.classes, spell.higher_lvl, spell.dmgtype_id, spell.dmg_stat, spell.save_stat, spell.stats]);

        return 'Successfully added Spell to Database';
    }

    static async remove(spell: any) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        await query('DELETE FROM spells WHERE id = $1', [spell.id]);

        return 'Successfully removed Spell from Database';
    }

    static async update(spell: DBSpell) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        const sql = 'UPDATE spells SET name = $1, description = $2, level = $3, school_id = $4, classes = ARRAY$5, higher_lvl = $6, dmgtype_id = $7, dmg_stat = $8, save_stat = $9, stats = $10::JSON WHERE id = $11';
        await query(sql, [spell.name, spell.description, spell.level, spell.school_id, spell.classes, spell.higher_lvl, spell.dmgtype_id, spell.dmg_stat, spell.save_stat, spell.stats, spell.id]);

        return 'Successfully updated Spell in Database';
    }
}

const Spell = new spell();

export { Spell };