import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Condition, Damagetype } from '..';

interface DBRaceResist {
  id: number;
  race_id: number;
  resist_id: number;
  type: string;
}

export class RaceResistance {
  static async getAll(race: { id: number }) {
    const results = await db.race_resistances.findMany({ where: { race_id: race.id } });

    if (results.length === 0) throw new NotFoundError('No Race Resistances found', 'Could not find any Race Resistances in the Database!');

    return await Promise.all(
      results.map(async raceResist => {
        const dbResist = raceResist.type === 'condition'
        ? await Condition.getOne({ id: raceResist.resist_id })
        : await Damagetype.getOne({ id: raceResist.resist_id })

        return {
          id: raceResist.id,
          race_id: race.id,
          resistance: dbResist,
          type: raceResist.type
        }
      })
    )
  }

  static async getOne(race: { id: number }, resist: { id?: number, name?: string, type?: string }) {
    if (resist.id) {
      const result = await db.race_resistances.findUnique({ where: { race_id: race.id, id: resist.id } });

      if (!result) throw new NotFoundError('Race Resistance not found', 'Could not find that Race Resistance in the Database!');

      const dbResist = result.type === 'condition'
      ? await Condition.getOne({ id: result.resist_id })
      : await Damagetype.getOne({ id: result.resist_id })

      return {
        id: result.id,
        race_id: race.id,
        resistance: dbResist,
        type: result.type
      }
    }

    const dbResist = resist.type === 'condition'
    ? await Condition.getOne({ name: resist.name })
    : await Damagetype.getOne({ name: resist.name })

    const result = await db.race_resistances.findFirst({ where: { race_id: race.id, resist_id: dbResist.id } });

    if (!result) throw new NotFoundError('Race Resistance not found', 'Could not find a Race Resistance with that Name in the Database!');

    return {
      id: result.id,
      race_id: race.id,
      resistance: dbResist,
      type: result.type
    }
  }

  static async exists(race: { id: number }, resist: { id?: number, name?: string, type?: string }) {
    if (resist.id) {
      const result = await db.race_resistances.findUnique({ where: { race_id: race.id, id: resist.id } });

      return !!result;
    }

    const dbResist = resist.type === 'condition'
    ? await Condition.getOne({ name: resist.name })
    : await Damagetype.getOne({ name: resist.name })

    const result = await db.race_resistances.findFirst({ where: { race_id: race.id, resist_id: dbResist.id } });

    return !!result;
  }

  static async add(race: { id: number }, resist: { name: string, type: string }) {
    if (await this.exists(race, resist)) throw new DuplicateError('Duplicate Race Resistance', 'That Race Resistance already exists in the Database!');

    const dbResist = resist.type === 'condition'
    ? await Condition.getOne({ name: resist.name })
    : await Damagetype.getOne({ name: resist.name })

    await db.race_resistances.create({ data: { race_id: race.id, resist_id: dbResist.id, type: resist.type } });

    return 'Successfully added Race Resistance to Database';
  }

  static async remove(race: { id: number }, resist: { id: number }) {
    if (!await this.exists(race, resist)) throw new NotFoundError('Race Resistance not found', 'Could not find that Race Resistance in the Database!');

    await db.race_resistances.delete({ where: { race_id: race.id, id: resist.id } });

    return 'Successfully removed Race Resistance from Database';
  }

  static async update(race: { id: number }, resist: DBRaceResist) {
    if (!await this.exists(race, resist)) throw new NotFoundError('Race Resistance not found', 'Could not find that Race Resistance in the Database!');

    await db.race_resistances.update({ data: { resist_id: resist.resist_id, type: resist.type }, where: { race_id: race.id, id: resist.id } });

    return 'Successfully updated Race Resistance in Database';
  }
}