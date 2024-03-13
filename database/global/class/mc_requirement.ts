import { psql } from "../../psql";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
const { query } = psql;

interface DBRequirement {
    id: number;
    class_id: number;
    stat: string;
    value: number;
}

interface AddRequirement {
    stat: string;
    value: number;
}

export class MCRequirement {
    static async getAll(class_id: number) {
        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1', [class_id]) as DBRequirement[];

        if (results.length === 0) throw new NotFoundError('No Multiclass Requirements found', 'Could not find any Multiclass Requirements in the Database!');

        return results;
    }

    static async getOne(clas: { id: number }, req: { id?: number, stat?: string }) {
        if (req.id) {
            const results = await query('SELECT * FROM mc_requirements WHERE id = $1', [req.id]) as DBRequirement[];

            if (results.length === 0) throw new NotFoundError('Multiclass Requirement not found', 'Could not find that Multiclass Requirement in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND stat = $2', [clas.id, req.stat]) as DBRequirement[];

        if (results.length === 0) throw new NotFoundError('Multiclass Requirement not found', 'Could not find that Multiclass Requirement in the Database!');

        return results[0];
    }

    static async exists(clas: { id: number }, req: { id?: number, stat?: string }) {
        if (req.id) {
            const results = await query('SELECT * FROM mc_requirements WHERE id = $1', [req.id]) as DBRequirement[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM mc_requirements WHERE class_id = $1 AND stat = $2', [clas.id, req.stat]) as DBRequirement[];

        return results.length === 1;
    }

    static async add(clas: { id: number }, req: AddRequirement) {
        if (await this.exists(clas, { stat: req.stat })) throw new DuplicateError('Duplicate Multiclass Requirement', 'That Multiclass Requirement already exists in the Database!');

        const sql = 'INSERT INTO mc_requirements (class_id, stat, value) VALUES ($1, $2, $3)';
        await query(sql, [clas.id, req.stat, req.value]);

        return 'Successfully added Multiclass Requirement to Database';
    }

    static async remove(clas: { id: number }, req: { id: number }) {
        if (!await this.exists(clas, req)) throw new NotFoundError('Multiclass Requirement not found', 'Could not find that Multiclass Requirement in the Database!');

        const sql = 'DELETE FROM mc_requirements WHERE id = $1';
        await query(sql, [req.id]);

        return 'Successfully removed Multiclass Requirement from Database';
    }

    static async update(clas: { id: number }, req: { id: number, stat: string, value: number }) {
        if (!await this.exists(clas, req)) throw new NotFoundError('Multiclass Requirement not found', 'Could not find that Multiclass Requirement in the Database!');

        const sql = 'UPDATE mc_requirements SET stat = $1, value = $2 WHERE id = $3';
        await query(sql, [req.stat, req.value, req.id]);

        return 'Successfully updated Multiclass Requirement in Database';
    }
}