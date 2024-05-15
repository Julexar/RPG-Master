import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';

export class SubclassProficiency {
  static async getAll(clas: { id: number }) {
    const results = await db.class_proficiencies.findMany({ where: { class_id: clas.id } });

    if (results.length === 0) throw new NotFoundError('No Class Proficiencies found', 'Could not find any Class Proficiency in the Database!');

    return await Promise.all(
      results.map(async clasProf => {
        const dbProf = await Proficiency.getOne({ type: clasProf.type });

        return {
          id: clasProf.id,
          class_id: clas.id,
          name: clasProf.name,
          type: dbProf,
          expert: clasProf.expert
        }
      })
    )
  }

  static async getOne(clas: { id: number }, prof: { id?: number, name?: string }) {
    if (prof.id) {
      const result = await db.class_proficiencies.findUnique({ where: { class_id: clas.id, id: prof.id } });

      if (!result) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

      const dbProf = await Proficiency.getOne({ type: result.type });

      return {
        id: result.id,
        class_id: clas.id,
        name: result.name,
        type: dbProf,
        expert: result.expert
      }
    }

    const result = await db.class_proficiencies.findFirst({ where: { class_id: clas.id, name: prof.name } });

    if (!result) throw new NotFoundError('Class Proficiency not found', 'Could not find a Class Proficiency with that Name in the Database!');

    const dbProf = await Proficiency.getOne({ type: result.type });

    return {
      id: result.id,
      class_id: clas.id,
      name: result.name,
      type: dbProf,
      expert: result.expert
    }
  }

  static async exists(clas: { id: number }, prof: { id?: number, name?: string }) {
    if (prof.id) {
      const result = await db.class_proficiencies.findUnique({ where: { class_id: clas.id, id: prof.id } });

      return !!result;
    }

    const result = await db.class_proficiencies.findFirst({ where: { class_id: clas.id, name: prof.name } });

    return !!result;
  }

  static async create(clas: { id: number }, prof: { name: string, type: string, expert: boolean }) {
    const exists = await this.exists(clas, { name: prof.name });

    if (exists) throw new DuplicateError('Class Proficiency already exists', 'A Class Proficiency with that Name already exists in the Database!');

    await db.class_proficiencies.create({
      data: {
        class_id: clas.id,
        name: prof.name,
        type: prof.type,
        expert: prof.expert
      }
    });

    return 'Successfully added Class Proficiency to Database';
  }

  static async remove(clas: { id: number }, prof: { id: number }) {
    if (!await this.exists(clas, { id: prof.id })) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

    await db.class_proficiencies.delete({ where: { id: prof.id } });

    return 'Successfully removed Class Proficiency from Database';
  }

  static async update(clas: { id: number }, prof: { id: number, name: string, type: string, expert: boolean }) {
    if (!await this.exists(clas, { id: prof.id })) throw new NotFoundError('Class Proficiency not found', 'Could not find that Class Proficiency in the Database!');

    await db.class_proficiencies.update({
      where: { id: prof.id },
      data: {
        name: prof.name,
        type: prof.type,
        expert: prof.expert
      }
    });

    return 'Successfully updated Class Proficiency in Database';
  }
}