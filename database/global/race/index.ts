import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { RaceImmunity } from './immunity';
import { RaceLanguage } from './language';
import { RaceProficiency } from './proficiency';
import { RaceResistance } from './resistance';
import { RaceSense } from './sense';
import { RaceStats } from './stats';
import { RaceTrait } from './trait';
import { Source } from '..';

interface DBRace {
  id: number;
  name: string;
  description: string;
  source: string;
  size: string;
  speed: number;
  has_feat: boolean;
  has_subrace: boolean;
}

interface AddRace {
  name: string;
  description: string;
  source: string;
  size: string;
  speed: number;
  has_feat: boolean;
  has_subrace: boolean;
}

export class Race {
  static readonly immunity = RaceImmunity;
  static readonly langs = RaceLanguage;
  static readonly profs = RaceProficiency;
  static readonly resist = RaceResistance;
  static readonly senses = RaceSense;
  static readonly stats = RaceStats;
  static readonly traits = RaceTrait;

  static async getAll(source?: string) {
    if (!source) {
      const results = await db.races.findMany();

      if (results.length === 0) throw new NotFoundError('No Races found', 'Could not find any Races in the Database!');

      return await Promise.all(
        results.map(async dbRace => {
          const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
            await this.immunity.getAll(dbRace),
            await this.langs.getAll(dbRace),
            await this.profs.getAll(dbRace),
            await this.resist.getAll(dbRace),
            await this.senses.getAll(dbRace),
            await this.stats.getAll(dbRace),
            await this.traits.getAll(dbRace)
          ]);

          return {
            ...dbRace,
            immunity: RaceImmunes,
            langs: RaceLangs,
            profs: RaceProfs,
            resist: RaceResists,
            senses: RaceSenses,
            stats: RaceStat,
            traits: RaceTraits
          }
        })
      )
    }

    const dbSource = await Source.getOne({ abrv: source });
    const results = await db.races.findMany({ where: { source: dbSource.abrv } });

    if (results.length === 0) throw new NotFoundError('No Races found', 'Could not find any Races from that Source in the Database!');

    return await Promise.all(
      results.map(async dbRace => {
        const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
          await this.immunity.getAll(dbRace),
          await this.langs.getAll(dbRace),
          await this.profs.getAll(dbRace),
          await this.resist.getAll(dbRace),
          await this.senses.getAll(dbRace),
          await this.stats.getAll(dbRace),
          await this.traits.getAll(dbRace)
        ]);

        return {
          ...dbRace,
          immunity: RaceImmunes,
          langs: RaceLangs,
          profs: RaceProfs,
          resist: RaceResists,
          senses: RaceSenses,
          stats: RaceStat,
          traits: RaceTraits
        }
      })
    )
  }

  static async getOne(race: { id?: number, name?: string, source?: string }) {
    if (race.id) {
      const result = await db.races.findUnique({ where: { id: race.id }});

      if (!result) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

      const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
        await this.immunity.getAll(result),
        await this.langs.getAll(result),
        await this.profs.getAll(result),
        await this.resist.getAll(result),
        await this.senses.getAll(result),
        await this.stats.getAll(result),
        await this.traits.getAll(result)
      ]);

      return {
        ...result,
        immunity: RaceImmunes,
        langs: RaceLangs,
        profs: RaceProfs,
        resist: RaceResists,
        senses: RaceSenses,
        stats: RaceStat,
        traits: RaceTraits
      }
    }

    const dbSource = await Source.getOne({ abrv: race.source });
    const result = await db.races.findFirst({ where: { name: race.name, source: dbSource.abrv } });

    if (!result) throw new NotFoundError('Race not found', 'Could not find a Race with that Name in the Database!');

    const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
      await this.immunity.getAll(result),
      await this.langs.getAll(result),
      await this.profs.getAll(result),
      await this.resist.getAll(result),
      await this.senses.getAll(result),
      await this.stats.getAll(result),
      await this.traits.getAll(result)
    ]);

    return {
      ...result,
      immunity: RaceImmunes,
      langs: RaceLangs,
      profs: RaceProfs,
      resist: RaceResists,
      senses: RaceSenses,
      stats: RaceStat,
      traits: RaceTraits
    }
  }

  static async exists(race: { id?: number, name?: string, source?: string }) {
    if (race.id) {
      const result = await db.races.findUnique({ where: { id: race.id }});

      return !!result
    }

    const dbSource = await Source.getOne({ abrv: race.source });
    const result = await db.races.findFirst({ where: { name: race.name, source: dbSource.abrv } });

    return !!result;
  }

  static async add(race: AddRace) {
    if (await this.exists(race)) throw new DuplicateError('Duplicate Race', 'That Race already exists in the Database!');

    await db.races.create({ data: { ...race } });

    return 'Successfully added Race to Database';
  }

  static async remove(race: { id: number }) {
    if (!await this.exists(race)) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

    await db.races.delete({ where: { id: race.id } });

    return 'Successfully removed Race from Database';
  }

  static async update(race: DBRace) {
    if (!await this.exists(race)) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

    await db.races.update({ data: { name: race.name, description: race.description, source: race.source, size: race.size, speed: race.speed, has_feat: race.has_feat, has_subrace: race.has_subrace }, where: { id: race.id } });

    return 'Successfully updated Race in Database';
  }
}