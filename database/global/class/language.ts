import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Language } from '..';

export class ClassLanguage {
  static async getAll(clas: { id: number }) {
    const results = await db.class_languages.findMany({ where: { class_id: clas.id } });

    if (results.length === 0) throw new NotFoundError('No Class Languages found', 'Could not find any Class Languages in the Database!');

    return await Promise.all(
      results.map(async clasLang => {
        const dbLang = await Language.getOne({ id: clasLang.language_id });

        return {
          id: clasLang.id,
          class_id: clasLang.class_id,
          language: dbLang
        };
      })
    );
  }

  static async getOne(clas: { id: number }, lang: { id?: number, name?: string }) {
    if (lang.id) {
      const result = await db.class_languages.findUnique({ where: { class_id: clas.id, id: lang.id } });

      if (!result) throw new NotFoundError('Class Language not found', 'Could not find that Class Language in the Database!');

      const clasLang = result;
      const dbLang = await Language.getOne({ id: clasLang.language_id });

      return {
        id: clasLang.id,
        class_id: clasLang.class_id,
        language: dbLang
      }
    }

    const dbLang = await Language.getOne({ name: lang.name });
    const result = await db.class_languages.findFirst({ where: { class_id: clas.id, language_id: dbLang.id } });

    if (!result) throw new NotFoundError('Class Language not found', 'Could not find a Class Language with that Name in the Database!');

    const clasLang = result;

    return {
      id: clasLang.id,
      class_id: clasLang.class_id,
      language: dbLang
    };
  }

  static async exists(clas: { id: number }, lang: { id?: number, name?: string }) {
    if (lang.id) {
      const result = await db.class_languages.findUnique({ where: { class_id: clas.id, id: lang.id } });

      return !!result;
    }

    const dbLang = await Language.getOne({ name: lang.name });
    const result = await db.class_languages.findFirst({ where: { class_id: clas.id, language_id: dbLang.id } });

    return !!result;
  }

  static async add(clas: { id: number }, lang: { id?: number, name?: string }) {
    if (await this.exists(clas, lang)) throw new DuplicateError('Class Language already exists', 'The Class Language already exists in the Database!');

    const dbLang = await Language.getOne(lang);
    await db.class_languages.create({ data: { class_id: clas.id, language_id: dbLang.id } });

    return 'Successfully added Class Language';
  }

  static async remove(clas: { id: number }, lang: { id: number }) {
    if (!await this.exists(clas, lang)) throw new NotFoundError('Class Language not found', 'Could not find that Class Language in the Database!');

    await db.class_languages.delete({ where: { id: lang.id } });

    return 'Successfully removed Class Language';
  }

  static async update(clas: { id: number }, lang: { id: number }) {
    if (!await this.exists(clas, lang)) throw new NotFoundError('Class Language not found', 'Could not find that Class Language in the Database!');

    const dbLang = await Language.getOne({ id: lang.id });
    await db.class_languages.update({ where: { id: lang.id }, data: { language_id: dbLang.id } });

    return 'Successfully updated Class Language';
  }
}