import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
import { CharacterStats } from './character_stats.js';
import { CharacterFeat } from './character_feat.js';
import { CharacterImmunity } from './character_immunity.js';
import { CharacterResistance } from './character_resistance.js';
import { CharacterProficiency } from './character_proficiency.js';
import { CharacterSense } from './character_sense.js';
import { CharacterNote } from './character_note.js';
import { CharacterAction } from './character_action.js';
import { CharacterAttack } from './character_attack.js';
import { Class } from './class.js';
const query = psql.query;

class character {
    constructor() {
        this.actions = CharacterAction;
        this.attacks = CharacterAttack;
        this.feats = CharacterFeat;
        this.immunities = CharacterImmunity;
        this.resistances = CharacterResistance;
        this.notes = CharacterNote;
        this.senses = CharacterSense;
        this.profs = CharacterProficiency;
    }

    async getAll(user) {
        const results = await this.query('SELECT * FROM characters WHERE user_id = $1', [user.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Characters found', 'Could not find any Characters in the Database!');
        }

        return Promise.all(
            results.map(async (character) => {
                const charStats = await CharacterStats.getAll(character);

                return {
                    owner: user.id,
                    name: character.name,
                    ac: character.ac,
                    hp: {
                        current: character.hp,
                        max: character.hp_max,
                        temp: character.hp_temp,
                        method: character.hp_method,
                    },
                    portrait: character.portrait,
                    init: character.init,
                    level: character.level,
                    stats: charStats,
                    money: {
                        pp: character.pp,
                        gp: character.gp,
                        ep: character.ep,
                        sp: character.sp,
                        cp: character.cp,
                    },
                    multi: character.multi,
                    armor: character.armor_id,
                    race: character.race_id,
                    subrace: character.subrace_id,
                    class: character.class_id,
                    subclass: character.subclass_id,
                    class_level: character.class_level,
                    mc: [
                        {
                            id: character.mc1_id,
                            level: character.mc1_level,
                            sub: character.mc1_sub_id,
                        },
                        {
                            id: character.mc2_id,
                            level: character.mc2_level,
                            sub: character.mc2_sub_id,
                        },
                        {
                            id: character.mc2_id,
                            level: character.mc2_level,
                            sub: character.mc3_sub_id,
                        },
                    ],
                };
            })
        );
    }

    async getOne(user, char) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');
            }

            const character = results[0];
            const charStats = await CharacterStats.getAll(character);

            return {
                owner: user.id,
                name: character.name,
                ac: character.ac,
                hp: {
                    current: character.hp,
                    max: character.hp_max,
                    temp: character.hp_temp,
                    method: character.hp_method,
                },
                portrait: character.portrait,
                init: character.init,
                level: character.level,
                stats: charStats,
                money: {
                    pp: character.pp,
                    gp: character.gp,
                    ep: character.ep,
                    sp: character.sp,
                    cp: character.cp,
                },
                multi: character.multi,
                armor: character.armor_id,
                race: character.race_id,
                subrace: character.subrace_id,
                class: character.class_id,
                subclass: character.subclass_id,
                class_level: character.class_level,
                mc: [
                    {
                        id: character.mc1_id,
                        level: character.mc1_level,
                        sub: character.mc1_sub_id,
                    },
                    {
                        id: character.mc2_id,
                        level: character.mc2_level,
                        sub: character.mc2_sub_id,
                    },
                    {
                        id: character.mc2_id,
                        level: character.mc2_level,
                        sub: character.mc3_sub_id,
                    },
                ],
            };
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]);

        if (results.length === 0) {
            throw new NotFoundError('Character not found', 'Could not find a Character with that Name in the Database!');
        }

        const character = results[0];
        const charStats = await CharacterStats.getAll(character);

        return {
            owner: user.id,
            name: character.name,
            ac: character.ac,
            hp: {
                current: character.hp,
                max: character.hp_max,
                temp: character.hp_temp,
                method: character.hp_method,
            },
            portrait: character.portrait,
            init: character.init,
            level: character.level,
            stats: charStats,
            money: {
                pp: character.pp,
                gp: character.gp,
                ep: character.ep,
                sp: character.sp,
                cp: character.cp,
            },
            multi: character.multi,
            armor: character.armor_id,
            race: character.race_id,
            subrace: character.subrace_id,
            class: character.class_id,
            subclass: character.subclass_id,
            class_level: character.class_level,
            mc: [
                {
                    id: character.mc1_id,
                    level: character.mc1_level,
                    sub: character.mc1_sub_id,
                },
                {
                    id: character.mc2_id,
                    level: character.mc2_level,
                    sub: character.mc2_sub_id,
                },
                {
                    id: character.mc2_id,
                    level: character.mc2_level,
                    sub: character.mc3_sub_id,
                },
            ],
        };
    }

    async exists(user, char) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]);

        return results.length === 1;
    }

    async add(user, char) {
        if (await this.exists(user, char)) {
            throw new DuplicateError('Duplicate Character', 'A Character with that name already exists in the Database!');
        }

        const sql =
            'INSERT INTO characters (user_id, name, ac, hp, hp_max, hp_temp, init, level, xp, pp, gp, ep, sp, cp, armor_id, race_id, subrace_id, class_id, subclass_id, class_level, multi, mc1_id, mc1_sub_id, mc1_level, mc2_id, mc2_sub_id, mc2_level, mc3_id, mc3_sub_id, mc3_level) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)';
        await query(sql, [
            user.id,
            char.name,
            char.ac,
            char.hp,
            char.hp_max,
            char.hp_temp,
            char.init,
            char.level,
            char.xp,
            char.money.pp,
            char.money.gp,
            char.money.ep,
            char.money.sp,
            char.money.cp,
            char.armor,
            char.race,
            char.subrace,
            char.class,
            char.subclass,
            char.class_level,
            char.multi,
            char.mc[0].id,
            char.mc[0].sub,
            char.mc[0].level,
            char.mc[1].id,
            char.mc[1].sub,
            char.mc[1].level,
            char.mc[2].id,
            char.mc[2].sub,
            char.mc[2].level,
        ]);

        return `Successfully added Character \"${char.name}\" for User \"${user.username}\" to Database`;
    }

    async remove(user, char) {
        if (!(await this.exists(user, char))) {
            throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');
        }

        await query('DELETE FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

        return `Successfulled removed Character \"${char.name}\" of User \"${user.username}\" from Database`;
    }

    async update(user, char) {
        if (!(await this.exists(user, char))) {
            throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');
        }

        const charHP = char.hp.current ? char.hp.current : char.hp;
        const charHPMax = char.hp.max ? char.hp.max : char.hp_max;
        const charHPTemp = char.hp.temp ? char.hp.temp : char.hp_temp;
        const charHPMethod = char.hp.method ? char.hp.method : char.hp_method;
        const pp = char.money ? char.money.pp : char.pp;
        const gp = char.money ? char.money.gp : char.gp;
        const sp = char.money ? char.money.sp : char.sp;
        const ep = char.money ? char.money.ep : char.ep;
        const cp = char.money ? char.money.cp : char.cp;
        const charRace = char.race ? char.race : char.race_id;
        const charSubRace = char.subrace ? char.subrace : char.subrace_id;
        const charClass = char.class ? char.class : char.class_id;
        const charSubClass = char.subclass ? char.subclass : char.subclass_id;
        const charMC1 = char.mc ? char.mc[0].id : char.mc1_id;
        const charMC1Lvl = char.mc ? char.mc[0].level : char.mc1_level;
        const charMC1Sub = char.mc ? char.mc[0].sub : char.mc1_sub_id;
        const charMC2 = char.mc ? char.mc[1].id : char.mc2_id;
        const charMC2Lvl = char.mc ? char.mc[1].level : char.mc2_level;
        const charMC2Sub = char.mc ? char.mc[1].sub : char.mc2_sub_id;
        const charMC3 = char.mc ? char.mc[2].id : char.mc3_id;
        const charMC3Lvl = char.mc ? char.mc[2].level : char.mc3_level;
        const charMC3Sub = char.mc ? char.mc[2].sub : char.mc3_sub_id;

        const sql =
            'UPDATE characters SET name = $1, ac = $2, hp = $3, hp_max = $4, hp_temp = $5, init = $6, level = $7, xp = $8, pp = $9, gp = $10, ep = $11, sp = $12, cp = $13, armor_id = $14, race_id = $15, subrace_id = $16 class_id = $17, subclass_id = $18, class_level = $19, multi = $20, mc1_id = $21, mc1_sub_id = $22, mc1_level = $23, mc2_id = $24, mc2_sub_id = $25, mc2_level = $26, mc3_id = $27, mc3_sub_id = $28, mc3_level = $29, portrait = $30, hp_method = $31 WHERE user_id = $32 AND id = $33';
        await query(sql, [
            char.name,
            char.ac,
            char.hp.current,
            charHP,
            charHPMax,
            charHPTemp,
            char.init,
            char.level,
            char.xp,
            pp,
            gp,
            ep,
            sp,
            cp,
            char.multi,
            charRace,
            charSubRace,
            charClass,
            charSubClass,
            char.class_level,
            charMC1,
            charMC1Sub,
            charMC1Lvl,
            charMC2,
            charMC2Sub,
            charMC2Lvl,
            charMC3,
            charMC3Sub,
            charMC3Lvl,
            char.portrait,
            charHPMethod,
            user.id,
            char.id,
        ]);

        return `Successfully updated Character \"${char.name}\" of User \"${user.username}\" in Database`;
    }

    async setXP(user, char, xp) {
        if (!(await this.exists(user, char))) {
            throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');
        }

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [xp, user.id, char.id]);

        return `Successfully set Level of Character \"${char.name}\" to ${Math.ceil(xp / 300) - 1} (${xp} XP)`;
    }

    async addXP(user, char, xp) {
        const dbChar = await this.getOne(user, char);

        const newXP = dbChar.xp + xp > 335000 ? 335000 : dbChar.xp + xp;

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [newXP, user.id, char.id]);

        return `Successfully added ${xp} XP to Character \"${char.name}\". Character is now Level ${Math.ceil(newXP / 300) - 1} (${newXP} XP)`;
    }

    async removeXP(user, char, xp) {
        const dbChar = await this.getOne(user, char);

        const newXP = dbChar.xp - xp < 300 ? 300 : dbChar.xp - xp;

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [newXP, user.id, char.id]);

        return `Successfully removed ${xp} XP from Character \"${char.name}\". Character is now Level ${Math.ceil(newXP / 300) - 1} (${newXP} XP)`;
    }

    async setLevel(user, char, level) {
        const xp = 300 * (level - 1);

        await this.setXP(user, char, xp);
    }

    async updateHP(user, char) {
        const dbChar = await this.getOne(user, char);
        const charClass = await Class.getOne({ id: dbChar.class });
        const charConstitution = await CharacterStats.getOne(char, 'con');
        let hp = charClass.hitdice_size + charConstitution;

        const modifier = dbChar.hp_method === 'fixed' ? 0.5 : Math.random();

        if (!dbChar.multi) {
            hp += dbChar.class_level - 1 * (Math.ceil(charClass.hitdice_size * modifier) + charConstitution);
        } else {
            await Promise.all(
                dbChar.mc.map(async (mc) => {
                    if (mc.enabled) {
                        const charMC = await Class.getOne({ id: mc.id });

                        hp += mc.level - 1 * (Math.ceil(charMC.hitdice_size * modifier) + charConstitution);
                    }
                })
            );
        }

        await query('UPDATE characters SET hp_max = $1 WHERE user_id = $2 AND id = $3', [hp, user.id, dbChar.id]);

        return `Successfully set Maximum HP of Character \"${char.name}\" to ${hp}`;
    }
}

const Character = new character();

export { Character };
