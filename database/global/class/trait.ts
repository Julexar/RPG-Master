import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

interface DBClassTrait {
    id: number;
    class_id: number;
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

interface AddClassTrait {
    name: string;
    description: string;
    visible: boolean;
    options: JSON;
}

export class ClassTrait {
    static async getAll(clas: { id: number }) {
        const results = await db.class_traits.findMany({ where: { class_id: clas.id } });

        if (results.length === 0) throw new NotFoundError('No Class Traits found', 'Could not find any Class Traits in the Database!');

        return results;
    }

    static async getOne(clas: { id: number }, trait: { id?: number, name?: string }) {
        if (trait.id) {
            const result = await db.class_traits.findUnique({ where: { id: trait.id } });

            if (!result) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

            return result;
        }

        const result = await db.class_traits.findFirst({ where: { class_id: clas.id, name: trait.name } });

        if (!result) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        return result;
    }

    static async exists(clas: { id: number }, trait: { id?: number, name?: string }) {
        if (trait.id) {
            const result = await db.class_traits.findUnique({ where: { id: trait.id } });

            return !!result;
        }

        const result = await db.class_traits.findFirst({ where: { class_id: clas.id, name: trait.name } });

        return !!result;
    }

    static async add(clas: { id: number }, trait: AddClassTrait) {
        if (await this.exists(clas, { name: trait.name })) throw new DuplicateError('Duplicate Class Trait', 'That Class Trait already exists in the Database!');

        await db.class_traits.create({
            data: {
                class_id: clas.id,
                name: trait.name,
                description: trait.description,
                visible: trait.visible,
                options: JSON.parse(JSON.stringify(trait.options))
            }
        });

        return 'Successfully added Class Trait to Database';
    }

    static async remove(clas: { id: number }, trait: { id: number }) {
        if (!await this.exists(clas, trait)) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        await db.class_traits.delete({ where: { id: trait.id } });

        return 'Successfully removed Class Trait from Database';
    }

    static async update(clas: { id: number }, trait: DBClassTrait) {
        if (!await this.exists(clas, { id: trait.id })) throw new NotFoundError('Class Trait not found', 'Could not find that Class Trait in the Database!');

        await db.class_traits.update({ 
            where: { id: trait.id }, 
            data: {
                name: trait.name,
                description: trait.description,
                visible: trait.visible,
                options: JSON.parse(JSON.stringify(trait.options))
            }
        });

        return 'Successfully updated Class Trait in Database';
    }
}