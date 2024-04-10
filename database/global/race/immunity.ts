import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";
import { Condition, Damagetype } from "..";

interface DBRaceImmunity {
    id: number;
    race_id: number;
    immune_id: number;
    type: string;
}

interface AddRaceImmunity {
    immune_id: number;
    type: string;
}

interface Resistance {
    id: number;
    name: string;
}

export class RaceImmunity {
    static async getAll(race: { id: number }) {
        const results = await db.race_immunities.findMany({ where: { race_id: race.id } });

        if (results.length === 0) throw new NotFoundError('No Race Immunities found', 'Could not find any Immunities for that Race in the Database!');

        return await Promise.all(
            results.map(async raceImmune => {
                const dbImmune = raceImmune.type === 'condition'
                ? await Condition.getOne({ id: raceImmune.immune_id })
                : await Damagetype.getOne({ id: raceImmune.immune_id })

                return {
                    id: raceImmune.id,
                    race_id: race.id,
                    immunity: dbImmune,
                    type: raceImmune.type
                }
            })
        )
    }

    static async getOne(race: { id: number }, immune: { id?: number, name?: string, type?: string }) {
        if (immune.id) {
            const result = await db.race_immunities.findUnique({ where: { race_id: race.id, id: immune.id } })

            if (!result) throw new NotFoundError('Race Immunity not found', 'Could not find that Race Immunity in the Database!');

            const raceImmune = result;
            const dbImmune = raceImmune.type === 'condition'
            ? await Condition.getOne({ id: raceImmune.immune_id })
            : await Damagetype.getOne({ id: raceImmune.immune_id })

            return {
                id: raceImmune.id,
                race_id: race.id,
                immunity: dbImmune,
                type: raceImmune.type
            }
        }

        const result = await db.race_immunities.findFirst({ where: { race_id: race.id, immune_id: immune.id, type: immune.type } })

        if (!result) throw new NotFoundError('Race Immunity not found', 'Could not find a Race Immunity with that Name in the Database!');

        const raceImmune = result;
        const dbImmune = raceImmune.type === 'condition'
        ? await Condition.getOne({ id: raceImmune.immune_id })
        : await Damagetype.getOne({ id: raceImmune.immune_id })

        return {
            id: raceImmune.id,
            race_id: race.id,
            immunity: dbImmune,
            type: raceImmune.type
        }
    }

    static async exists(race: { id: number }, immune: { id?: number, name?: string, type?: string }) {
        if (immune.id) {
            const result = await db.race_immunities.findUnique({ where: { race_id: race.id, id: immune.id } })

            return !!result;
        }

        const result = await db.race_immunities.findFirst({ where: { race_id: race.id, immune_id: immune.id, type: immune.type } })

        return !!result;
    }

    static async add(race: { id: number }, immune: AddRaceImmunity) {
        if (await this.exists(race, immune)) throw new DuplicateError('Duplicate Race Immunity', 'That Race Immunity already exists in the Database!');

        await db.race_immunities.create({ data: { race_id: race.id, ...immune } })

        return 'Successfully added Race Immunity to Database';
    }

    static async remove(race: { id: number }, immune: { id: number }) {
        if (!(await this.exists(race, immune))) throw new NotFoundError('Race Immunity not found', 'Could not find that Race Immunity in the Database!');

        await db.race_immunities.delete({ where: { id: immune.id } });

        return 'Successfully removed Race Immunity from Database';
    }

    static async update(race: { id: number }, immune: DBRaceImmunity) {
        if (!(await this.exists(race, immune))) throw new NotFoundError('Race Immunity not found', 'Could not find that Race Immunity in the Database!');

        await db.race_immunities.update({ where: { id: immune.id }, data: immune });

        return 'Successfully updated Race Immunity in Database';
    }
}