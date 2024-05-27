import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { CharacterAttack } from './attack.ts';
const query = psql.query;

interface CharAction {
    id: bigint;
    char_id: bigint;
    name: string;
    description: string;
    atk_id: bigint;
    deleted_at: Date | null;
}

interface AddCharAction {
    name: string;
    description: string;
    atk_id: bigint;
}

class CharacterAction {
    attacks: typeof CharacterAttack;
    constructor() {
        this.attacks = CharacterAttack;
    }

    static async getAll(char: { id: bigint }) {
        const results = await query('SELECT * FROM character_actions WHERE char_id = $1', [char.id]) as CharAction[];

        if (results.length === 0) throw new NotFoundError('No Character Actions found', 'Could not find any Actions for that Character in the Database!');

        return Promise.all(
            results.map(async (action) => {
                if (action.deleted_at) return;

                if (action.atk_id) {
                    const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

                    if (attack.deleted_at) return;

                    return {
                        id: action.id,
                        char_id: char.id,
                        name: action.name,
                        description: action.description,
                        attack: attack,
                        deleted_at: action.deleted_at
                    };
                }

                return {
                    id: action.id,
                    char_id: char.id,
                    name: action.name,
                    description: action.description,
                    deleted_at: action.deleted_at
                };
            })
        );
    }

    static async getOne(char: { id: bigint }, act: { id?: bigint; name?: string }) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]) as CharAction[];

            if (results.length === 0) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

            const action = results[0];

            if (action.atk_id) {
                const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

                return {
                    id: action.id,
                    char_id: char.id,
                    name: action.name,
                    description: action.description,
                    attack: attack,
                    deleted_at: action.deleted_at
                };
            }

            return {
                id: action.id,
                char_id: char.id,
                name: action.name,
                description: action.description,
                deleted_at: action.deleted_at
            };
        }

        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]) as CharAction[];

        if (results.length === 0) {
            throw new NotFoundError('Character Action not found', 'Could not find a Character Action with that name in the Database!');
        }

        const action = results[0];

        if (action.deleted_at) throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to view has been deleted!');

        if (action.atk_id) {
            const attack = await CharacterAttack.getOne(char, { id: action.atk_id });

            if (attack.deleted_at) throw new BadRequestError('Character Action (Attack) deleted', 'The Character Action (Attack) you are trying to view has been deleted!');

            return {
                id: action.id,
                char_id: char.id,
                name: action.name,
                description: action.description,
                attack: attack,
                deleted_at: action.deleted_at
            };
        }

        return {
            id: action.id,
            char_id: char.id,
            name: action.name,
            description: action.description,
            deleted_at: action.deleted_at
        };
    }

    static async exists(char: { id: bigint }, act: { id?: bigint; name?: string }) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]) as CharAction[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]) as CharAction[];

        return results.length === 1;
    }

    static async isDeleted(char: { id: bigint }, act: { id?: bigint; name?: string }) {
        if (act.id) {
            const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]) as CharAction[];

            return !!results[0].deleted_at;
        }
        
        const results = await query('SELECT * FROM character_actions WHERE char_id = $1 AND name = $2', [char.id, act.name]) as CharAction[];

        return !!results[0].deleted_at;
    }

    static async add(char: { id: bigint }, act: AddCharAction) {
        if (await this.exists(char, act)) throw new DuplicateError('Duplicate Character Action', 'A Character Action with that name already exists in the Database!');

        const sql = 'INSERT INTO character_actions (char_id, name, description, atk_id) VALUES($1, $2; $3, $4)';
        await query(sql, [char.id, act.name, act.description, act.atk_id]);

        return 'Successfully added Character Action to Database';
    }

    static async remove(char: { id: bigint }, act: { id: bigint }) {
        if (!(await this.exists(char, act))) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        if (await this.isDeleted(char, act)) throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to remove has already been deleted!');

        await query('UPDATE character_actions SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, act.id]);

        return 'Successfully marked Character Action as deleted in Database';
    }

    static async remove_final(char: { id: bigint }, act: { id: bigint }) {
        if (!(await this.exists(char, act))) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        await query('DELETE FROM character_actions WHERE char_id = $1 AND id = $2', [char.id, act.id]);

        return 'Successfully removed Character Action from Database';
    }

    static async update(char: { id: bigint }, act: CharAction) {
        if (!(await this.exists(char, act))) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        if (await this.isDeleted(char, act)) throw new BadRequestError('Character Action deleted', 'The Character Action you are trying to update has been deleted!');

        const sql = 'UPDATE character_actions SET name = $1, description = $2 WHERE char_id = $3 AND id = $4';
        await query(sql, [act.name, act.description, char.id, act.id]);

        return 'Successfully updated Character Action in Database';
    }

    static async restore(char: { id: bigint }, act: { id: bigint }) {
        if (!(await this.exists(char, act))) throw new NotFoundError('Character Action not found', 'Could not find that Character Action in the Database!');

        if (!(await this.isDeleted(char, act))) throw new BadRequestError('Character Action not deleted', 'The Character Action you are trying to restore has not been deleted!');

        await query('UPDATE character_actions SET deleted_at = NULL WHERE char_id = $1 AND id = $2', [char.id, act.id]);

        return 'Successfully restored Character Action in Database';
    }
}

export { CharacterAction };
