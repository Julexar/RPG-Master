import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Proficiency } from '..';
const query = psql.query;

interface DBRaceProficiency {
    id: bigint;
    race_id: bigint;
    type_id: bigint;
    name: string;
    expert: boolean;
}

interface AddProficiency {
    name: string;
    type_id: bigint;
    expert: boolean;
}

class RaceProficiency {
    static async getAll(race: { id: bigint }) {
        const results = await query('SELECT * FROM race_proficiencies WHERE race_id = $1', [race.id]) as DBRaceProficiency[];

        if (results.length === 0) throw new NotFoundError('No Race Proficiencies found', 'Could not find any Race Proficiencies in the Database!');

        return Promise.all(
            results.map(async (raceProf) => {
                const dbProf = await Proficiency.getOne({ id: raceProf.type_id });

                return {
                    id: raceProf.id,
                    race_id: race.id,
                    name: raceProf.name,
                    type: dbProf,
                    expert: raceProf.expert
                };
            })
        );
    }

    static async getOne(race: { id: bigint }, prof: { id?: bigint, name?: string, type_id: bigint }) {
        if (prof.id) {
            const results = await query('SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2', [race.id, prof.id]) as DBRaceProficiency[];

            if (results.length === 0) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

            const raceProf = results[0];
            const dbProf = await Proficiency.getOne({ id: raceProf.type_id });

            return {
                id: raceProf.id,
                race_id: race.id,
                name: raceProf.name,
                type: dbProf,
                expert: raceProf.expert
            };
        }

        const results = await query('SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2', [race.id, prof.name]) as DBRaceProficiency[];

        if (results.length === 0) throw new NotFoundError('Race Proficiency not found', 'Could not find a Race Proficiency with that name in the Database!');

        const raceProf = results[0];
        const dbProf = await Proficiency.getOne({ id: raceProf.type_id });

        return {
            id: raceProf.id,
            race_id: race.id,
            name: raceProf.name,
            type: dbProf,
            expert: raceProf.expert
        };
    }

    static async exists(race: { id: bigint }, prof: { id?: bigint, name?: string }) {
        if (prof.id) {
            const results = await query('SELECT * FROM race_proficiencies WHERE race_id = $1 AND id = $2', [race.id, prof.id]) as DBRaceProficiency[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM race_proficiencies WHERE race_id = $1 AND name = $2', [race.id, prof.name]) as DBRaceProficiency[];

        return results.length === 1;
    }

    static async add(race: { id: bigint }, prof: AddProficiency) {
        try {
            const raceProf = await this.getOne(race, prof);

            if (prof.expert === raceProf.expert) throw new DuplicateError('Duplicate Race Proficiency', 'That Race Proficiency already exists in the Database!');

            const sql = 'UPDATE race_proficiencies SET expert = $1 WHERE race_id = $2 AND id = $3';
            await query(sql, [prof.expert, race.id, raceProf.id]);

            return 'Successfully updated Race Proficiency in the Database';
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO race_proficiencies (race_id, name, type, expert) VALUES($1, $2, $3, $4)';
            await query(sql, [race.id, prof.name, prof.type_id, prof.expert]);

            return 'Successfully added Race Proficiency to Database';
        }
    }

    static async remove(race: { id: bigint }, prof: { id?: bigint, name?: string }) {
        if (!(await this.exists(race, prof))) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

        await query('DELETE FROM race_proficiencies WHERE race_id = $1 AND id = $2', [race.id, prof.id]);

        return 'Successfully removed Race Proficiency from Database';
    }

    static async update(race: { id: bigint }, prof: DBRaceProficiency) {
        if (!(await this.exists(race, prof))) throw new NotFoundError('Race Proficiency not found', 'Could not find that Race Proficiency in the Database!');

        await query('UPDATE race_proficiencies SET expert = $1 WHERE race_id = $2 AND id = $3', [prof.expert, race.id, prof.id]);

        return 'Successfully updated Race Proficiency in Database';
    }
}

export { RaceProficiency };
