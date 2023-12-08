import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class Armor {
    static async getAll(server) {
        const results = await query('SELECT * FROM armors WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Armor found', 'Could not find any Armors in the Database!');
        }

        return results;
    }

    static async getOne(server, armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE server_id = $1 AND id = $2', [server.id, armor.id]);

            if (results.length === 0) {
                throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM armors WHERE server_id = $1 AND name = $2', [server.id, armor.name]);

        if (results.length === 0) {
            throw new NotFoundError('Armor not found', 'Could not find an Armor with that name in the Database!');
        }

        return results[0];
    }

    static async exists(server, armor) {
        if (armor.id) {
            const results = await query('SELECT * FROM armors WHERE server_id = $1 AND id = $2', [server.id, armor.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM armors WHERE server_id = $1 AND name = $2', [server.id, armor.name]);

        return results.length === 1;
    }

    static async add(server, armor) {
        if (await this.exists(server, armor)) {
            throw new DuplicateError('Duplicate Armor', 'That Armor already exists in the Database!');
        }

        const sql = 'INSERT INTO armors (server_id, name, description, type, rarity, dex_bonus, ac, str_req, magical, magic_bonus, attune, attune_req) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
        await query(sql, [server.id, armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req]);

        return 'Successfully added Armor to Database';
    }

    static async remove(server, armor) {
        if (!(await this.exists(server, armor))) {
            throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
        }

        await query('DELETE FROM armors WHERE server_id = $1 AND id = $2', [server.id, armor.id]);

        return 'Successfully removed Armor from Database';
    }

    static async update(server, armor) {
        if (!(await this.exists(server, armor))) {
            throw new NotFoundError('Armor not found', 'Could not find that Armor in the Database!');
        }

        const sql = 'UPDATE armors SET name = $1, description = $2, type = $3, rarity = $4, dex_bonus = $5, ac = $6, str_req = $7, magical = $8, magic_bonus = $9, attune = $10, attune_req = $11 WHERE server_id = $12 AND id = $13';
        await query(sql, [armor.name, armor.description, armor.type, armor.rarity, armor.dex_bonus, armor.ac, armor.str_req, armor.magical, armor.magic_bonus, armor.attune, armor.attune_req, server.id, armor.id]);

        return 'Successfully updated Armor in Database';
    }
}

export { Armor };
