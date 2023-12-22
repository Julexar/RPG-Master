import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class Feats {
    static async getAll() {
        const results = await query('SELECT * FROM feats');

        if (results.length === 0) {
            throw new NotFoundError('No Feats found', 'Could not find any Feats in the Database!');
        }

        return results;
    }

    static async getOne(feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM feats WHERE id = $1', [feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM feats WHERE name = $1', [feat.name]);

        if (results.length === 0) {
            throw new NotFoundError('Feat not found', 'Could not find a Feat with that name in the Database!');
        }

        return results[0];
    }

    static async exists(feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM feats WHERE id = $1', [feat.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM feats WHERE name = $1', [feat.name]);

        return results.length === 1;
    }

    static async add(feat) {
        if (await this.exists(feat)) {
            throw new DuplicateError('Duplicate Feat', 'That Feat already exists in the Database!');
        }

        const sql = 'INSERT INTO feats (name, description, type, option) VALUES($1, $2, $3, $4)';
        await query(sql, [feat.name, feat.description, feat.type, feat.option]);

        return 'Successfully added Feat to Database';
    }

    static async remove(feat) {
        if (!(await this.exists(feat))) {
            throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
        }

        await query('DELETE FROM feats WHERE id = $1', [feat.id]);

        return 'Successfully removed Feat from Database';
    }

    static async update(feat) {
        if (!(await this.exists(feat))) {
            throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');
        }

        const sql = 'UPDATE feats SET name = $1, description = $2, type = $3, option = $4 WHERE id = $5';
        await query(sql, [feat.name, feat.description, feat.type, feat.option, feat.id]);

        return 'Successfully updated Feat in Database';
    }
}

export { Feats };
