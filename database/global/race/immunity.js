import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { Condition, Damagetype } from '..';
const query = psql.query;

class RaceImmunity {
    static async getAll(race) {
        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1', [race.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Race Immunities found', 'Could not find any Immunities for that Race in the Database!');
        }

        return Promise.all(
            results.map(async (raceImmune) => {
                let dbImmune;

                switch (raceImmune.type) {
                    case 'damagetype':
                        dbImmune = await this.getDamagetype(server, { id: raceImmune.imm_id });
                        break;
                    case 'condition':
                        dbImmune = await this.getCondition(server, { id: raceImmune.imm_id });
                        break;
                }

                return {
                    id: raceImmune.id,
                    race_id: race.id,
                    type: raceImmune.type,
                    name: dbImmune.name,
                    imm_id: dbImmune.id,
                };
            })
        );
    }

    static async getOne(race, immune) {
        if (immune.id) {
            const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]);

            if (results.length === 0) {
                throw new NotFoundError('Race Immunity not found', 'Could not find that Immunity for that Race in the Database!');
            }

            const raceImmune = results[0];
            let dbImmune;

            switch (raceImmune.type) {
                case 'damagetype':
                    dbImmune = await this.getDamagetype(server, { id: raceImmune.imm_id });
                    break;
                case 'condition':
                    dbImmune = await this.getCondition(server, { id: raceImmune.imm_id });
                    break;
            }

            return {
                id: raceImmune.id,
                race_id: race.id,
                type: raceImmune.type,
                name: dbImmune.name,
                imm_id: dbImmune.id,
            };
        }

        let dbImmune;

        switch (immunity.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { name: immune.name });
                break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { name: immune.name });
                break;
        }

        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2', [race.id, dbImmune.id]);

        if (results.length === 0) {
            throw new NotFoundError('Race Immunity not found', 'Could not find an Immunity with that name for that Race in the Database!');
        }

        const raceImmune = results[0];

        return {
            id: raceImmune.id,
            race_id: race.id,
            type: raceImmune.type,
            name: dbImmune.name,
            imm_id: dbImmune.id,
        };
    }

    static async exists(race, immune) {
        if (immune.id) {
            const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]);

            return results.length === 1;
        }

        let dbImmune;

        switch (immunity.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { name: immune.name });
                break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { name: immune.name });
                break;
        }

        const results = await query('SELECT * FROM race_immunities WHERE race_id = $1 AND imm_id = $2', [race.id, dbImmune.id]);

        return results.length === 1;
    }

    static async add(race, immune) {
        if (await this.exists(race, immune)) {
            throw new DuplicateError('Duplicate Race Immunity', 'That Race already has that Immunity in the Database!');
        }

        const sql = 'INSERT INTO race_immunities (race_id, imm_id, type) VALUES($1, $2, $3)';
        await query(sql, [race.id, immune.imm_id, immune.type]);

        return 'Successfully added Race Immunity to Database';
    }

    static async remove(race, immune) {
        if (!(await this.exists(race, immune))) {
            throw new NotFoundError('Race Immunity not found', 'Could not find that Immunity for that Race in the Database!');
        }

        await query('DELETE FROM race_immunities WHERE race_id = $1 AND id = $2', [race.id, immune.id]);

        return 'Successfully removed Race Immunity from Database';
    }
}

export { RaceImmunity };
