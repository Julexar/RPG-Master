import { psql } from "../../psql";
import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { SpellSchool } from './school';
const { query } = psql;

interface DBSpell {
    id: number;
    name: string;
    description: string;
    cast_time: number;
    cast_type: string;
    cast_req: string;
    level: number;
    school_id: number;
    classes: number[];
    higher_lvl: JSON | null;
    dmgtype_id: number | null;
    dmg_stat: string | null;
    save_stat: string | null;
    stats: {
        range: string;
        components: string;
        duration: string;
        concentration: boolean;
        ritual: boolean;
        damage: string;
        save_dc: number;
        on_fail: string;
        on_fail_dmg: number;
    }
}

interface AddSpell {
    name: string;
    description: string;
    cast_time: number;
    cast_type: string;
    cast_req: string;
    level: number;
    school_id: number;
    classes: number[];
    higher_lvl: JSON | null;
    dmgtype_id: number | null;
    dmg_stat: string | null;
    save_stat: string | null;
    stats: {
        range: string;
        components: string;
        duration: string;
        concentration: boolean;
        ritual: boolean;
        damage: string;
        save_dc: number;
        on_fail: string;
        on_fail_dmg: number;
    }
}

class spell {
    schools: typeof SpellSchool;
    constructor() {
        this.schools = SpellSchool;
    }

    async getAll() {
        const results = await query('SELECT * FROM spells') as DBSpell[];

        if (results.length === 0) throw new NotFoundError('No Spells found', 'Could not find any Spells in the Database!');

        return await Promise.all(
            results.map(async (dbSpell) => {
                const school = await this.schools.getOne({ id: dbSpell.school_id });
                return {
                    id: dbSpell.id,
                    name: dbSpell.name,
                    description: dbSpell.description,
                    cast_time: dbSpell.cast_time,
                    cast_type: dbSpell.cast_type,
                    cast_req: dbSpell.cast_req,
                    level: dbSpell.level,
                    school: school,
                    classes: dbSpell.classes,
                    higher_lvl: dbSpell.higher_lvl,
                    dmgtype_id: dbSpell.dmgtype_id,
                    dmg_stat: dbSpell.dmg_stat,
                    save_stat: dbSpell.save_stat,
                    stats: dbSpell.stats
                }
            })
        )
    }

    async getOne(spell: { id?: number, name?: string }) {
        if (spell.id) {
            const results = await query('SELECT * FROM spells WHERE id = $1', [spell.id]) as DBSpell[];

            if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

            const dbSpell = results[0];
            const school = await this.schools.getOne({ id: dbSpell.school_id });

            return {
                id: dbSpell.id,
                name: dbSpell.name,
                description: dbSpell.description,
                cast_time: dbSpell.cast_time,
                cast_type: dbSpell.cast_type,
                cast_req: dbSpell.cast_req,
                level: dbSpell.level,
                school: school,
                classes: dbSpell.classes,
                higher_lvl: dbSpell.higher_lvl,
                dmgtype_id: dbSpell.dmgtype_id,
                dmg_stat: dbSpell.dmg_stat,
                save_stat: dbSpell.save_stat,
                stats: dbSpell.stats
            }
        }

        const results = await query('SELECT * FROM spells WHERE name = $1', [spell.name]) as DBSpell[];

        if (results.length === 0) throw new NotFoundError('Spell not found', 'Could not find a Spell with that Name in the Database!');

        const dbSpell = results[0];
        const school = await this.schools.getOne({ id: dbSpell.school_id });

        return {
            id: dbSpell.id,
            name: dbSpell.name,
            description: dbSpell.description,
            cast_time: dbSpell.cast_time,
            cast_type: dbSpell.cast_type,
            cast_req: dbSpell.cast_req,
            level: dbSpell.level,
            school: school,
            classes: dbSpell.classes,
            higher_lvl: dbSpell.higher_lvl,
            dmgtype_id: dbSpell.dmgtype_id,
            dmg_stat: dbSpell.dmg_stat,
            save_stat: dbSpell.save_stat,
            stats: dbSpell.stats
        }
    }

    async exists(spell: { id?: number, name?: string }) {
        if (spell.id) {
            const result = await db.spells.findUnique({ where: { id: spell.id } });

            return !!result;
        }

        const result = await db.spells.findFirst({ where: { name: spell.name } });

        return !!result;
    }

    async add(spell: AddSpell) {
        if (await this.exists(spell)) throw new DuplicateError('Duplicate Spell', 'That Spell already exists in the Database!');

        const sql = 'INSERT INTO spells (name, description, cast_time, cast_type, cast_req, level, school_id, classes, higher_lvl, dmgtype_id, dmg_stat, save_stat, stats) VALUES ($1, $2, $3, $4, $5, $6, $7, ARRAY$8, $9::JSON, $10, $11, $12, $13)';
        await query(sql, [spell.name, spell.description, spell.cast_time, spell.cast_type, spell.cast_req, spell.level, spell.school_id, spell.classes.toString(), JSON.stringify(spell.higher_lvl), spell.dmgtype_id, spell.dmg_stat, spell.save_stat, spell.stats]);

        return 'Successfully added Spell to Database';
    }

    async remove(spell: { id: number }) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        await db.spells.delete({ where: { id: spell.id } });

        return 'Successfully removed Spell from Database';
    }

    async update(spell: DBSpell) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        const sql = 'UPDATE spells SET name = $1, description = $2, cast_time = $3, cast_type = $4, cast_req = $5, level = $6, school_id = $7, classes = ARRAY$8, higher_lvl = $9::JSON, dmgtype_id = $10, dmg_stat = $11, save_stat = $12, stats = $13 WHERE id = $14';
        await query(sql, [spell.name, spell.description, spell.cast_time, spell.cast_type, spell.cast_req, spell.level, spell.school_id, spell.classes.toString(), JSON.stringify(spell.higher_lvl), spell.dmgtype_id, spell.dmg_stat, spell.save_stat, spell.stats, spell.id]);

        return 'Successfully updated Spell in Database';
    }
}

export const Spell = new spell();