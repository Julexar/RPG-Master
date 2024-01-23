import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { Armor } from '../global';
const query = psql.query;

class ServerArmor {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Armor found', 'Could not find any Armors for that Server in the Database!');
        }

        return Promise.all(
            results.map(async (servArmor) => {
                const dbArmor = await Armor.getOne({ id: servArmor.armor_id });

                return {
                    id: servArmor.id,
                    server_id: servArmor.server_id,
                    armor_id: dbArmor.id,
                    name: dbArmor.name,
                    description: dbArmor.description,
                    type: dbArmor.type,
                    rarity: dbArmor.rarity,
                    dex_bonus: dbArmor.dex_bonus,
                    ac: dbArmor.ac,
                    str_req: dbArmor.str_req,
                    magical: dbArmor.magical,
                    magic_bonus: dbArmor.magic_bonus,
                    attune: dbArmor.attune,
                    attune_req: dbArmor.attune_req,
                };
            })
        );
    }

    static async getOne(server, armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, armor.id]);

            if (results.length === 0) {
                throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');
            }

            const dbArmor = await Armor.getOne({ id: results[0].armor_id });

            return {
                id: results[0].id,
                server_id: results[0].server_id,
                armor_id: dbArmor.id,
                name: dbArmor.name,
                description: dbArmor.description,
                type: dbArmor.type,
                rarity: dbArmor.rarity,
                dex_bonus: dbArmor.dex_bonus,
                ac: dbArmor.ac,
                str_req: dbArmor.str_req,
                magical: dbArmor.magical,
                magic_bonus: dbArmor.magic_bonus,
                attune: dbArmor.attune,
                attune_req: dbArmor.attune_req,
            };
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const results = await query('SELECT * FROM server_armors WHERE server_id = $1 AND armor_id = $2', [server.id, dbArmor.id]);

        if (results.length === 0) {
            throw new NotFoundError('Armor not found', 'Could not find an Armor with that name for that Server in the Database!');
        }

        const servArmor = results[0];

        return {
            id: servArmor.id,
            server_id: servArmor.server_id,
            armor_id: dbArmor.id,
            name: dbArmor.name,
            description: dbArmor.description,
            type: dbArmor.type,
            rarity: dbArmor.rarity,
            dex_bonus: dbArmor.dex_bonus,
            ac: dbArmor.ac,
            str_req: dbArmor.str_req,
            magical: dbArmor.magical,
            magic_bonus: dbArmor.magic_bonus,
            attune: dbArmor.attune,
            attune_req: dbArmor.attune_req,
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
        if (await this.exists(server, armor)) {
            throw new DuplicateError('Duplicate Armor', 'That Armor already exists for that Server in the Database!');
        }

        const dbArmor = await Armor.getOne({ name: armor.name });
        const sql = 'INSERT INTO server_armors (server_id, armor_id) VALUES($1, $2)';
        await query(sql, [server.id, dbArmor.id]);

        return 'Successfully added Armor to Server';
    }

    static async remove(server, armor) {
        if (!(await this.exists(server, armor))) {
            throw new NotFoundError('Armor not found', 'Could not find that Armor for that Server in the Database!');
        }

        const sql = 'DELETE FROM server_armors WHERE server_id = $1 AND id = $2';
        await query(sql, [server.id, armor.id]);

        return 'Successfully removed Armor from Server';
    }
}

export { ServerArmor };
