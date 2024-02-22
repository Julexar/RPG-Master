import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { RaceResistance } from './immunity.js';
import { RaceProficiency } from './proficiency.js';
import { RaceImmunity } from './resistance.js';
import { RaceSense } from './sense.js';
import { RaceTrait } from './trait.js';
import { RaceStats } from './stats.js';
const query = psql.query;

class race {
    constructor() {
        this.resistances = RaceResistance;
        this.profs = RaceProficiency;
        this.immunities = RaceImmunity;
        this.senses = RaceSense;
        this.traits = RaceTrait;
        this.stats = RaceStats;
    }

    async getAll() {
        const results = await query('SELECT * FROM races');

        if (results.length === 0) {
            throw new NotFoundError('No Races found', 'Could not find any Races in the Database!');
        }

        return Promise.all(
            results.map(async dbRace => {
                const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
                    this.stats.getAll(dbRace),
                    this.immunities.getAll(dbRace),
                    this.resistances.getAll(dbRace),
                    this.profs.getAll(dbRace),
                    this.senses.getAll(dbRace),
                    this.traits.getAll(dbRace),
                ]);

                return {
                    id: dbRace.id,
                    name: dbRace.name,
                    description: dbRace.description,
                    speed: dbRace.speed,
                    sub: dbRace.sub,
                    feat: dbRace.feat,
                    stats: raceStats,
                    immunities: raceImmunities,
                    resistances: raceResistances,
                    profs: raceProfs,
                    senses: raceSenses,
                    traits: raceTraits,
                };
            })
        );
    }

    async getOne(race) {
        if (race.id) {
            const results = await query('SELECT * FROM races WHERE id = $1', [race.id]);

            if (results.length === 0) {
                throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');
            }

            const dbRace = results[0];
            const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
                this.stats.getAll(dbRace),
                this.immunities.getAll(dbRace),
                this.resistances.getAll(dbRace),
                this.profs.getAll(dbRace),
                this.senses.getAll(dbRace),
                this.traits.getAll(dbRace),
            ]);

            return {
                id: dbRace.id,
                name: dbRace.name,
                description: dbRace.description,
                speed: dbRace.speed,
                sub: dbRace.sub,
                feat: dbRace.feat,
                stats: raceStats,
                immunities: raceImmunities,
                resistances: raceResistances,
                profs: raceProfs,
                senses: raceSenses,
                traits: raceTraits,
            };
        }

        const results = await query('SELECT * FROM races WHERE name = $1', [race.name]);

        if (results.length === 0) {
            throw new NotFoundError('Race not found', 'Could not find a Race with that name in the Database!');
        }

        const dbRace = results[0];
        const [raceStats, raceImmunities, raceResistances, raceProfs, raceSenses, raceTraits] = await Promise.all([
            this.stats.getAll(dbRace),
            this.immunities.getAll(dbRace),
            this.resistances.getAll(dbRace),
            this.profs.getAll(dbRace),
            this.senses.getAll(dbRace),
            this.traits.getAll(dbRace),
        ]);

        return {
            id: dbRace.id,
            name: dbRace.name,
            description: dbRace.description,
            speed: dbRace.speed,
            sub: dbRace.sub,
            feat: dbRace.feat,
            stats: raceStats,
            immunities: raceImmunities,
            resistances: raceResistances,
            profs: raceProfs,
            senses: raceSenses,
            traits: raceTraits,
        };
    }

    async exists(race) {
        if (race.id) {
            const results = await query('SELECT * FROM races WHERE id = $1', [race.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM races WHERE name = $1', [race.name]);

        return results.length === 1;
    }

    async add(race) {
        if (await this.exists(race)) {
            throw new DuplicateError('Duplicate Race', 'That Race already exists in the Database!');
        }

        const sql = 'INSERT INTO races (name, description, speed, sub, feat) VALUES($1, $2, $3, $4, $5)';
        await query(sql, [race.name, race.description, race.speed, race.sub, race.feat]);

        return 'Successfully added Race to Database';
    }

    async remove(race) {
        if (!(await this.exists(race))) {
            throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');
        }

        await query('DELETE FROM races WHERE id = $1', [race.id]);

        return 'Successfully removed Race from Database';
    }

    async update(race) {
        if (!(await this.exists(race))) {
            throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');
        }

        const sql = 'UPDATE races SET name = $1, description = $2, speed = $3, sub = $4, feat = $5 WHERE id = $6';
        await query(sql, [race.name, race.description, race.speed, race.sub, race.feat, race.id]);

        return 'Successfully updated Race in Database';
    }

    async hasSub(race) {
        if (!(await this.exists(race))) {
            throw new NotFoundError('Race not found', 'Could not find that Race in the Database!');
        }

        const results = await query('SELECT sub FROM races WHERE id = $1', [race.id]);
        return results[0];
    }
}

const Race = new race();

export { Race };
