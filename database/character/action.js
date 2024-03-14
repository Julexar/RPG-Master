import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { CharacterAttack } from './attack.js';
import { Damagetype } from '../global';
const query = psql.query;

class CharacterAction {
    static async getAll(server, char) {
        const results = await query('SELECT * FROM character_actions WHERE char_id = $1', [char.id]);

        if (results.length === 0)
            throw new NotFoundError('No Character Actions found', 'Could not find any Actions for that Character in the Database!');

        return Promise.all(
            results.map(async action => {
                if (action.deleted_at) return;

                if (action.atk_id) {
                    const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

                    const dmgtype = await Damagetype.getOne(server, { id: action.dmg_type_id });

                    if (attack.deleted_at) return;

                    return {
                        id: action.id,
                        char_id: char.id,
                        atk_id: attack.id,
                        name: attack.name,
                        description: attack.description,
                        atk_stat: attack.atk_stat,
                        save_dc: attack.save_dc,
                        save_stat: attack.save_stat,
                        on_fail_dmg: attack.on_fail_dmg,
                        damage: attack.damage,
                        dmg: attack.dmg_bonus,
                        dmgtype: dmgtype.name,
                        magic_bonus: attack.magic_bonus,
                        proficient: attack.proficient,
                        deleted_at: action.deleted_at,
                    };
                }

                return {
                    id: action.id,
                    char_id: char.id,
                    name: action.name,
                    description: action.description,
                    deleted_at: action.deleted_at,
                };
            })
        );
    }

    static async getOne(server, char, act) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]);

            if (results.length === 0) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

            const action = results[0];

            if (action.atk_id) {
                const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

                const dmgtype = await Damagetype.getOne(server, { id: action.dmg_type_id });

                return {
                    id: action.id,
                    char_id: char.id,
                    atk_id: attack.id,
                    name: attack.name,
                    description: attack.description,
                    atk_stat: attack.atk_stat,
                    save_dc: attack.save_dc,
                    save_stat: attack.save_stat,
                    on_fail_dmg: attack.on_fail_dmg,
                    damage: attack.damage,
                    dmg: attack.dmg_bonus,
                    dmgtype: dmgtype.name,
                    magic_bonus: attack.magic_bonus,
                    proficient: attack.proficient,
                    deleted_at: action.deleted_at,
                };
            }

            return {
                id: action.id,
                char_id: char.id,
                name: action.name,
                description: action.description,
                deleted_at: action.deleted_at,
            };
        }

        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]);

        if (results.length === 0) {
            throw new NotFoundError('Character Action not found', 'Could not find a Character Action with that name in the Database!');
        }

        const action = results[0];

        if (action.deleted_at) throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to view has been deleted!');

        if (action.atk_id) {
            const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

            const dmgtype = await Damagetype.getOne(server, { id: action.dmg_type_id });

            if (attack.deleted_at)
                throw new BadRequestError(
                    'Character Action (Attack) deleted',
                    'The Character Action (Attack) you are trying to view has been deleted!'
                );

            return {
                id: action.id,
                char_id: char.id,
                atk_id: attack.id,
                name: attack.name,
                description: attack.description,
                atk_stat: attack.atk_stat,
                save_dc: attack.save_dc,
                save_stat: attack.save_stat,
                on_fail_dmg: attack.on_fail_dmg,
                damage: attack.damage,
                dmg: attack.dmg_bonus,
                dmgtype: dmgtype.name,
                magic_bonus: attack.magic_bonus,
                proficient: attack.proficient,
                deleted_at: action.deleted_at,
            };
        }

        return {
            id: action.id,
            char_id: char.id,
            name: action.name,
            description: action.description,
            deleted_at: action.deleted_at,
        };
    }

    static async exists(char, act) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]);

        return results.length === 1;
    }

    static async isDeleted(char, act) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]);

            return !!results[0].deleted_at;
        }

        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]);

        return !!results[0].deleted_at;
    }

    static async add(char, act) {
        if (await this.exists(char, act))
            throw new DuplicateError('Duplicate Character Action', 'A Character Action with that name already exists in the Database!');

        const sql = 'INSERT INTO character_actions (char_id, name, description, type, atk_id) VALUES($1, $2; $3, $4, $5)';
        await query(sql, [char.id, act.name, act.description, act.type, act.atk_id]);

        return 'Successfully added Character Action to Database';
    }

    static async remove(char, act) {
        if (!(await this.exists(char, act)))
            throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        if (await this.isDeleted(char, act))
            throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to remove has already been deleted!');

        await query('UPDATE character_actions SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, act.id]);

        return 'Successfully marked Character Action as deleted in Database';
    }

    static async remove_final(char, act) {
        if (!(await this.exists(char, act)))
            throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        await query('DELETE FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]);

        return 'Successfully removed Character Action from Database';
    }

    static async update(char, act) {
        if (!(await this.exists(char, act)))
            throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        if (await this.isDeleted(char, act))
            throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to update has been deleted!');

        const sql = 'UPDATE character_actions SET name = $1, description = $2, type = $3 WHERE char_id = $4 AND id = $5';
        await query(sql, [act.name, act.description, act.type, char.id, act.id]);

        return 'Successfully updated Character Action in Database';
    }
}

export { CharacterAction };
