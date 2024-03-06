import { psql } from "../psql";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const { query } = psql;

interface DBFeat {
    id: number;
    name: string;
    description: string;
    prerequisites: JSON;
    options: JSON;
}

interface AddFeat {
    name: string;
    description: string;
    prerequisites: JSON;
    options: JSON;
}

export class Feat {
    static async getAll() {
        const results = await query('SELECT * FROM feats') as DBFeat[];

        if (results.length === 0) throw new NotFoundError('No Feat found', 'Could not find any Feats in the Database!');

        return results;
    }

    static async getOne(feat: { id?: number, name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM feats WHERE id = $1', [feat.id]) as DBFeat[];

            if (results.length === 0) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

            return results[0];
        }

        const results = await query('SELECT * FROM feats WHERE name = $1', [feat.name]) as DBFeat[];

        if (results.length === 0) throw new NotFoundError('Feat not found', 'Could not find a Feat with that Name in the Database!');

        return results[0];
    }

    static async exists(feat: { id?: number, name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM feats WHERE id = $1', [feat.id]) as DBFeat[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM feats WHERE name = $1', [feat.name]) as DBFeat[];

        return results.length === 1;
    }

    static async add(feat: AddFeat) {
        if (await this.exists(feat)) throw new DuplicateError('Feat already exists', 'A Feat with that Name already exists in the Database!');

        const sql = 'INSERT INTO feats (name, description, prerequisites, options) VALUES ($1, $2, $3::JSON, $4::JSON)';
        await query(sql, [feat.name, feat.description, JSON.stringify(feat.prerequisites), JSON.stringify(feat.options)]);

        return 'Successfully added Feat to the Database';
    }

    static async remove(feat: { id: number }) {
        if (!await this.exists(feat)) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

        await query('DELETE FROM feats WHERE id = $1', [feat.id]);

        return 'Successfully removed Feat from the Database';
    }

    static async update(feat: DBFeat) {
        if (!(await this.exists({ id: feat.id }))) throw new NotFoundError('Feat not found', 'Could not find that Feat in the Database!');

        const sql = 'UPDATE feats SET name = $1, description = $2, prerequisites = $3::JSON, options = $4::JSON WHERE id = $5';
        await query(sql, [feat.name, feat.description, JSON.stringify(feat.prerequisites), JSON.stringify(feat.options), feat.id]);

        return 'Successfully updated Feat in Database';
    }
}