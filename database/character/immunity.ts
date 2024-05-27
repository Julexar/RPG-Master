import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Server } from '..';
const query = psql.query;

interface CharImmunity {
    id: bigint;
    char_id: bigint;
    type: string;
    immune_id: bigint;
    deleted_at: Date | null;
}

interface AddCharImmunity {
    type: string;
    name?: string;
    immune_id?: bigint;
}

class CharacterImmunity {
    static async getAll(server: Guild, char: { id: bigint }) {
        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1', [char.id]) as CharImmunity[];

        if (results.length === 0) throw new NotFoundError('No Character Immunities found', 'Could not find any Immunities for that Character in the Database!');

        return Promise.all(
            results.map(async (charImmune) => {
                let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

                switch (charImmune.type) {
                    case 'damagetype':
                        dbImmune = (await Server.dmgtypes.getOne(server, { id: charImmune.immune_id })).dmgtype;
                    break;
                    case 'condition':
                        dbImmune = (await Server.conditions.getOne(server, { id: charImmune.immune_id })).condition;
                    break;
                }

                if (charImmune.deleted_at) return;

                return {
                    id: charImmune.id,
                    type: charImmune.type,
                    immunity: dbImmune,
                    deleted_at: charImmune.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, char: { id: bigint }, immune: { id?: bigint, name?: string, type?: string }) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]) as CharImmunity[];

            if (results.length === 0) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

            const charImmune = results[0];
            let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

            switch (charImmune.type) {
                case 'damagetype':
                    dbImmune = (await Server.dmgtypes.getOne(server, { id: charImmune.immune_id })).dmgtype;
                break;
                case 'condition':
                    dbImmune = (await Server.conditions.getOne(server, { id: charImmune.immune_id })).condition;
                break;
            }

            if (charImmune.deleted_at) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to view has been deleted!');

            return {
                id: charImmune.id,
                type: charImmune.type,
                immunity: dbImmune,
                deleted_at: charImmune.deleted_at
            };
        }

        let dbImmune: { id: bigint, name: string } = {id: BigInt(0), name: ''};

        switch (immune.type) {
            case 'damagetype':
                dbImmune = (await Server.dmgtypes.getOne(server, { name: immune.name })).dmgtype;
            break;
            case 'condition':
                dbImmune = (await Server.conditions.getOne(server, { name: immune.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]) as CharImmunity[];

        if (results.length === 0) throw new NotFoundError('Character Immunity not found', 'Could not find an Immunity with that name for that Character in the Database!');

        const charImmune = results[0];

        if (charImmune.deleted_at) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to view has been deleted!');

        return {
            id: charImmune.id,
            type: charImmune.type,
            immunity: dbImmune,
            deleted_at: charImmune.deleted_at
        };
    }

    static async exists(server: Guild, char: { id: bigint }, immune: { id?: bigint, name?: string, type?: string }) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]) as CharImmunity[];

            return results.length === 1;
        }

        let dbImmune: { id: bigint, name: string } = {id: BigInt(0), name: ''};

        switch (immune.type) {
            case 'damagetype':
                dbImmune = (await Server.dmgtypes.getOne(server, { name: immune.name })).dmgtype;
            break;
            case 'condition':
                dbImmune = (await Server.conditions.getOne(server, { name: immune.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]) as CharImmunity[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, char: { id: bigint }, immune: { id?: bigint, name?: string, type?: string }) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]) as CharImmunity[];

            return !!results[0].deleted_at;
        }

        let dbImmune: { id: bigint, name: string } = {id: BigInt(0), name: ''};

        switch (immune.type) {
            case 'damagetype':
                dbImmune = (await Server.dmgtypes.getOne(server, { name: immune.name })).dmgtype;
            break;
            case 'condition':
                dbImmune = (await Server.conditions.getOne(server, { name: immune.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]) as CharImmunity[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, char: { id: bigint }, immune: AddCharImmunity) {
        if (await this.exists(server, char, immune)) throw new DuplicateError('Duplicate Character Immunity', 'That Immunity is already linked to that Character!');

        if (!immune.immune_id) {
            let dbImmune: { id: bigint, name: string } = {id: BigInt(0), name: ''};

            switch (immune.type) {
                case 'damagetype':
                    dbImmune = (await Server.dmgtypes.getOne(server, { name: immune.name })).dmgtype;
                break;
                case 'condition':
                    dbImmune = (await Server.conditions.getOne(server, { name: immune.name })).condition;
                break;
            }

            immune.immune_id = dbImmune.id;
        }

        const sql = 'INSERT INTO character_immunities (char_id, type, immune_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, immune.type, immune.immune_id]);

        return 'Successfully added Character Immunity to Database';
    }

    static async remove(server: Guild, char: { id: bigint }, immune: { id: bigint }) {
        if (!(await this.exists(server, char, immune))) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

        if (await this.isDeleted(server, char, immune)) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to remove has already been deleted!');

        await query('UPDATE character_immunities SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, immune.id]);

        return 'Successfully removed Character Immunity from Database';
    }

    static async remove_final(server: Guild, char: { id: bigint }, immune: { id: bigint }) {
        if (!(await this.exists(server, char, immune))) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

        await query('DELETE FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

        return 'Successfully removed Character Immunity from Database';
    }

    static async restore(server: Guild, char: { id: bigint }, immune: { id: bigint }) {
        if (!(await this.exists(server, char, immune))) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

        if (!(await this.isDeleted(server, char, immune))) throw new BadRequestError('Character Immunity not deleted', 'The Character Immunity you are trying to restore has not been deleted!');

        await query('UPDATE character_immunities SET deleted_at = NULL WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

        return 'Successfully restored Character Immunity in Database';
    }
}

export { CharacterImmunity };
