import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Armor } from '../global';
const query = psql.query;

class ServerArmor {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1', [server.id]);

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

    static async getOne(server, armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]);

            if (results.length === 0) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

            const dbArmor = await Armor.getOne({ id: results[0].armor_id });
            const servArmor = results[0];

            if (servArmor.deleted_at) throw new BadRequestError('Armor deleted', 'The Armor you are trying to view has been deleted!')

            return {
                id: servArmor.id,
                server_id: servArmor.server_id,
                armor: dbArmor,
                overwrites: servArmor.overwrites,
            };
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]);

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

    static async exists(server, armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]);

            return results.length === 1;
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]);

        return results.length === 1;
    }

    static async add(server, armor) {
        if (await this.exists(server, armor)) throw new DuplicateError('Duplicate Armor', 'That Armor already exists for that Server in the Database!');

        const dbArmor = await Armor.getOne({ name: armor.name });
        const sql = 'INSERT INTO server_armors (server_id, armor_id, overwrites) VALUES($1, $2, $3::JSON)';
        await query(sql, [server.id, dbArmor.id, armor.overwrites]);

        return 'Successfully added Armor to Server';
    }

    static async remove(server, armor) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        await query('UPDATE server_armors SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, armor.id]);

        return 'Successfully marked Armor as deleted in Server';
    }

    static async remove_final(server, armor) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        await query('DELETE FROM server_armors WHERE server_id = $1 AND id = $2', [server.id, armor.id]);

        return 'Successfully removed Armor from Server';
    }

    static async update(server, armor) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');

        const sql = 'UPDATE server_armors SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3';
        await query(sql, [armor.overwrites, server.id, armor.id]);

        return 'Successfully updated Armor';
    }

    static async restore(server, armor) {
        if (!(await this.exists(server, armor))) throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');
        
        if (!(await this.getOne(server, armor)).deleted_at) throw new BadRequestError('Armor not deleted', 'That Armor for that Server is not deleted!');

        const sql = 'UPDATE server_armors SET deleted_at = NULL WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, armor.id]);

        return 'Successfully restored Armor';
    }

    static async restore_all(server) {
        await query('UPDATE server_armors SET deleted_at = NULL WHERE server_id = $1', [server.id]);

        return 'Successfully restored all Armors';
    }
}

export { ServerArmor };
