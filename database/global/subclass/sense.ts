import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Sense } from '..';

interface DBSubclassSense {
  id: number;
  sub_id: number;
  sense: string;
  range: number;
  add: boolean;
}

interface AddSubclassSense {
  key: string;
  range: number;
  add: boolean;
}

export class SubclassSense {
  static async getAll(sub: { id: number }) {
    const results = await db.subclass_senses.findMany({ where: { sub_id: sub.id } });

    if (results.length === 0) throw new NotFoundError('No Subclass Senses found', 'Could not find any Subclass Senses in the Database!');

    return await Promise.all(
      results.map(async subSense => {
        const dbSense = await Sense.getOne({ key: subSense.sense });

        return {
          id: subSense.id,
          sub_id: sub.id,
          sense: dbSense,
          range: subSense.range,
          add: subSense.add
        }
      })
    )
  }

  static async getOne(sub: { id: number }, sense: { id?: number, key?: string }) {
    if (sense.id) {
      const result = await db.subclass_senses.findUnique({ where: { sub_id: sub.id, id: sense.id } });

      if (!result) throw new NotFoundError('Subclass Sense not found', 'Could not find that Subclass Sense in the Database!');

      const dbSense = await Sense.getOne({ key: result.sense });
      
      return {
        id: result.id,
        sub_id: sub.id,
        sense: dbSense,
        range: result.range,
        add: result.add
      }
    }

    const dbSense = await Sense.getOne(sense);
    const result = await db.subclass_senses.findFirst({ where: { sub_id: sub.id, sense: dbSense.key } });

    if (!result) throw new NotFoundError('Subclass Sense not found', 'Could not find a Subclass Sense with that Key in the Database!');

    return {
      id: result.id,
      sub_id: sub.id,
      sense: dbSense,
      range: result.range,
      add: result.add
    }
  }

  static async exists(sub: { id: number }, sense: { id?: number, key?: string }) {
    if (sense.id) {
      const result = await db.subclass_senses.findUnique({ where: { sub_id: sub.id, id: sense.id } });

      return !!result;
    }

    const dbSense = await Sense.getOne(sense);
    const result = await db.subclass_senses.findFirst({ where: { sub_id: sub.id, sense: dbSense.key } });

    return !!result;
  }

  static async add(sub: { id: number }, sense: AddSubclassSense) {
    const dbSense = await Sense.getOne(sense);

    if (await SubclassSense.exists(sub, { key: dbSense.key })) throw new DuplicateError('Subclass Sense already exists', 'A Subclass Sense with that Key already exists in the Database!');

    return await db.subclass_senses.create({
      data: {
        sub_id: sub.id,
        sense: dbSense.key,
        range: sense.range,
        add: sense.add
      }
    });
  }

  static async remove(sub: { id: number }, sense: { id: number }) {
    if (!await this.exists(sub, sense)) throw new NotFoundError('Subclass Sense not found', 'Could not find that Subclass Sense in the Database!');

    await db.subclass_senses.delete({ where: { sub_id: sub.id, id: sense.id } });

    return 'Successfully removed Subclass Sense from Database'
  }

  static async update(sub: { id: number }, sense: DBSubclassSense) {
    const dbSense = await Sense.getOne(sense);

    if (await SubclassSense.exists(sub, { key: dbSense.key })) throw new DuplicateError('Subclass Sense already exists', 'A Subclass Sense with that Key already exists in the Database!');

    await db.subclass_senses.update({
      where: { id: sense.id },
      data: {
        sense: dbSense.key,
        range: sense.range,
        add: sense.add
      }
    });

    return 'Successfully updated Subclass Sense in Database';
  }
}