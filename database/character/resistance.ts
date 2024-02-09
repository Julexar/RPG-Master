import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Server } from '..';
const query = psql.query;

interface CharResistance {
    id: bigint;
    char_id: bigint;
    type: string;
    resist_id: bigint;
    deleted_at: Date | null;
}

interface AddCharResistance {
    type: string;
    name?: string;
    resist_id?: bigint;
}

class CharacterResistance {
    static async getAll(server: Guild, char: { id: bigint }) {
        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1', [char.id]) as CharResistance[];

        if (results.length === 0) {
            throw new NotFoundError('No Character Resistances found', 'Could not find any Resistances for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charResist) => {
                if (charResist.deleted_at) return;

                let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

                switch (charResist.type) {
                    case 'damagetype':
                        dbResist = (await Server.dmgtypes.getOne(server, { id: charResist.resist_id })).dmgtype;
                    break;
                    case 'condition':
                        dbResist = (await Server.conditions.getOne(server, { id: charResist.resist_id })).condition;
                    break;
                }

                return {
                    id: charResist.id,
                    type: charResist.type,
                    resistance: dbResist,
                    deleted_at: charResist.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, char: { id: bigint }, resist: { id?: bigint, name?: string, type?: string }) {
        if (resist.id) {
            const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]) as CharResistance[];

            if (results.length === 0) throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');

            const charResist = results[0];
            let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

            switch (charResist.type) {
                case 'damagetype':
                    dbResist = (await Server.dmgtypes.getOne(server, { id: charResist.resist_id })).dmgtype;
                break;
                case 'condition':
                    dbResist = (await Server.conditions.getOne(server, { id: charResist.resist_id })).condition;
                break;
            }

            return {
                id: charResist.id,
                type: charResist.type,
                resistance: dbResist,
                deleted_at: charResist.deleted_at
            };
        }

        let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

        switch (resist.type) {
            case 'damagetype':
                dbResist = (await Server.dmgtypes.getOne(server, { name: resist.name })).dmgtype;
            break;
            case 'condition':
                dbResist = (await Server.conditions.getOne(server, { name: resist.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND resist_id = $2', [char.id, dbResist.id]) as CharResistance[];

        if (results.length === 0) throw new NotFoundError('Character Resistance not found', 'Could not find a Resistance with that name for that Character in the Database!');

        const charResist = results[0];

        return {
            id: charResist.id,
            type: charResist.type,
            resistance: dbResist,
            deleted_at: charResist.deleted_at
        };
    }

    static async exists(server: Guild, char: { id: bigint }, resist: { id?: bigint, name?: string, type?: string }) {
        if (resist.id) {
            const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]) as CharResistance[];

            return results.length === 1;
        }

        let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

        switch (resist.type) {
            case 'damagetype':
                dbResist = (await Server.dmgtypes.getOne(server, { name: resist.name })).dmgtype;
            break;
            case 'condition':
                dbResist = (await Server.conditions.getOne(server, { name: resist.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2', [char.id, dbResist.id]) as CharResistance[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, char: { id: bigint }, resist: { id?: bigint, name?: string, type?: string }) {
        if (resist.id) {
            const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]) as CharResistance[];

            return !!results[0].deleted_at;
        }

        let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

        switch (resist.type) {
            case 'damagetype':
                dbResist = (await Server.dmgtypes.getOne(server, { name: resist.name })).dmgtype;
            break;
            case 'condition':
                dbResist = (await Server.conditions.getOne(server, { name: resist.name })).condition;
            break;
        }

        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND resist_id = $2', [char.id, dbResist.id]) as CharResistance[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, char: { id: bigint }, resist: AddCharResistance) {
        if (await this.exists(server, char, resist)) throw new DuplicateError('Duplicate Character Resistance', 'That Resistance is already linked to that Character!');

        if (!resist.resist_id) {
            let dbResist: { id: bigint; name: string } = { id: BigInt(0), name: '' };

            switch (resist.type) {
                case 'damagetype':
                    dbResist = (await Server.dmgtypes.getOne(server, { name: resist.name })).dmgtype;
                break;
                case 'condition':
                    dbResist = (await Server.conditions.getOne(server, { name: resist.name })).condition;
                break;
            }

            resist.resist_id = dbResist.id;
        }

        const sql = 'INSERT INTO character_resistances (char_id, type, resist_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, resist.type, resist.resist_id]);

        return 'Successfully added Resistance to Character in Database';
    }

    static async remove(server: Guild, char: { id: bigint }, resist: { id: bigint }) {
        if (!(await this.exists(server, char, resist))) throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');

        if (await this.isDeleted(server, char, resist)) throw new BadRequestError('Character Resistance already deleted', 'That Resistance is already removed from that Character!');

        await query('DELETE FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]);

        return 'Successfully removed Resistance from Character in Database';
    }

    static async remove_final(server: Guild, char: { id: bigint }, resist: { id: bigint }) {
        if (!(await this.exists(server, char, resist))) throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');

        await query('DELETE FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]);

        return 'Successfully removed Resistance from Character in Database';
    }

    static async restore(server: Guild, char: { id: bigint }, resist: { id: bigint }) {
        if (!(await this.exists(server, char, resist))) throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');

        if (!(await this.isDeleted(server, char, resist))) throw new BadRequestError('Character Resistance not deleted', 'That Resistance is not removed from that Character!');

        await query('UPDATE character_resistances SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [null, char.id, resist.id]);

        return 'Successfully restored Resistance for Character in Database';
    }
}

export { CharacterResistance };
