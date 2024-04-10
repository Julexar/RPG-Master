import { prisma as db } from '../../prisma';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';

export class RaceProficiency {
  static async getAll(race: { id: number }) {
    const results = await db.race_proficiencies.findMany({ where: { race_id: race.id } });

    if (results.length === 0) throw new NotFoundError('No Race Proficiencies found', 'Could not find any Race Proficiencies in the Database!');

    return await Promise.all(
      results.map(async raceProf => {
        const dbProf = await Proficiency.getOne({ type: raceProf.type });

        return {
          id: raceProf.id,
          race_id: raceProf.race_id,
          name: raceProf.name,
          type: dbProf,
          expert: raceProf.expert
        }
      })
    )
  }

  static async getOne(race: { id: number }, prof: { id?: number, name?: string }) {
    if (prof.id) {
      const result = await db.race_proficiencies.findUnique({ where: { race_id: race.id, id: prof.id } });

      if (!result) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

      const raceProf = result;
      const dbProf = await Proficiency.getOne({ type: raceProf.type });

      return {
        id: raceProf.id,
        race_id: raceProf.race_id,
        name: raceProf.name,
        type: dbProf,
        expert: raceProf.expert
      }
    }

    const result = await db.race_proficiencies.findFirst({ where: { race_id: race.id, name: prof.name } });

    if (!result) throw new NotFoundError('Race Proficiency not found', 'Could not find a Race Proficiency with that Name in the Database!');

    const raceProf = result;
    const dbProf = await Proficiency.getOne({ type: raceProf.type });

    return {
      id: raceProf.id,
      race_id: raceProf.race_id,
      name: raceProf.name,
      type: dbProf,
      expert: raceProf.expert
    }
  }

  static async exists(race: { id: number }, prof: { id?: number, name?: string }) {
    if (prof.id) {
      const result = await db.race_proficiencies.findUnique({ where: { race_id: race.id, id: prof.id } });

      return !!result;
    }

    const result = await db.race_proficiencies.findFirst({ where: { race_id: race.id, name: prof.name } });

    return !!result;
  }

  static async add(race: { id: number }, prof: { type: string, name: string, expert: boolean }) {
    if (await this.exists(race, prof)) throw new DuplicateError('Duplicate Race Proficiency', 'That Race Proficiency already exists in the Database!');

    await db.race_proficiencies.create({ data: { race_id: race.id, ...prof } });

    return 'Successfully added Race Proficiency to Database';
  }

  static async remove(race: { id: number }, prof: { id: number }) {
    if (!await this.exists(race, prof)) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

    await db.race_proficiencies.delete({ where: { race_id: race.id, id: prof.id }});

    return 'Successfully removed Race Proficiency from Database';
  }

  static async update(race: { id: number }, prof: { id: number, type: string, name: string, expert: boolean }) {
    if (!await this.exists(race, prof)) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

    await db.race_proficiencies.update({ data: { name: prof.name, type: prof.type, expert: prof.expert }, where: { race_id: race.id, id: prof.id } });

    return 'Successfully updated Race Proficiency in Database';
  }
}