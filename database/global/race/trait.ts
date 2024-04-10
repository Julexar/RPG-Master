import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';

interface DBRaceTrait {
  id: number;
  race_id: number;
  name: string;
  description: string;
  visible: boolean;
  options: JSON;
}

interface AddRaceTrait {
  name: string;
  description: string;
  visible: boolean;
  options: JSON;
}

export class RaceTrait {
  static async getAll(race: { id: number }) {
    const results = await db.race_traits.findMany({ where: { race_id: race.id } });

    if (results.length === 0) throw new NotFoundError('No Race Traits found', 'Could not find any Race Traits in the Database!');

    return results;
  }

  static async getOne(race: { id: number }, trait: { id?: number, name?: string }) {
    if (trait.id) {
      const result = await db.race_traits.findUnique({ where: { race_id: race.id, id: trait.id } });

      if (!result) throw new NotFoundError('Race Trait not found', 'Could not find that Race Trait in the Database!');

      return result;
    }

    const result = await db.race_traits.findFirst({ where: { race_id: race.id, name: trait.name } });

    if (!result) throw new NotFoundError('Race Trait not found', 'Could not find a Race Trait with that Name in the Database!');

    return result;
  }

  static async exists(race: { id: number }, trait: { id?: number, name?: string }) {
    if (trait.id) {
      const result = await db.race_traits.findUnique({ where: { race_id: race.id, id: trait.id } });

      return !!result;
    }

    const result = await db.race_traits.findFirst({ where: { race_id: race.id, name: trait.name } });

    return !!result;
  }

  static async add(race: { id: number }, trait: AddRaceTrait) {
    if (await this.exists(race, trait)) throw new DuplicateError('Duplicate Race Trait', 'That Race Trait already exists in the Database!');

    await db.race_traits.create({ data: { race_id: race.id, name: trait.name, description: trait.description, visible: trait.visible, options: JSON.stringify(trait.options) } });

    return 'Successfully added Race Trait to Database';
  }

  static async remove(race: { id: number }, trait: { id: number }) {
    if (!await this.exists(race, trait)) throw new NotFoundError('Race Trait not found', 'Could not find that Race Trait in the Database!');

    await db.race_traits.delete({ where: { race_id: race.id, id: trait.id } });

    return 'Successfully removed Race Trait from Database';
  }

  static async update(race: { id: number }, trait: DBRaceTrait) {
    if (!await this.exists(race, trait)) throw new NotFoundError('Race Trait not found', 'Could not find that Race Trait in the Database!');

    await db.race_traits.update({ data: { name: trait.name, description: trait.description, visible: trait.visible, options: JSON.stringify(trait.options) }, where: { race_id: race.id, id: trait.id } });

    return 'Successfully updated Race Trait in Database';
  }
}