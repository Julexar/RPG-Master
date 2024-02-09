import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { CharacterStats } from './stats.ts';
import { CharacterFeat } from './feat.ts';
import { CharacterImmunity } from './immunity.ts';
import { CharacterResistance } from './resistance.ts';
import { CharacterProficiency } from './proficiency.ts';
import { CharacterSense } from './sense.ts';
import { CharacterNote } from './note.ts';
import { CharacterAction } from './action.ts';
import { CharacterAttack } from './attack.ts';
import { Server } from '..';
import { CharacterClassFeat } from './class/feat.ts';
import { CharacterClassProficiency } from './class/prof.ts';
import { CharacterRaceFeat } from './race/feat.ts';
import { CharacterRaceProficiency } from './race/prof.ts';
import { CharacterSubclassProficiency } from './subclass/prof.ts';
import { CharacterSubraceProf } from './subrace/prof.ts';
const query = psql.query;

interface DBCharacter {
    id: bigint;
    user_id: bigint;
    name: string;
    portrait: string;
    ac: number;
    hp_current: number;
    hp_max: number;
    hp_temp: number;
    initiative: number;
    level: number;
    xp: number;
    currency: {
        cp: number;
        sp: number;
        ep: number;
        gp: number;
        pp: number;
    };
    race_id: bigint;
    subrace_id: bigint;
    class_id: bigint;
    subclass_id: bigint;
    class_level: number;
    multiclass: {
        class_id: bigint;
        level: number;
        enabled: boolean;
    }[] | null;
    created_at: Date;
    deleted_at: Date | null;
}

interface AddCharacter {
    name: string;
    portrait: string;
    ac: number;
    hp: {
        current: number;
        max: number;
        temp: number;
    };
    initiative: number;
    level: number;
    xp: number;
    currency: {
        cp: number;
        sp: number;
        ep: number;
        gp: number;
        pp: number;
    };
    race_id: bigint;
    subrace_id: bigint;
    class_id: bigint;
    subclass_id: bigint;
    class_level: number;
    multiclass: {
        class_id: bigint;
        level: number;
        enabled: boolean;
    }[] | null;
}

class character {
    actions: typeof CharacterAction;
    attacks: typeof CharacterAttack;
    feats: typeof CharacterFeat;
    immunities: typeof CharacterImmunity;
    resistances: typeof CharacterResistance;
    notes: typeof CharacterNote;
    senses: typeof CharacterSense;
    profs: typeof CharacterProficiency;
    class_feats: typeof CharacterClassFeat;
    class_profs: typeof CharacterClassProficiency;
    race_feats: typeof CharacterRaceFeat;
    race_profs: typeof CharacterRaceProficiency;
    subclass_profs: typeof CharacterSubclassProficiency;
    subrace_profs: typeof CharacterSubraceProf;
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

    async getAll(user: { id: bigint }, server: { id: bigint }) {
        const results = await query('SELECT * FROM characters WHERE user_id = $1', [user.id]) as DBCharacter[];

        if (results.length === 0) throw new NotFoundError('No Characters found', 'Could not find any Characters in the Database!');

        return Promise.all(
            results.map(async (character) => {
                if (character.deleted_at) return;

                const charStats = await CharacterStats.getAll(character);
                const charFeats = await CharacterFeat.getAll(server, character);
                const charImmunities = await CharacterImmunity.getAll(server, character);
                const charResistances = await CharacterResistance.getAll(server, character);
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
                    currency: JSON.parse(JSON.stringify(character.currency)),
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
                        prof_overwrites: charClassProfs,
                    },
                    race: {
                        ...charRace,
                        feats: charRaceFeats,
                        prof_overwrites: charRaceProfs,
                    },
                    subclass: {
                        ...charSubclass,
                        prof_overwrites: charSubclassProfs,
                    },
                    subrace: {
                        ...charSubrace,
                        prof_overwrites: charSubraceProfs,
                    },
                    multiclass: JSON.parse(JSON.stringify(character.multiclass)),
                    created_at: character.created_at,
                    deleted_at: character.deleted_at
                }
            })
        );
    }

    async getOne(user: { id: bigint }, char: { id?: bigint, name?: string }, server: { id: bigint }) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]) as DBCharacter[];

            if (results.length === 0) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

            const character = results[0];
            
            const charStats = await CharacterStats.getAll(character);
            const charFeats = await CharacterFeat.getAll(server, character);
            const charImmunities = await CharacterImmunity.getAll(server, character);
            const charResistances = await CharacterResistance.getAll(server, character);
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
                currency: JSON.parse(JSON.stringify(character.currency)),
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
                    prof_overwrites: charClassProfs,
                },
                race: {
                    ...charRace,
                    feats: charRaceFeats,
                    prof_overwrites: charRaceProfs,
                },
                subclass: {
                    ...charSubclass,
                    prof_overwrites: charSubclassProfs,
                },
                subrace: {
                    ...charSubrace,
                    prof_overwrites: charSubraceProfs,
                },
                multiclass: JSON.parse(JSON.stringify(character.multiclass)),
                created_at: character.created_at,
                deleted_at: character.deleted_at
            }
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]) as DBCharacter[];

        if (results.length === 0) throw new NotFoundError('Character not found', 'Could not find a Character with that Name in the Database!');

        const character = results[0];
        
        const charStats = await CharacterStats.getAll(character);
        const charFeats = await CharacterFeat.getAll(server, character);
        const charImmunities = await CharacterImmunity.getAll(server, character);
        const charResistances = await CharacterResistance.getAll(server, character);
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
            currency: JSON.parse(JSON.stringify(character.currency)),
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
                prof_overwrites: charClassProfs,
            },
            race: {
                ...charRace,
                feats: charRaceFeats,
                prof_overwrites: charRaceProfs,
            },
            subclass: {
                ...charSubclass,
                prof_overwrites: charSubclassProfs,
            },
            subrace: {
                ...charSubrace,
                prof_overwrites: charSubraceProfs,
            },
            multiclass: JSON.parse(JSON.stringify(character.multiclass)),
            created_at: character.created_at,
            deleted_at: character.deleted_at
        }
    }

    async exists(user: { id: bigint }, char: { id?: bigint, name?: string }) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]) as DBCharacter[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]) as DBCharacter[];

        return results.length === 1;
    }

    async isDeleted(user: { id: bigint }, char: { id?: bigint, name?: string }) {
        if (char.id) {
            const results = await query('SELECT * FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]) as DBCharacter[];

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM characters WHERE user_id = $1 AND name = $2', [user.id, char.name]) as DBCharacter[];

        return !!results[0].deleted_at;
    }

    async add(user: { id: bigint, displayName: string }, char: AddCharacter) {
        if (await this.exists(user, char)) throw new DuplicateError('Duplicate Character', 'A Character with that name already exists in the Database!');

        const sql = 'INSERT INTO characters (user_id, name, portrait, ac, level, xp, hp_current, hp_max, hp_temp, initiative, currency, race_id, subrace_id, class_id, subclass_id, class_level, multiclass) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11::JSON, $12, $13, $14, $15, $16::JSON)';
        await query(sql, [user.id, char.name, char.portrait, char.ac, char.level, char.xp, char.hp.current, char.hp.max, char.hp.temp, char.initiative, JSON.stringify(char.currency), char.race_id, char.subrace_id, char.class_id, char.subclass_id, char.class_level, JSON.stringify(char.multiclass)]);

        return `Successfully added Character \"${char.name}\" for User \"${user.displayName}\" to Database`;
    }

    async remove(user: { id: bigint, displayName: string }, char: { id: bigint, name?: string }) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char)) throw new BadRequestError('Character already deleted', 'The Character you are trying to delete has already been deleted!');

        await query('UPDATE characters SET deleted_at = $1 WHERE user_id = $2 AND id = $3', [Date.now(), user.id, char.id]);

        return `Successfully marked Character \"${char.name}\" of User \"${user.displayName}\" as deleted in Database`;
    }

    async remove_final(user: { id: bigint, displayName: string }, char: { id: bigint, name?: string }) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        await query('DELETE FROM characters WHERE user_id = $1 AND id = $2', [user.id, char.id]);

        return `Successfulled removed Character \"${char.name}\" of User \"${user.displayName}\" from Database`;
    }

    async update(user: { id: bigint, displayName: string }, char: DBCharacter) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char)) throw new BadRequestError('Character deleted', 'The Character you are trying to update has been deleted!');

        const charHP = char.hp_current;
        const charHPMax = char.hp_max;
        const charHPTemp = char.hp_temp;
        const charRaceId = char.race_id;
        const charSubRaceId = char.subrace_id;
        const charClassId = char.class_id;
        const charClassLvl = char.class_level;
        const charSubClassId = char.subclass_id;

        const sql = 'UPDATE characters SET name = $1, ac = $2, portrait = $3, hp_current = $4, hp_max = $5, hp_temp = $6, initiative = $7, level = $8, xp = $9, currency = $10::JSON, race_id = $11, subrace_id = $12, class_id = $13, subclass_id = $14, class_level = $15, multiclass = $16::JSON WHERE user_id = $17 AND id = $18';
        await query(sql, [char.name, char.ac, char.portrait, charHP, charHPMax, charHPTemp, char.initiative, char.level, char.xp, JSON.stringify(char.currency), charRaceId, charSubRaceId, charClassId, charSubClassId, charClassLvl, JSON.stringify(char.multiclass), user.id, char.id]);

        return `Successfully updated Character \"${char.name}\" of User \"${user.displayName}\" in Database`;
    }

    async setXP(user: { id: bigint, displayName: string }, char: { id: bigint, name?: string }, xp: number) {
        if (!(await this.exists(user, char))) throw new NotFoundError('Character not found', 'Could not find that Character in the Database!');

        if (await this.isDeleted(user, char)) throw new BadRequestError('Character deleted', 'The Character you are trying to update has been deleted!');

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [xp, user.id, char.id]);

        return `Successfully set Level of Character \"${char.name}\" to ${Math.ceil(xp / 300) - 1} (${xp} XP)`;
    }

    async addXP(server: { id: bigint }, user: { id: bigint }, char: { id: bigint, name?: string }, xp: number) {
        const dbChar = await this.getOne(user, char, server);

        const newXP = dbChar.xp + xp > 335000 ? 335000 : dbChar.xp + xp;

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [newXP, user.id, char.id]);

        return `Successfully added ${xp} XP to Character \"${char.name}\". Character is now Level ${Math.ceil(newXP / 300) - 1} (${newXP} XP)`;
    }

    async removeXP(server: { id: bigint }, user: { id: bigint }, char: { id: bigint, name?: string }, xp: number) {
        const dbChar = await this.getOne(user, char, server);

        const newXP = dbChar.xp - xp < 300 ? 300 : dbChar.xp - xp;

        await query('UPDATE characters SET xp = $1 WHERE user_id = $2 AND id = $3', [newXP, user.id, char.id]);

        return `Successfully removed ${xp} XP from Character \"${char.name}\". Character is now Level ${Math.ceil(newXP / 300) - 1} (${newXP} XP)`;
    }

    async setLevel(user: { id: bigint, displayName: string }, char: { id: bigint, name?: string }, level: number) {
        const xp = 300 * (level - 1);

        await this.setXP(user, char, xp);
    }

    async updateHP(server: { id: bigint }, user: { id: bigint }, char: { id: bigint, name?: string }) {
        const dbChar = await this.getOne(user, char, server);
        const charConstitution = (await CharacterStats.getOne(char, { stat_key: 'con' })).value;
        let hp = dbChar.class.hitdice + charConstitution;

        const modifier = (await Server.getOne(server)).hp_method;

        if (!dbChar.multiclass) {
            hp += dbChar.class.level - 1 * (Math.ceil(dbChar.class.hitdice * modifier) + charConstitution);
        } else {
            await Promise.all(
                dbChar.multiclass.map(async (mc) => {
                    if (mc.enabled) {
                        hp += mc.level - 1 * (Math.ceil(mc.class.hitdice * modifier) + charConstitution);
                    }
                })
            );
        }

        await query('UPDATE characters SET hp_max = $1 WHERE user_id = $2 AND id = $3', [hp, user.id, dbChar.id]);

        return `Successfully set Maximum HP of Character \"${char.name}\" to ${hp}`;
    }
}

const Character = new character();

export { Character, DBCharacter };
