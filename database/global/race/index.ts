import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { RaceResistance } from './resistance.ts';
import { RaceProficiency } from './proficiency.ts';
import { RaceImmunity } from './immunity.ts';
import { RaceSense } from './sense.ts';
import { RaceTrait } from './trait.ts';
import { RaceStats } from './stats.ts';
const query = psql.query;

interface DBRace {
    id: bigint;
    name: string;
    description: string;
    speed: bigint;
    size: string;
    has_feat: string;
    has_subrace: boolean;
}

interface AddRace {
    name: string;
    description: string;
    speed: bigint;
    size: string;
    has_feat: string;
    has_subrace: boolean;
}

class race {
    resistances: RaceResistance;
    profs: RaceProficiency;
    immunities: RaceImmunity;
    senses: RaceSense;
    traits: RaceTrait;
    stats: RaceStats;
    constructor() {
        this.resistances = RaceResistance;
        this.profs = RaceProficiency;
        this.immunities = RaceImmunity;
        this.senses = RaceSense;
        this.traits = RaceTrait;
        this.stats = RaceStats;
    }

    async getAll() {
        const results = await query('SELECT * FROM races') as DBRace[];

        if (results.length === 0) throw new NotFoundError('No Races found', 'Could not find any Races in the Database!');

        return Promise.all(
            results.map(async (dbRace) => {
                const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
                    RaceStats.getAll(dbRace),
                    RaceImmunity.getAll(dbRace),
                    RaceResistance.getAll(dbRace),
                    RaceProficiency.getAll(dbRace),
                    RaceSense.getAll(dbRace),
                    RaceTrait.getAll(dbRace),
                ]);

                return {
                    id: dbRace.id,
                    name: dbRace.name,
                    description: dbRace.description,
                    speed: dbRace.speed,
                    size: dbRace.size,
                    has_feat: dbRace.has_feat,
                    has_subrace: dbRace.has_subrace,
                    stats: raceStats,
                    immunities: raceImmunities,
                    resistances: raceResistances,
                    profs: raceProfs,
                    senses: raceSenses,
                    traits: raceTraits
                };
            })
        );
    }

    async getOne(race: { id?: bigint, name?: string }) {
        if (race.id) {
            const results = await query('SELECT * FROM races WHERE id = $1', [race.id]) as DBRace[];

            if (results.length === 0) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

            const dbRace = results[0];
            const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
                RaceStats.getAll(dbRace),
                RaceImmunity.getAll(dbRace),
                RaceResistance.getAll(dbRace),
                RaceProficiency.getAll(dbRace),
                RaceSense.getAll(dbRace),
                RaceTrait.getAll(dbRace),
            ]);

            return {
                id: dbRace.id,
                name: dbRace.name,
                description: dbRace.description,
                speed: dbRace.speed,
                size: dbRace.size,
                has_feat: dbRace.has_feat,
                has_subrace: dbRace.has_subrace,
                stats: raceStats,
                immunities: raceImmunities,
                resistances: raceResistances,
                profs: raceProfs,
                senses: raceSenses,
                traits: raceTraits
            };
        }

        const results = await query('SELECT * FROM races WHERE name = $1', [race.name]) as DBRace[];

        if (results.length === 0) throw new NotFoundError('Race not found', 'Could not find a Race with that name in the Database!');

        const dbRace = results[0];
        const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
            RaceStats.getAll(dbRace),
            RaceImmunity.getAll(dbRace),
            RaceResistance.getAll(dbRace),
            RaceProficiency.getAll(dbRace),
            RaceSense.getAll(dbRace),
            RaceTrait.getAll(dbRace),
        ]);

        return {
            id: dbRace.id,
            name: dbRace.name,
            description: dbRace.description,
            speed: dbRace.speed,
            size: dbRace.size,
            has_feat: dbRace.has_feat,
            has_subrace: dbRace.has_subrace,
            stats: raceStats,
            immunities: raceImmunities,
            resistances: raceResistances,
            profs: raceProfs,
            senses: raceSenses,
            traits: raceTraits
        };
    }

    async exists(race: { id?: bigint, name?: string }) {
        if (race.id) {
            const results = await query('SELECT * FROM races WHERE id = $1', [race.id]) as DBRace[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM races WHERE name = $1', [race.name]) as DBRace[];

        return results.length === 1;
    }

    async add(race: AddRace) {
        if (await this.exists(race)) throw new DuplicateError('Duplicate Race', 'That Race already exists in the Database!');

        const sql = 'INSERT INTO races (name, description, speed, size, has_feat, has_subrace) VALUES($1, $2, $3, $4, $5, $6)';
        await query(sql, [race.name, race.description, race.speed, race.size, race.has_feat, race.has_subrace]);

        return 'Successfully added Race to Database';
    }

    async remove(race: { id: bigint, name?: string }) {
        if (!(await this.exists(race))) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

        await query('DELETE FROM races WHERE id = $1', [race.id]);

        return 'Successfully removed Race from Database';
    }

    async update(race: DBRace) {
        if (!(await this.exists(race))) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

        const sql = 'UPDATE races SET name = $1, description = $2, speed = $3, size = $4, has_feat = $5, has_subrace = $6 WHERE id = $7';
        await query(sql, [race.name, race.description, race.speed, race.size, race.has_feat, race.has_subrace, race.id]);

        return 'Successfully updated Race in Database';
    }

    async hasSub(race: { id: bigint, name?: string }) {
        if (!(await this.exists(race))) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

        const results = await query('SELECT * FROM races WHERE id = $1', [race.id]) as DBRace[];
        return results[0].has_subrace;
    }

    async hasFeat(race: { id: bigint, name?: string }) {
        if (!(await this.exists(race))) throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');

        const results = await query('SELECT * FROM races WHERE id = $1', [race.id]) as DBRace[];
        return results[0].has_feat;
    }
}

const Race = new race();

export { Race };
