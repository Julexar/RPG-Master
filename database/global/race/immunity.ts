import { prisma as db } from "../../prisma";
import { NotFoundError, DuplicateError } from "../../../custom/errors";

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
            results.map(async raceResist => {
                let dbResist: Resistance = { id: 0, name: '' };

                switch (raceResist.type) {
                    case 'condition':
                        dbResist = await db.conditions.findUnique({ where: { id: raceResist.immune_id } }) as Resistance;
                    break;
                    case 'dmgtype':
                        dbResist = await db.damagetypes.findUnique({ where: { id: raceResist.immune_id } }) as Resistance;
                    break;
                }

                return {
                    id: raceResist.id,
                    type: raceResist.type,
                    immune: dbResist
                }
            })
        )
    }

    static async getOne(race: { id: number }, immune: { id?: number, name?: string, type?: string }) {
        if (immune.id) {
            const result = await db.race_immunities.findUnique({ where: { race_id: race.id, id: immune.id } })

            if (!result) throw new NotFoundError('Race Immunity not found', 'Could not find that Race Immunity in the Database!');

            let dbResist: Resistance = { id: 0, name: '' };

            switch (result.type) {
                case 'condition':
                    dbResist = await db.conditions.findUnique({ where: { id: result.immune_id } }) as Resistance;
                break;
                case 'dmgtype':
                    dbResist = await db.damagetypes.findUnique({ where: { id: result.immune_id } }) as Resistance;
                break;
            }

            return {
                id: result.id,
                type: result.type,
                immune: dbResist
            }
        }

        const result = await db.race_immunities.findFirst({ where: { race_id: race.id, immune_id: immune.id, type: immune.type } })

        if (!result) throw new NotFoundError('Race Immunity not found', 'Could not find a Race Immunity with that Name in the Database!');

        let dbResist: Resistance = { id: 0, name: '' };

        switch (result.type) {
            case 'condition':
                dbResist = await db.conditions.findUnique({ where: { id: result.immune_id } }) as Resistance;
            break;
            case 'dmgtype':
                dbResist = await db.damagetypes.findUnique({ where: { id: result.immune_id } }) as Resistance;
            break;
        }

        return {
            id: result.id,
            type: result.type,
            immune: dbResist
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