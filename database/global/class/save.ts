import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { Stats } from "..";

interface DBClassSave {
    id: number;
    class_id: number;
    stat: string;
}

interface AddClassSave {
    stat: string;
    level: number;
}

export class ClassSave {
    static async getAll(clas: { id: number }) {
        const results = await db.class_saves.findMany({ where: { class_id: clas.id } })

        if (results.length === 0) throw new NotFoundError('No Class Saves found', 'Could not find any Class Saves in the Database!');

        return await Promise.all(
            results.map(async (dbClasSave) => {
                const dbStat = await Stats.getOne({ key: dbClasSave.stat });

                return {
                    id: dbClasSave.id,
                    class_id: clas.id,
                    stat: dbStat
                }
            })
        );
    }

    static async getOne(clas: { id: number }, save: { id?: number, stat?: string }) {
        if (save.id) {
            const result = await db.class_saves.findUnique({ where: { id: save.id } });

            if (!result) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

            const clasSave = result;
            const dbStat = await Stats.getOne({ key: clasSave.stat });

            return {
                id: clasSave.id,
                class_id: clas.id,
                stat: dbStat
            }
        }

        const result = await db.class_saves.findFirst({ where: { class_id: clas.id, stat: save.stat } });

        if (!result) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        const clasSave = result;
        const dbStat = await Stats.getOne({ key: clasSave.stat });

        return {
            id: clasSave.id,
            class_id: clas.id,
            stat: dbStat
        }
    }

    static async exists(clas: { id: number }, save: { id?: number, stat?: string }) {
        if (save.id) {
            const result = await db.class_saves.findUnique({ where: { id: save.id } });

            return !!result;
        }

        const result = await db.class_saves.findFirst({ where: { class_id: clas.id, stat: save.stat } });

        return !!result;
    }

    static async add(clas: { id: number }, save: AddClassSave) {
        if (await this.exists(clas, save)) throw new DuplicateError('Duplicate Class Save', 'That Class Save already exists in the Database!');

        await db.class_saves.create({ data: { class_id: clas.id, ...save } });

        return 'Successfully added Class Save to Database';
    }

    static async remove(clas: { id: number }, save: { id: number }) {
        if (!await this.exists(clas, save)) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        await db.class_saves.delete({ where: { class_id: clas.id, id: save.id } });

        return 'Successfully removed Class Save fromDatabase';
    }

    static async update(clas: { id: number }, save: DBClassSave) {
        if (!await this.exists(clas, save)) throw new NotFoundError('Class Save not found', 'Could not find that Class Save in the Database!');

        await db.class_saves.update({ where: { class_id: clas.id, id: save.id }, data: { ...save } });

        return 'Successfully updated Class Save in Database';
    }
}