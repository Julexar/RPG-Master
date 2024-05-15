import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { SpellSchool } from './school';

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
    stats: JSON;
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
    stats: JSON;
}

export class Spell {
    static readonly schools: typeof SpellSchool = SpellSchool;

    static async getAll() {
        const results = await db.spells.findMany();

        if (results.length === 0) throw new NotFoundError('No Spells found', 'Could not find any Spells in the Database!');

        return await Promise.all(
            results.map(async (dbSpell) => {
                const school = await this.schools.getOne({ id: dbSpell.school_id as number });
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
                    stats: JSON.parse(JSON.stringify(dbSpell.stats))
                }
            })
        )
    }

    static async getOne(spell: { id?: number, name?: string }) {
        if (spell.id) {
            const result = await db.spells.findUnique({ where: { id: spell.id } });

            if (!result) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

            const school = await this.schools.getOne({ id: result.school_id as number });

            return {
                id: result.id,
                name: result.name,
                description: result.description,
                cast_time: result.cast_time,
                cast_type: result.cast_type,
                cast_req: result.cast_req,
                level: result.level,
                school: school,
                classes: result.classes,
                higher_lvl: result.higher_lvl,
                dmgtype_id: result.dmgtype_id,
                dmg_stat: result.dmg_stat,
                save_stat: result.save_stat,
                stats: result.stats
            }
        }

        const result = await db.spells.findFirst({ where: { name: spell.name } });

        if (!result) throw new NotFoundError('Spell not found', 'Could not find a Spell with that Name in the Database!');

        const school = await this.schools.getOne({ id: result.school_id as number });

        return {
            id: result.id,
            name: result.name,
            description: result.description,
            cast_time: result.cast_time,
            cast_type: result.cast_type,
            cast_req: result.cast_req,
            level: result.level,
            school: school,
            classes: result.classes,
            higher_lvl: result.higher_lvl,
            dmgtype_id: result.dmgtype_id,
            dmg_stat: result.dmg_stat,
            save_stat: result.save_stat,
            stats: result.stats
        }
    }

    static async exists(spell: { id?: number, name?: string }) {
        if (spell.id) {
            const result = await db.spells.findUnique({ where: { id: spell.id } });

            return !!result;
        }

        const result = await db.spells.findFirst({ where: { name: spell.name } });

        return !!result;
    }

    static async add(spell: AddSpell) {
        if (await this.exists(spell)) throw new DuplicateError('Duplicate Spell', 'That Spell already exists in the Database!');

        await db.spells.create({ data: { name: spell.name, description: spell.description, cast_time: spell.cast_time, cast_type: spell.cast_type, cast_req: spell.cast_req, level: spell.level, school_id: spell.school_id, classes: spell.classes, higher_lvl: JSON.stringify(spell.higher_lvl), dmgtype_id: spell.dmgtype_id, dmg_stat: spell.dmg_stat, save_stat: spell.save_stat, stats: JSON.stringify(spell.stats) } });

        return 'Successfully added Spell to Database';
    }

    static async remove(spell: { id: number }) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        await db.spells.delete({ where: { id: spell.id } });

        return 'Successfully removed Spell from Database';
    }

    static async update(spell: DBSpell) {
        if (!await this.exists(spell)) throw new NotFoundError('Spell not found', 'Could not find that Spell in the Database!');

        await db.spells.update({ data: { name: spell.name, description: spell.description, cast_time: spell.cast_time, cast_type: spell.cast_type, cast_req: spell.cast_req, level: spell.level, school_id: spell.school_id, classes: spell.classes, higher_lvl: JSON.stringify(spell.higher_lvl), dmgtype_id: spell.dmgtype_id, dmg_stat: spell.dmg_stat, save_stat: spell.save_stat, stats: JSON.stringify(spell.stats) }, where: { id: spell.id } } );

        return 'Successfully updated Spell in Database';
    }
}