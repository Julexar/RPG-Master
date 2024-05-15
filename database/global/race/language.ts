import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Language } from '..';

export class RaceLanguage {
  static async getAll(race: { id: number }) {
    const results = await db.race_languages.findMany({ where: { race_id: race.id }});

    if (results.length === 0) throw new NotFoundError('No Race Languages found', 'Could not find any Race Languages in the Database!');

    return await Promise.all(
      results.map(async raceLang => {
        const dbLang = await Language.getOne({ id: raceLang.language_id });

        return {
          id: raceLang.id,
          race_id: race.id,
          language: dbLang
        }
      })
    )
  }

  static async getOne(race: { id: number }, lang: { id?: number, name?: string }) {
    if (lang.id) {
      const result = await db.race_languages.findUnique({ where: { race_id: race.id, id: lang.id } });

      if (!result) throw new NotFoundError('Race Language not found', 'Could not find that Race Language in the Database!');

      const raceLang = result;
      const dbLang = await Language.getOne({ id: raceLang.language_id });

      return {
        id: raceLang,
        race_id: race.id,
        language: dbLang
      }
    }

    const dbLang = await Language.getOne({ name: lang.name });
    const result = await db.race_languages.findFirst({ where: { race_id: race.id, language_id: dbLang.id } });

    if (!result) throw new NotFoundError('Race Language not found', 'Could not find a Race Language with that Name in the Database!');

    const raceLang = result;

    return {
      id: raceLang,
      race_id: race.id,
      language: dbLang
    }
  }

  static async exists(race: { id: number }, lang: { id?: number, name?: string }) {
    if (lang.id) {
      const result = await db.race_languages.findUnique({ where: { race_id: race.id, id: lang.id } });

      return !!result;
    }

    const dbLang = await Language.getOne({ name: lang.name });
    const result = await db.race_languages.findFirst({ where: { race_id: race.id, language_id: dbLang.id } });

    return !!result;
  }

  static async add(race: { id: number }, lang: { id?: number, name?: string }) {
    if (await this.exists(race, lang)) throw new DuplicateError('Duplicate Race Language', 'That Race Language already exists in the Database!');

    const dbLang = await Language.getOne(lang);
    await db.race_languages.create({ data: { race_id: race.id, language_id: dbLang.id } });

    return 'Successfully added Race Language to Database';
  }

  static async remove(race: { id: number }, lang: { id: number }) {
    if (!await this.exists(race, lang)) throw new NotFoundError('Race Language not found', 'Could not find that Race Language in the Database!');

    await db.race_languages.delete({ where: { race_id: race.id, id: lang.id } });

    return 'Successfully removed Race Language from Database';
  }

  static async update(race: { id: number }, lang: { id: number, name: string }) {
    if (!await this.exists(race, lang)) throw new NotFoundError('Race Language not found', 'Could not find that Race Language in the Database!');

    const dbLang = await Language.getOne({ name: lang.name });
    await db.race_languages.update({ where: { race_id: race.id, id: lang.id }, data: { language_id: dbLang.id } });

    return 'Successfully updated Race Language in Database';
  }
}