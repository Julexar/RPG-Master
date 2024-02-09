import { Guild } from "discord.js";
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Armor } from '..';
const query = psql.query;

interface DBServerArmor {
    id: bigint;
    server_id: bigint;
    armor_id: bigint;
    overwrites: JSON;
    deleted_at: Date | null;
}

interface AddArmor {
    armor_id?: bigint;
    name?: string;
    overwrites: JSON;
}

class ServerArmor {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1', [server.id]) as DBServerArmor[];

        if (results.length === 0) throw new NotFoundError('No Armor found', 'Could not find any Armors for that Server in the Database!');

        return Promise.all(
            results.map(async (servArmor) => {
                const dbArmor = await Armor.getOne({ id: servArmor.armor_id });

                if (servArmor.deleted_at) return;

                return {
                    id: servArmor.id,
                    server_id: servArmor.server_id,
                    armor: dbArmor,
                    overwrites: servArmor.overwrites,
                    deleted_at: servArmor.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, armor: { id?: bigint, name?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]) as DBServerArmor[];

            if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

            const dbArmor = await Armor.getOne({ id: results[0].armor_id });
            const servArmor = results[0];

            if (servArmor.deleted_at) throw new BadRequestError('Armor deleted', 'The Armor you are trying to view has been deleted!')

            return {
                id: servArmor.id,
                server_id: servArmor.server_id,
                armor: dbArmor,
                overwrites: servArmor.overwrites,
                deleted_at: servArmor.deleted_at
            };
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]) as DBServerArmor[];

        if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find an Armor with that name for that Server in the Database!');

        const servArmor = results[0];

        if (servArmor.deleted_at) throw new BadRequestError('Armor deleted', 'The Armor you are trying to view has been deleted!')

        return {
            id: servArmor.id,
            server_id: servArmor.server_id,
            armor: dbArmor,
            overwrites: servArmor.overwrites,
            deleted_at: servArmor.deleted_at
        };
    }

    static async exists(server: Guild, armor: { id?: bigint, name?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]) as DBServerArmor[];

            return results.length === 1;
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]) as DBServerArmor[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, armor: { id?: bigint, name?: string }) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]) as DBServerArmor[];

            return !!results[0].deleted_at;
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]) as DBServerArmor[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, armor: AddArmor) {
        if (await this.exists(server, armor)) throw new DuplicateError('Duplicate Armor', 'That Armor already exists for that Server in the Database!');

        const dbArmor = await Armor.getOne({ name: armor.name });
        const sql = 'INSERT INTO server_armors (server_id, armor_id, overwrites) VALUES($1, $2, $3::JSON)';
        await query(sql, [server.id, dbArmor.id, armor.overwrites]);

        return 'Successfully added Armor to Server';
    }

    static async remove(server: Guild, armor: { id: bigint }) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        if (await this.isDeleted(server, armor)) throw new BadRequestError('Armor deleted', 'The Server Armor you are trying to remove has already been deleted!');

        await query('UPDATE server_armors SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, armor.id]);

        return 'Successfully marked Armor as deleted in Server';
    }

    static async remove_final(server: Guild, armor: { id: bigint }) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        await query('DELETE FROM server_armors WHERE server_id = $1 AND id = $2', [server.id, armor.id]);

        return 'Successfully removed Armor from Server';
    }

    static async update(server: Guild, armor: DBServerArmor) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        if (await this.isDeleted(server, armor)) throw new BadRequestError('Armor deleted', 'The Armor you are trying to update has been deleted!');

        const sql = 'UPDATE server_armors SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3';
        await query(sql, [armor.overwrites, server.id, armor.id]);

        return 'Successfully updated Armor';
    }

    static async restore(server: Guild, armor: { id: bigint }) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');
        
        if (!await this.isDeleted(server, armor)) throw new BadRequestError('Armor not deleted', 'The Armor you are trying to restore has not been deleted!');

        const sql = 'UPDATE server_armors SET deleted_at = NULL WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, armor.id]);

        return 'Successfully restored Armor';
    }
}

export { ServerArmor };
