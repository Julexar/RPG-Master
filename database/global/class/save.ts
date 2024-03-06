import { psql } from "../../psql";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { Stats } from "..";
const { query } = psql;

interface DBClassSave {
    id: number;
    class_id: number;
    stat: string;
    level: number;
}

interface AddClassSave {
    stat: string;
    level: number;
}

export class ClassSave {
    static async getAll(clas: { id: number }) {
        const results = await query('SELECT * FROM class_saves WHERE class_id = $1', [clas.id]) as DBClassSave[];

        if (results.length === 0) throw new NotFoundError('No Class Saves found', 'Could not find any Class Saves in the Database!');

        return await Promise.all(
            results.map(async (dbClasSave) => {
                const dbStat = await Stats.getOne({ key: dbClasSave.stat });

                return {
                    id: dbClasSave.id,
                    class_id: clas.id,
                    stat: dbStat,
                    level: dbClasSave.level
                }
            })
        );
    }

    static async getOne(clas: { id: number }, save: { id?: number, stat?: string }) {
        if (save.id) {
            const results = await query('SELECT * FROM class_saves WHERE id = $1', [save.id]) as DBClassSave[];

            if (results.length === 0) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

            const clasSave = results[0];
            const dbStat = await Stats.getOne({ key: clasSave.stat });

            return {
                id: clasSave.id,
                class_id: clas.id,
                stat: dbStat,
                level: clasSave.level
            }
        }

        const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2', [clas.id, save.stat]) as DBClassSave[];

        if (results.length === 0) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        const clasSave = results[0];
        const dbStat = await Stats.getOne({ key: clasSave.stat });

        return {
            id: clasSave.id,
            class_id: clas.id,
            stat: dbStat,
            level: clasSave.level
        }
    }

    static async exists(clas: { id: number }, save: { id?: number, stat?: string }) {
        if (save.id) {
            const results = await query('SELECT * FROM class_saves WHERE id = $1', [save.id]) as DBClassSave[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM class_saves WHERE class_id = $1 AND stat = $2', [clas.id, save.stat]) as DBClassSave[];

        return results.length === 1;
    }

    static async add(clas: { id: number }, save: AddClassSave) {
        if (await this.exists(clas, save)) throw new DuplicateError('Class Save already exists', 'That Class Save already exists in the Database!');

        const dbStat = await Stats.getOne({ key: save.stat });
        const sql = 'INSERT INTO class_saves (class_id, stat, level) VALUES ($1, $2, $3)';
        await query(sql, [clas.id, dbStat.key, save.level]);

        return 'Successfully added Class Save to the Database';
    }

    static async remove(clas: { id: number }, save: { id: number }) {
        if (!await this.exists(clas, save)) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        const sql = 'DELETE FROM class_saves WHERE id = $1';
        await query(sql, [save.id]);

        return 'Successfully removed Class Save from the Database';
    }

    static async update(clas: { id: number }, save: DBClassSave) {
        if (!await this.exists(clas, save)) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        const dbStat = await Stats.getOne({ key: save.stat });
        const sql = 'UPDATE class_saves SET stat = $1, level = $2 WHERE id = $3';
        await query(sql, [dbStat.key, save.level, save.id]);

        return 'Successfully updated Class Save in the Database';
    }
}