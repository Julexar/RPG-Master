import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Stats } from '..';

interface DBRaceStat {
  id: number;
  race_id: number;
  p1_stat: string;
  p1_stat2: string | null;
  p2_stat: string;
}

interface AddRaceStat {
  p1_stat: string;
  p1_stat2: string | null;
  p2_stat: string;
}

export class RaceStats {
  static async getAll() {
    const results = await db.race_stats.findMany();

    if (results.length === 0) throw new NotFoundError('No Race Stats found', 'Could not find any Race Stats in the Database!');

    return await Promise.all(
      results.map(async raceStat => {
        const dbStat1 = await Stats.getOne({ key: raceStat.p1_stat as string })
        const dbStat1_2 = await Stats.getOne({ key: raceStat.p1_stat2 ? raceStat.p1_stat2 as string : undefined })
        const dbStat2 = await Stats.getOne({ key: raceStat.p2_stat as string })

        return {
          id: raceStat.id,
          race_id: raceStat.race_id,
          p1_stat: dbStat1,
          p1_stat2: dbStat1_2,
          p2_stat: dbStat2
        }
      })
    )
  }

  static async getOne(race: { id: number }, stat: { name: string }) {
    const result = await db.race_stats.findFirst({ where: { race_id: race.id, OR: [ { p1_stat: stat.name }, { p1_stat2: stat.name }, { p2_stat: stat.name } ] } });

    if (!result) throw new NotFoundError('Race Stat not found', 'Could not find a Race Stat with that Name in the Database!');

    const dbStat1 = await Stats.getOne({ key: result.p1_stat as string })
    const dbStat1_2 = await Stats.getOne({ key: result.p1_stat2 ? result.p1_stat2 as string : undefined })
    const dbStat2 = await Stats.getOne({ key: result.p2_stat as string })

    return {
      id: result.id,
      race_id: race.id,
      p1_stat: dbStat1,
      p1_stat2: dbStat1_2,
      p2_stat: dbStat2
    }
  }

  static async exists(race: { id: number }) {
    const result = await db.race_stats.findFirst({ where: { race_id: race.id } });

    return !!result;
  }

  static async add(race: { id: number }, stat: AddRaceStat) {
    if (await this.exists(race)) throw new DuplicateError('Duplicate Race Stats', 'That Race already has Stats in the Database!');

    await db.race_stats.create({ data: { race_id: race.id, ...stat } });

    return 'Successfully added Race Stats to Database';
  }

  static async remove(race: { id: number }, stat: { id: number }) {
    if (!await this.exists(race)) throw new NotFoundError('No Race Stats found', 'Could not find any Race Stats in the Database!');

    await db.race_stats.delete({ where: { race_id: race.id, id: stat.id } });

    return 'Successfully removed Race Stats from Database';
  }

  static async update(race: { id: number }, stat: DBRaceStat) {
    if (!await this.exists(race)) throw new NotFoundError('No Race Stats found', 'Could not find any Race Stats in the Database!');

    await db.race_stats.update({ data: { p1_stat: stat.p1_stat, p1_stat2: stat.p1_stat2, p2_stat: stat.p2_stat }, where: { race_id: race.id, id: stat.id } });

    return 'Successfully updated Race Stats in Database';
  }
}