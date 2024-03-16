import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Condition, Damagetype } from '..';
const query = psql.query;

interface DBRaceImmunity {
    id: bigint;
    race_id: bigint;
    immune_id: bigint;
    type: string;
}

interface AddImmunity {
    immune_id: bigint;
    type: string;
}

class RaceImmunity {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1', [race.id]) as DBRaceImmunity[];

        if (results.length === 0) throw new NotFoundError('No Race Immunities found', 'Could not find any Immunities for that Race in the Database!');

        return Promise.all(
            results.map(async (raceImmune) => {
                let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

                switch (raceImmune.type) {
                    case 'damagetype':
                        dbImmune = await Damagetype.getOne({ id: raceImmune.immune_id });
                    break;
                    case 'condition':
                        dbImmune = await Condition.getOne({ id: raceImmune.immune_id });
                    break;
                }

                return {
                    id: raceImmune.id,
                    race_id: race.id,
                    type: raceImmune.type,
                    immunity: dbImmune
                };
            })
        );
    }

    static async getOne(race: { id: bigint }, immune: { id?: bigint, name?: string, type: string }) {
        if (immune.id) {
            const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]) as DBRaceImmunity[];

            if (results.length === 0) throw new NotFoundError('Race Immunity not found', 'Could not find that Immunity for that Race in the Database!');

            const raceImmune = results[0];
            let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

            switch (raceImmune.type) {
                case 'damagetype':
                    dbImmune = await Damagetype.getOne({ id: raceImmune.immune_id });
                break;
                case 'condition':
                    dbImmune = await Condition.getOne({ id: raceImmune.immune_id });
                break;
            }

            return {
                id: raceImmune.id,
                race_id: race.id,
                type: raceImmune.type,
                immunity: dbImmune
            };
        }

        let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

        switch (immune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne({ name: immune.name });
            break;
            case 'condition':
                dbImmune = await Condition.getOne({ name: immune.name });
            break;
        }

        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2', [race.id, dbImmune.id]) as DBRaceImmunity[];

        if (results.length === 0) throw new NotFoundError('Race Immunity not found', 'Could not find an Immunity with that name for that Race in the Database!');

        const raceImmune = results[0];

        return {
            id: raceImmune.id,
            race_id: race.id,
            type: raceImmune.type,
            immunity: dbImmune
        };
    }

    static async exists(race: { id: bigint }, immune: { id?: bigint, name?: string, type: string }) {
        if (immune.id) {
            const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]) as DBRaceImmunity[];

            return results.length === 1;
        }

        let dbImmune: {id: bigint, name: string} = {id: BigInt(0), name: ''};

        switch (immune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne({ name: immune.name });
            break;
            case 'condition':
                dbImmune = await Condition.getOne({ name: immune.name });
            break;
        }

        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2', [race.id, dbImmune.id]) as DBRaceImmunity[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, immune: AddImmunity) {
        if (await this.exists(race, immune)) throw new DuplicateError('Duplicate Race Immunity', 'That Race already has that Immunity in the Database!');

        const sql = 'INSERT INTO race_immunities (race_id, immune_id, type) VALUES($1, $2, $3)';
        await query(sql, [race.id, immune.immune_id, immune.type]);

        return 'Successfully added Race Immunity to Database';
    }

    static async remove(race: { id: bigint }, immune: { id?: bigint, name?: string, type: string }) {
        if (!(await this.exists(race, immune))) throw new NotFoundError('Race Immunity not found', 'Could not find that Immunity for that Race in the Database!');

        await query('DELETE FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]);

        return 'Successfully removed Race Immunity from Database';
    }
}

export { RaceImmunity };
