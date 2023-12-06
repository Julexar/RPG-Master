import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { CharacterAttack } from "./character_attack.js";
import { Damagetype } from "./dmgtype.js";
const query = psql.query;

class CharacterAction {
    static async getAll(server, char) {
        const results = await query("SELECT * FROM character_actions WHERE char_id = $1", [char.id])

        if (results.length === 0) {
            throw new NotFoundError("No Character Actions found", "Could not find any Actions for that Character in the Database!");
        }

        return Promise.all(results.map(async (action) => {
            if (action.atk_id) {
                const attack = await CharacterAttack.getOne(char, {id: action.atk_id})

                const dmgtype = await Damagetype.getOne(server, {id: action.dmg_type_id})

                return {
                    id: action.id,
                    atk_id: attack.id,
                    name: attack.name,
                    description: attack.description,
                    atk_stat: attack.stat,
                    save: attack.save,
                    save_stat: attack.save_stat,
                    on_fail: attack.on_fail,
                    dmg_dice: attack.dmg_dice,
                    dmg_dice_size: attack.dmg_dice_size,
                    dmg: attack.dmg,
                    dmg_type: dmgtype.name,
                    magical: attack.magical,
                    magic_bonus: attack.magic_bonus
                };
            }

            return {
                id: action.id,
                char_id: char.id,
                name: action.name,
                description: action.description,
                type: action.type
            };
        }));
    };

    static async getOne(server, char, act) {
        if (act.id) {
            const results = await query("SELECT * FROM character_actions WHERE char_id = $1 AND id = $2", [char.id, act.id])

            if (results.length === 0) {
                throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
            }

            const action = results[0];

            if (action.atk_id) {
                const attack = await CharacterAttack.getOne(char, {id: action.atk_id})

                const dmgtype = await Damagetype.getOne(server, {id: action.dmg_type_id})

                return {
                    id: action.id,
                    atk_id: attack.id,
                    name: attack.name,
                    description: attack.description,
                    atk_stat: attack.stat,
                    save: attack.save,
                    save_stat: attack.save_stat,
                    on_fail: attack.on_fail,
                    dmg_dice: attack.dmg_dice,
                    dmg_dice_size: attack.dmg_dice_size,
                    dmg: attack.dmg,
                    dmg_type: dmgtype.name,
                    magical: attack.magical,
                    magic_bonus: attack.magic_bonus
                };
            }

            return {
                id: action.id,
                char_id: char.id,
                name: action.name,
                description: action.description,
                type: action.type
            };
        }

        const results = await query("SELECT * FROM character_actions WHERE char_id = $1 AND name = $2", [char.id, act.name])

        if (results.length === 0) {
            throw new NotFoundError("Character Action not found", "Could not find a Character Action with that name in the Database!");
        }

        const action = results[0];

        if (action.atk_id) {
            const attack = await CharacterAttack.getOne(char, {id: action.atk_id})

            const dmgtype = await Damagetype.getOne(server, {id: action.dmg_type_id})

            return {
                id: action.id,
                atk_id: attack.id,
                name: attack.name,
                description: attack.description,
                atk_stat: attack.stat,
                save: attack.save,
                save_stat: attack.save_stat,
                on_fail: attack.on_fail,
                dmg_dice: attack.dmg_dice,
                dmg_dice_size: attack.dmg_dice_size,
                dmg: attack.dmg,
                dmg_type: dmgtype.name,
                magical: attack.magical,
                magic_bonus: attack.magic_bonus
            };
        }

        return {
            id: action.id,
            char_id: char.id,
            name: action.name,
            description: action.description,
            type: action.type
        };
    };

    static async exists(char, act) {
        if (act.id) {
            const results = await query("SELECT * FROM character_actions WHERE char_id = $1 AND id = $2", [char.id, act.id])

            return results.length === 1;
        }

        const results = await query("SELECT * FROM character_actions WHERE char_id = $1 AND name = $2", [char.id, act.name])

        return results.length === 1;
    };

    static async add(char, act) {
        if (await this.exists(char, act)) {
            throw new DuplicateError("Duplicate Character Action", "A Character Action with that name already exists in the Database!");
        }

        const sql = "INSERT INTO character_actions (char_id, name, description, type, atk_id) VALUES($1, $2; $3, $4, $5)";
        await query(sql, [char.id, act.name, act.description, act.type, act.atk_id])

        return "Successfully added Character Action to Database";
    };

    static async remove(char, act) {
        if (!(await this.exists(char, act))) {
            throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
        }

        await query("DELETE FROM character_actions WHERE char_id = $1 AND id = $2", [char.id, act.id])

        return "Successfully removed Character Action from Database";
    };

    static async update(char, act) {
        if (!(await this.exists(char, act))) {
            throw new NotFoundError("Character Action not found", "Could not find that Character Action in the Database!");
        }

        const sql = "UPDATE character_actions SET name = $1, description = $2, type = $3 WHERE char_id = $4 AND id = $5";
        await query(sql, [act.name, act.description, act.type, char.id, act.id])

        return "Successfully updated Character Action in Database";
    };
};

export { CharacterAction };