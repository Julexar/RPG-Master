import { prisma as db } from "../prisma";
import { NotFoundError, DuplicateError } from "../../custom/errors";
import { Source } from ".";

interface DBLanguage {
    id: number;
    name: string;
    source: string;
    type: string;
}

interface AddLanguage {
    name: string;
    source: string;
    type: string;
}

export class Language {
    static async getAll() {
        const results = await db.languages.findMany();

        if (results.length === 0) throw new NotFoundError('No Languages found', 'Could not find any Languages in the Database!');

        return await Promise.all(
            results.map(async dbLang => {
                const source = await Source.getOne({ abrv: dbLang.source });

                return {
                    id: dbLang.id,
                    name: dbLang.name,
                    source: source,
                    type: dbLang.type
                }
            })
        )
    }

    static async getOne(language: { id?: number, name?: string, source?: string }) {
        if (language.id) {
            const result = await db.languages.findUnique({ where: { id: language.id } });

            if (!result) throw new NotFoundError('Language not found', 'Could not find that Language in the Database!');

            const source = await Source.getOne({ abrv: result.source });

            return {
                id: result.id,
                name: result.name,
                source: source,
                type: result.type
            };
        }

        const result = await db.languages.findFirst({ where: { name: language.name, source: language.source } });

        if (!result) throw new NotFoundError('Language not found', 'Could not find that Language in the Database!');

        const source = await Source.getOne({ abrv: result.source });

        return {
            id: result.id,
            name: result.name,
            source: source,
            type: result.type
        };
    }

    static async exists(language: { id?: number, name?: string, source?: string }) {
        if (language.id) {
            const result = await db.languages.findUnique({ where: { id: language.id } });

            return !!result;
        }

        const result = await db.languages.findFirst({ where: { name: language.name, source: language.source } });

        return !!result;
    }

    static async add(language: AddLanguage) {
        if (await this.exists({ name: language.name, source: language.source })) throw new DuplicateError('Duplicate Language', 'That Language already exists in the Database!');

        const source = await Source.getOne({ abrv: language.source });

        await db.languages.create({
            data: {
                name: language.name,
                source: language.source,
                type: language.type
            }
        });

        return 'Successfully added Language to Database';
    }

    static async remove(language: { id: number }) {
        if (!await this.exists(language)) throw new NotFoundError('Language not found', 'Could not find that Language in the Database!');

        await db.languages.delete({ where: { id: language.id } });

        return 'Successfully removed Language from Database';
    }

    static async update(language: DBLanguage) {
        if (!await this.exists({ id: language.id })) throw new NotFoundError('Language not found', 'Could not find that Language in the Database!');

        await db.languages.update({
            where: { id: language.id },
            data: {
                name: language.name,
                source: language.source,
                type: language.type
            }
        });

        return 'Successfully updated Language in Database';
    }
}