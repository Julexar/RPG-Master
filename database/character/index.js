import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { CharacterStats } from './stats.js';
import { CharacterFeat } from './feat.js';
import { CharacterImmunity } from './immunity.js';
import { CharacterResistance } from './resistance.js';
import { CharacterProficiency } from './proficiency.js';
import { CharacterSense } from './sense.js';
import { CharacterNote } from './note.js';
import { CharacterAction } from './action.js';
import { CharacterAttack } from './attack.js';
import { Server } from '..';
import { CharacterClassFeat } from './class/feat.js';
import { CharacterClassProficiency } from './class/prof.js';
import { CharacterRaceFeat } from './race/feat.js';
import { CharacterRaceProficiency } from './race/prof.js';
import { CharacterSubclassProficiency } from './subclass/prof.js';
import { CharacterSubraceProf } from './subrace/prof.js';
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
        this.class_feats = CharacterClassFeat;
        this.class_profs = CharacterClassProficiency;
        this.race_feats = CharacterRaceFeat;
        this.race_profs = CharacterRaceProficiency;
        this.subclass_profs = CharacterSubclassProficiency;
        this.subrace_profs = CharacterSubraceProf;
    }

    /**
     *
     * @param {import('discord.js').User} user
     * @param {import('discord.js').Guild} server
     * @returns
     */
    async getAll(user, server) {
        const results = await query('SELECT * FROM characters WHERE user_id = $1', [user.id]);

        if (results.length === 0) throw new NotFoundError('No Characters found', 'Could not find any Characters in the Database!');

        return Promise.all(
            results.map(async character => {
                if (character.deleted_at) return;

                const charStats = await CharacterStats.getAll(character);
                const charFeats = await CharacterFeat.getAll(user.guild, character);
                const charImmunities = await CharacterImmunity.getAll(character);
                const charResistances = await CharacterResistance.getAll(character);
                const charProfs = await CharacterProficiency.getAll(character);
                const charSenses = await CharacterSense.getAll(character);
                const charActions = await CharacterAction.getAll(character);
                const charClass = (await Server.classes.getOne(server, { id: character.class_id })).class;
                const charSubclass = (await Server.subclasses.getOne(server, { id: character.subclass_id })).sub;
                const charRace = (await Server.races.getOne(server, { id: character.race_id })).race;
                const charSubrace = (await Server.subraces.getOne(server, { id: character.subrace_id })).sub;
                const charClassFeats = await CharacterClassFeat.getAll(server, character, charClass);
                const charClassProfs = await CharacterClassProficiency.getAll(character, charClass);
                const charRaceFeats = await CharacterRaceFeat.getAll(server, character, charRace);
                const charRaceProfs = await CharacterRaceProficiency.getAll(character, charRace);
                const charSubclassProfs = await CharacterSubclassProficiency.getAll(character, charSubclass);
                const charSubraceProfs = await CharacterSubraceProf.getAll(character, charSubrace);

                charClass.profs.concat(charClassProfs);
                charRace.profs.concat(charRaceProfs);
                charSubclass.profs.concat(charSubclassProfs);
                charSubrace.profs.concat(charSubraceProfs);

                return {
                    id: character.id,
                    user_id: user.id,
                    name: character.name,
                    portrait: character.portrait,
                    ac: character.ac,
                    hp: {
                        current: character.hp_current,
                        max: character.hp_max,
                        temp: character.hp_temp,
                    },
                    initiative: character.initiative,
                    level: character.level,
                    xp: character.xp,
                    currency: JSON.parse(character.currency),
                    stats: charStats,
                    feats: charFeats,
                    immunities: charImmunities,
                    resistances: charResistances,
                    profs: charProfs,
                    senses: charSenses,
                    actions: charActions,
                    class: {
                        ...charClass,
                        level: character.class_level,
                        feats: charClassFeats,
                    },
                    race: {
                        ...charRace,
                        feats: charRaceFeats,
                    },
                    subclass: charSubclass,
                    subrace: charSubrace,
                    multiclass: character.multiclass,
                    created_at: character.created_at,
                    deleted_at: character.deleted_at,
                };
            })
        );
    }

    async getOne(user, char) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

            if (results.length === 0) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

            const character = results[0];

            const charStats = await CharacterStats.getAll(character);
            const charFeats = await CharacterFeat.getAll(user.guild, character);
            const charImmunities = await CharacterImmunity.getAll(character);
            const charResistances = await CharacterResistance.getAll(character);
            const charProfs = await CharacterProficiency.getAll(character);
            const charSenses = await CharacterSense.getAll(character);
            const charActions = await CharacterAction.getAll(character);
            const charClass = (await Server.classes.getOne(server, { id: character.class_id })).class;
            const charSubclass = (await Server.subclasses.getOne(server, { id: character.subclass_id })).sub;
            const charRace = (await Server.races.getOne(server, { id: character.race_id })).race;
            const charSubrace = (await Server.subraces.getOne(server, { id: character.subrace_id })).sub;
            const charClassFeats = await CharacterClassFeat.getAll(server, character, charClass);
            const charClassProfs = await CharacterClassProficiency.getAll(character, charClass);
            const charRaceFeats = await CharacterRaceFeat.getAll(server, character, charRace);
            const charRaceProfs = await CharacterRaceProficiency.getAll(character, charRace);
            const charSubclassProfs = await CharacterSubclassProficiency.getAll(character, charSubclass);
            const charSubraceProfs = await CharacterSubraceProf.getAll(character, charSubrace);

            charClass.profs.concat(charClassProfs);
            charRace.profs.concat(charRaceProfs);
            charSubclass.profs.concat(charSubclassProfs);
            charSubrace.profs.concat(charSubraceProfs);

            if (character.deleted_at) throw new BadRequestError('Character deleted', 'The Character you are trying to view has been deleted!');

            return {
                id: character.id,
                user_id: user.id,
                name: character.name,
                portrait: character.portrait,
                ac: character.ac,
                hp: {
                    current: character.hp_current,
                    max: character.hp_max,
                    temp: character.hp_temp,
                },
                initiative: character.initiative,
                level: character.level,
                xp: character.xp,
                currency: JSON.parse(character.currency),
                stats: charStats,
                feats: charFeats,
                immunities: charImmunities,
                resistances: charResistances,
                profs: charProfs,
                senses: charSenses,
                actions: charActions,
                class: {
                    ...charClass,
                    level: character.class_level,
                    feats: charClassFeats,
                },
                race: {
                    ...charRace,
                    feats: charRaceFeats,
                },
                subclass: charSubclass,
                subrace: charSubrace,
                multiclass: character.multiclass,
                created_at: character.created_at,
                deleted_at: character.deleted_at,
            };
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]);

        if (results.length === 0) throw new NotFoundError('Character not found', 'Could not find a Character with that Name in the Database!');

        const character = results[0];

        const charStats = await CharacterStats.getAll(character);
        const charFeats = await CharacterFeat.getAll(user.guild, character);
        const charImmunities = await CharacterImmunity.getAll(character);
        const charResistances = await CharacterResistance.getAll(character);
        const charProfs = await CharacterProficiency.getAll(character);
        const charSenses = await CharacterSense.getAll(character);
        const charActions = await CharacterAction.getAll(character);
        const charClass = (await Server.classes.getOne(server, { id: character.class_id })).class;
        const charSubclass = (await Server.subclasses.getOne(server, { id: character.subclass_id })).sub;
        const charRace = (await Server.races.getOne(server, { id: character.race_id })).race;
        const charSubrace = (await Server.subraces.getOne(server, { id: character.subrace_id })).sub;
        const charClassFeats = await CharacterClassFeat.getAll(server, character, charClass);
        const charClassProfs = await CharacterClassProficiency.getAll(character, charClass);
        const charRaceFeats = await CharacterRaceFeat.getAll(server, character, charRace);
        const charRaceProfs = await CharacterRaceProficiency.getAll(character, charRace);
        const charSubclassProfs = await CharacterSubclassProficiency.getAll(character, charSubclass);
        const charSubraceProfs = await CharacterSubraceProf.getAll(character, charSubrace);

        charClass.profs.concat(charClassProfs);
        charRace.profs.concat(charRaceProfs);
        charSubclass.profs.concat(charSubclassProfs);
        charSubrace.profs.concat(charSubraceProfs);

        if (character.deleted_at) throw new BadRequestError('Character deleted', 'The Character you are trying to view has been deleted!');

        return {
            id: character.id,
            user_id: user.id,
            name: character.name,
            portrait: character.portrait,
            ac: character.ac,
            hp: {
                current: character.hp_current,
                max: character.hp_max,
                temp: character.hp_temp,
            },
            initiative: character.initiative,
            level: character.level,
            xp: character.xp,
            currency: JSON.parse(character.currency),
            stats: charStats,
            feats: charFeats,
            immunities: charImmunities,
            resistances: charResistances,
            profs: charProfs,
            senses: charSenses,
            actions: charActions,
            class: {
                ...charClass,
                level: character.class_level,
                feats: charClassFeats,
            },
            race: {
                ...charRace,
                feats: charRaceFeats,
            },
            subclass: charSubclass,
            subrace: charSubrace,
            multiclass: JSON.parse(character.multiclass),
            created_at: character.created_at,
            deleted_at: character.deleted_at,
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

    async isDeleted(user, char) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]);

        return !!results[0].deleted_at;
    }

    async add(user, char) {
        if (await this.exists(user, char))
            throw new DuplicateError('Duplicate Character', 'A Character with that name already exists in the Database!');

        const sql =
            'INSERT INTO characters (user_id, name, portrait, ac, level, xp, hp_current, hp_max, hp_temp, initiative, currency, race_id, subrace_id, class_id, subclass_id, class_level, multiclass) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11::JSON, $12, $13, $14, $15, $16::JSON)';
        await query(sql, [
            user.id,
            char.name,
            char.portrait,
            char.ac,
            char.level,
            char.xp,
            char.hp.current,
            char.hp.max,
            char.hp.temp,
            char.initiative,
            char.currency,
            char.race.id,
            char.subrace.id,
            char.class.id,
            char.subclass.id,
            char.class.level,
            char.multiclass,
        ]);

        return `Successfully added Character \"${char.name}\" for User \"${user.username}\" to Database`;
    }

    async remove(user, char) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char))
            throw new BadRequestError('Character already deleted', 'The Character you are trying to delete has already been deleted!');

        await query('UPDATE characters SET deleted_at = $1 WHERE user_id = $2 AND id = $3', [Date.now(), user.id, char.id]);

        return `Successfully marked Character \"${char.name}\" of User \"${user.username}\" as deleted in Database`;
    }

    async remove_final(user, char) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        await query('DELETE FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

        return `Successfulled removed Character \"${char.name}\" of User \"${user.username}\" from Database`;
    }

    async update(user, char) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char))
            throw new BadRequestError('Character deleted', 'The Character you are trying to update has been deleted!');

        const charHP = char.hp.current ? char.hp.current : char.hp;
        const charHPMax = char.hp.max ? char.hp.max : char.hp_max;
        const charHPTemp = char.hp.temp ? char.hp.temp : char.hp_temp;
        const charRaceId = char.race ? char.race.id : char.race_id;
        const charSubRaceId = char.subrace ? char.subrace.id : char.subrace_id;
        const charClassId = char.class ? char.class.id : char.class_id;
        const charClassLvl = char.class ? char.class.level : char.class_level;
        const charSubClassId = char.subclass ? char.subclass.id : char.subclass_id;

        const sql =
            'UPDATE characters SET name = $1, ac = $2, portrait = $3, hp_current = $4, hp_max = $5, hp_temp = $6, initiative = $7, level = $8, xp = $9, currency = $10::JSON, race_id = $11, subrace_id = $12, class_id = $13, subclass_id = $14, class_level = $15, multiclass = $16::JSON WHERE user_id = $17 AND id = $18';
        await query(sql, [
            char.name,
            char.ac,
            char.portrait,
            charHP,
            charHPMax,
            charHPTemp,
            char.initiative,
            char.level,
            char.xp,
            JSON.stringify(char.currency),
            charRaceId,
            charSubRaceId,
            charClassId,
            charSubClassId,
            charClassLvl,
            JSON.stringify(char.multiclass),
            user.id,
            char.id,
        ]);

        return `Successfully updated Character \"${char.name}\" of User \"${user.username}\" in Database`;
    }

    async setXP(user, char, xp) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char))
            throw new BadRequestError('Character deleted', 'The Character you are trying to update has been deleted!');

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

    async updateHP(server, user, char) {
        const dbChar = await this.getOne(user, char);
        const charConstitution = await CharacterStats.getOne(char, 'con');
        let hp = dbChar.class.hitdice_size + charConstitution;

        const modifier = (await Server.getOne(server)).hp_method;

        if (!dbChar.multiclass) {
            hp += dbChar.class.level - 1 * (Math.ceil(dbChar.class.hitdice_size * modifier) + charConstitution);
        } else {
            await Promise.all(
                dbChar.multiclass.map(async mc => {
                    if (mc.enabled) {
                        hp += mc.level - 1 * (Math.ceil(mc.class.hitdice_size * modifier) + charConstitution);
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
