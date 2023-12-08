import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class Feats {
    static async getAll(server) {
        const results = await this.query('SELECT * FROM feats WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Feats found', 'Could not find any Feats in the Database!');
        }

        return results;
    }

    static async getOne(server, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
            }

            return results[0];
        }

        const results = await this.query('SELECT * FROM feats WHERE server_id = $1 AND name = $2', [server.id, feat.name]);

        if (results.length === 0) {
            throw new NotFoundError('Feat not found', 'Could not find a Feat with that name in the Database!');
        }

        return results[0];
    }

    static async exists(server, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

            return results.length === 1;
        }

        const results = await this.query('SELECT * FROM feats WHERE server_id = $1 AND name = $2', [server.id, feat.name]);

        return results.length === 1;
    }

    static async add(server, feat) {
        if (await this.exists(server, feat)) {
            throw new DuplicateError('Duplicate Feat', 'That Feat already exists in the Database!');
        }

        const sql = 'INSERT INTO feats (server_id, name, description, type, val1, val2, val3) VALUES($1, $2, $3, $4, $5, $6, $7)';
        await query(sql, [server.id, feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3]);

        return 'Successfully added Feat to Database';
    }

    static async remove(server, feat) {
        if (!(await this.exists(server, feat))) {
            throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
        }

        await query('DELETE FROM feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

        return 'Successfully removed Feat from Database';
    }

    static async update(server, feat) {
        if (!(await this.exists(server, feat))) {
            throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
        }

        const sql = 'UPDATE feats SET name = $1, description = $2, type = $3, val1 = $4, val2 = $5, val3 = $6 WHERE server_id = $7 AND id = $8';
        await query(sql, [feat.name, feat.description, feat.type, feat.val1, feat.val2, feat.val3, server.id, feat.id]);

        return 'Successfully updated Feat in Database';
    }
}

export { Feats };
