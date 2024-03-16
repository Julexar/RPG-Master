import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Condition, Damagetype } from '..';
const query = psql.query;

interface DBRaceResistance {
    id: bigint;
    race_id: bigint;
    resist_id: bigint;
    type: string;
}

interface AddResistance {
    resist_id: bigint;
    type: string;
}

class RaceResistance {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_resistances WHERE race_id = $1', [race.id]) as DBRaceResistance[];

        if (results.length === 0) throw new NotFoundError('No Race Resistances found', 'Could not find any Resistances for that Race in the Database!');

        return Promise.all(
            results.map(async (raceResist) => {
                let dbResist: {id: bigint, name: string} = {id: BigInt(0), name: ''};

                switch (raceResist.type) {
                    case 'damagetype':
                        dbResist = await Damagetype.getOne({ id: raceResist.resist_id });
                    break;
                    case 'condition':
                        dbResist = await Condition.getOne({ id: raceResist.resist_id });
                    break;
                }

                return {
                    id: raceResist.id,
                    race_id: race.id,
                    type: raceResist.type,
                    resist: dbResist
                };
            })
        );
    }

    static async getOne(race: { id: bigint }, resist: { id?: bigint, name?: string, type: string }) {
        if (resist.id) {
            const results = await query('SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2', [race.id, resist.id]) as DBRaceResistance[];

            if (results.length === 0) throw new NotFoundError('Race Resistance not found', 'Could not find that Resistance for that Race in the Database!');

            const raceResist = results[0];

            let dbResist: {id: bigint, name: string} = {id: BigInt(0), name: ''};

            switch (raceResist.type) {
                case 'damagetype':
                    dbResist = await Damagetype.getOne({ id: raceResist.resist_id });
                break;
                case 'condition':
                    dbResist = await Condition.getOne({ id: raceResist.resist_id });
                break;
            }

            return {
                id: raceResist.id,
                race_id: race.id,
                type: raceResist.type,
                resist: dbResist
            };
        }

        let dbResist: {id: bigint, name: string} = {id: BigInt(0), name: ''};

        switch (resist.type) {
            case 'damagetype':
                dbResist = await Damagetype.getOne({ name: resist.name });
            break;
            case 'condition':
                dbResist = await Condition.getOne({ name: resist.name });
            break;
        }

        const results = await query('SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2', [race.id, dbResist.id]) as DBRaceResistance[];

        if (results.length === 0) throw new NotFoundError('Race Resistance not found', 'Could not find a Resistance with that name for that Race in the Database!');

        const raceResist = results[0];

        return {
            id: raceResist.id,
            race_id: race.id,
            type: raceResist.type,
            resist: dbResist
        };
    }

    static async exists(race: { id: bigint }, resist: { id?: bigint, name?: string, type: string }) {
        if (resist.id) {
            const results = await query('SELECT * FROM race_resistances WHERE race_id = $1 AND id = $2', [race.id, resist.id]) as DBRaceResistance[];

            return results.length === 1;
        }

        let dbResist: {id: bigint, name: string} = {id: BigInt(0), name: ''};

        switch (resist.type) {
            case 'damagetype':
                dbResist = await Damagetype.getOne({ name: resist.name });
            break;
            case 'condition':
                dbResist = await Condition.getOne({ name: resist.name });
            break;
        }

        const results = await query('SELECT * FROM race_resistances WHERE race_id = $1 AND res_id = $2', [race.id, dbResist.id]) as DBRaceResistance[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, resist: AddResistance) {
        if (await this.exists(race, resist)) throw new DuplicateError('Duplicate Race Resistace', 'That Race already has that Resistance in the Database!');

        const sql = 'INSERT INTO race_resistances (race_id, resist_id, type) VALUES($1, $2, $3)';
        await query(sql, [race.id, resist.resist_id, resist.type]);

        return 'Successfully added Race Resistance to Database';
    }

    static async remove(race: { id: bigint }, resist: { id?: bigint, name?: string, type: string }) {
        if (!(await this.exists(race, resist))) throw new NotFoundError('Race Resistance not found', 'Could not find that Resistance for that Race in the Database!');

        await query('DELETE FROM race_resistances WHERE race_id = $1 AND id = $2', [race.id, resist.id]);

        return 'Successfully removed Race Resistance from Database';
    }
}

export { RaceResistance };
