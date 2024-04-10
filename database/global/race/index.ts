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

class race {
  immunity: typeof RaceImmunity;
  lang: typeof RaceLanguage;
  prof: typeof RaceProficiency;
  resist: typeof RaceResistance;
  sense: typeof RaceSense;
  stats: typeof RaceStats;
  trait: typeof RaceTrait;
  constructor() {
    this.immunity = RaceImmunity;
    this.lang = RaceLanguage;
    this.prof = RaceProficiency;
    this.resist = RaceResistance;
    this.sense = RaceSense;
    this.stats = RaceStats;
    this.trait = RaceTrait;
  }

  async getAll() {
    const results = await db.races.findMany();

    if (results.length === 0) throw new NotFoundError('No Races found', 'Could not find any Races in the Database!');

    return await Promise.all(
      results.map(async dbRace => {
        const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
          await this.immunity.getAll(dbRace),
          await this.lang.getAll(dbRace),
          await this.prof.getAll(dbRace),
          await this.resist.getAll(dbRace),
          await this.sense.getAll(dbRace),
          await this.stats.getAll(dbRace),
          await this.trait.getAll(dbRace)
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

  async getOne(race: { id?: number, name?: string }) {
    if (race.id) {
      const result = await db.races.findUnique({ where: { id: race.id }});

      if (!result) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

      const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
        await this.immunity.getAll(result),
        await this.lang.getAll(result),
        await this.prof.getAll(result),
        await this.resist.getAll(result),
        await this.sense.getAll(result),
        await this.stats.getAll(result),
        await this.trait.getAll(result)
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

    const result = await db.races.findFirst({ where: { name: race.name } });

    if (!result) throw new NotFoundError('Race not found', 'Could not find a Race with that Name in the Database!');

    const [ RaceImmunes, RaceLangs, RaceProfs, RaceResists, RaceSenses, RaceStat, RaceTraits ] = await Promise.all([
      await this.immunity.getAll(result),
      await this.lang.getAll(result),
      await this.prof.getAll(result),
      await this.resist.getAll(result),
      await this.sense.getAll(result),
      await this.stats.getAll(result),
      await this.trait.getAll(result)
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

  async exists(race: { id?: number, name?: string }) {
    if (race.id) {
      const result = await db.races.findUnique({ where: { id: race.id }});

      return !!result
    }

    const result = await db.races.findFirst({ where: { name: race.name } });

    return !!result;
  }

  async add(race: AddRace) {
    if (await this.exists(race)) throw new DuplicateError('Duplicate Race', 'That Race already exists in the Database!');

    await db.races.create({ data: { ...race } });

    return 'Successfully added Race to Database';
  }

  async remove(race: { id: number }) {
    if (!await this.exists(race)) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

    await db.races.delete({ where: { id: race.id } });

    return 'Successfully removed Race from Database';
  }

  async update(race: DBRace) {
    if (!await this.exists(race)) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

    await db.races.update({ data: { name: race.name, description: race.description, source: race.source, size: race.size, speed: race.speed, has_feat: race.has_feat, has_subrace: race.has_subrace }, where: { id: race.id } });

    return 'Successfully updated Race in Database';
  }
}

export const Race = new race();