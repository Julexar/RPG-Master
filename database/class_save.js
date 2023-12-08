import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
const query = psql.query;

class ClassSave {
    static async getAll(clas) {
        const results = await query('SELECT * FROM class_saves WHERE class_id = $1', [clas.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Class Saves found', 'Could not find any Saves for that Class in the Database!');
        }

        return results;
    }

    static async getOne(clas, save) {
        if (save.id) {
            const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND id = $2', [clas.id, save.id]);

            if (results.length === 0) {
                throw new NotFoundError('Class Save not found', 'Could not find that Save for that Class in the Database!');
            }

            return results[0];
        }

        const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2', [clas.id, save.stat]);

        if (results.length === 0) {
            throw new NotFoundError('Class Save not found', 'That Class does not have a Save for that Stat!');
        }

        return results[0];
    }

    static async exists(clas, save) {
        if (save.id) {
            const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND id = $2', [clas.id, save.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2', [clas.id, save.stat]);

        return results.length === 1;
    }

    static async add(clas, save) {
        if (await this.exists(clas, save)) {
            throw new DuplicateError('Duplicate Class Save', 'That Class already has a Save for that Stat in the Database!');
        }

        const sql = 'INSERT INTO class_saves (class_id, stat, level) VALUES($1, $2, $3)';
        await query(sql, [clas.id, save.stat, save.level]);

        return 'Successfully added Class Save to Database';
    }

    static async remove(clas, save) {
        if (!(await this.exists(clas, save))) {
            throw new NotFoundError('Class Save not found', 'Could not find that Save for that Class in the Database!');
        }

        await query('DELETE FROM class_saves WHERE class_id = $1 AND id = $2', [clas.id, save.id]);

        return 'Successfully removed Class Save from Database';
    }

    static async update(clas, save) {
        if (!(await this.exists(clas, save))) {
            throw new NotFoundError('Class Save not found', 'Could not find that Save for that Class in the Database!');
        }

        const sql = 'UPDATE class_saves SET stat = $1, level = $2 WHERE class_id = $3 AND id = $4';
        await query(sql, [save.stat, save.level, clas.id, save.id]);

        return 'Successfully updated Class Save in Database';
    }
}

export { ClassSave };
