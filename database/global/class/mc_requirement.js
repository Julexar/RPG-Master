import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors/index.js';
const query = psql.query;

class MCRequirement {
    static async getAll(clas) {
        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1', [clas.id]);

        if (results.length === 0) {
            throw new NotFoundError('No MC Requirements found', 'Could not find any MC Requirements in the Database!');
        }

        return results;
    }

    static async getOne(clas, req) {
        if (req.id) {
            const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND id = $2', [clas.id, req.id]);

            if (results.length === 0) {
                throw new NotFoundError('MC Requirement not found', 'Could not find that MC Requirement in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND stat_key = $2', [clas.id, req.stat_key]);

        if (results.length === 0) {
            throw new NotFoundError('MC Requirement not found', 'Could not find a MC Requirement with that Class ID and Level in the Database!');
        }

        return results[0];
    }

    static async exists(clas, req) {
        if (req.id) {
            const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND id = $2', [clas.id, req.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND stat_key = $2', [clas.id, req.stat_key]);

        return results.length === 1;
    }

    static async add(clas, req) {
        if (await this.exists(clas, req)) {
            throw new DuplicateError(
                'MC Requirement already exists',
                'A MC Requirement with that Class ID and Level already exists in the Database!'
            );
        }

        const sql = 'INSERT INTO mc_requirements (class_id, stat_key, value, either_or) VALUES($1, $2, $3, $4)';
        await query(sql, [clas.id, req.stat_key, req.value, req.either_or]);

        return 'Successfully added MC Requirement to the Database';
    }

    static async remove(clas, req) {
        if (!(await this.exists(clas, req))) {
            throw new NotFoundError('MC Requirement not found', 'Could not find that MC Requirement in the Database!');
        }

        const sql = 'DELETE FROM mc_requirements WHERE class_id = $1 AND id = $2';
        await query(sql, [clas.id, req.id]);

        return 'Successfully removed MC Requirement from the Database';
    }
}

export { MCRequirement };
