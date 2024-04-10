import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Sense } from '..';

interface DBRaceSense {
  id: number;
  race_id: number;
  sense: string;
  range: number;
}

export class RaceSense {
  static async getAll(race: { id: number }) {
    const results = await db.race_senses.findMany({ where: { race_id: race.id } });

    if (results.length === 0) throw new NotFoundError('No Race Senses found', 'Could not find any Race Senses in the Database!');

    return await Promise.all(
      results.map(async raceSense => {
        const dbSense = await Sense.getOne({ key: raceSense.sense });

        return {
          id: raceSense.id,
          race_id: race.id,
          sense: dbSense,
          range: raceSense.range
        }
      })
    )
  }

  static async getOne(race: { id: number }, sense: { id?: number, key?: string }) {
    if (sense.id) {
      const result = await db.race_senses.findUnique({ where: { race_id: race.id, id: sense.id } });

      if (!result) throw new NotFoundError('Race Sense not found', 'Could not find that Race Sense in the Database!');

      const dbSense = await Sense.getOne({ key: result.sense });
      
      return {
        id: result.id,
        race_id: race.id,
        sense: dbSense,
        range: result.range
      }
    }

    const dbSense = await Sense.getOne(sense);
    const result = await db.race_senses.findFirst({ where: { race_id: race.id, sense: dbSense.key } });

    if (!result) throw new NotFoundError('Race Sense not found', 'Could not find a Race Sense with that Key in the Database!');

    return {
      id: result.id,
      race_id: race.id,
      sense: dbSense,
      range: result.range
    }
  }

  static async exists(race: { id: number }, sense: { id?: number, key?: string }) {
    if (sense.id) {
      const result = await db.race_senses.findUnique({ where: { race_id: race.id, id: sense.id } });

      return !!result;
    }

    const dbSense = await Sense.getOne(sense);
    const result = await db.race_senses.findFirst({ where: { race_id: race.id, sense: dbSense.key } });

    return !!result;
  }

  static async add(race: { id: number }, sense: { key: string, range: number }) {
    if (await this.exists(race, sense)) throw new DuplicateError('Duplicate Race Sense', 'That Race Sense already exists in the Database!');

    await db.race_senses.create({ data: { race_id: race.id, sense: sense.key, range: sense.range } });

    return 'Successfully added Race Sense to Database';
  }

  static async remove(race: { id: number }, sense: { id: number }) {
    if (!await this.exists(race, sense)) throw new NotFoundError('Race Sense not found', 'Could not find that Race Sense in the Database!');

    await db.race_senses.delete({ where: { race_id: race.id, id: sense.id } });

    return 'Successfully removed Race Sense from Database';
  }

  static async update(race: { id: number }, sense: DBRaceSense) {
    if (!await this.exists(race, sense)) throw new NotFoundError('Race Sense not found', 'Could not find that Race Sense in the Database!');

    await db.race_senses.update({ data: { sense: sense.sense, range: sense.range }, where: { race_id: race.id, id: sense.id } });

    return 'Successfully updated Race Sense in Database';
  }
}