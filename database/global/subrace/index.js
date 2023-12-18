import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Race } from '..';
import { SubraceProficiency } from './proficiency.js';
import { SubraceSense } from './sense.js';
import { SubraceTrait } from './trait.js';
const query = psql.query;

class subrace {
    constructor() {
        this.profs = SubraceProficiency;
        this.senses = SubraceSense;
        this.traits = SubraceTrait;
    }

    async getAll(race) {
        if (!(await Race.hasSub(race))) {
            throw new BadRequestError('Invalid Request', 'This Race does not have Subraces enabled!');
        }

        const results = await query('SELECT * FROM subraces WHERE race_id = $1', [race.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Subraces found', 'Could not find any Subraces in the Database!');
        }

        return Promise.all(
            results.map(async (dbSub) => {
                const [subProfs, subSenses, subTraits] = await Promise.all([this.profs.getAll(dbSub), this.senses.getAll(dbSub), this.traits.getAll(dbSub)]);

                return {
                    id: dbSub.id,
                    race_id: race.id,
                    name: dbSub.name,
                    description: dbSub.description,
                    profs: subProfs,
                    senses: subSenses,
                    traits: subTraits,
                };
            })
        );
    }

    async getOne(race, sub) {
        if (!(await Race.hasSub(race))) {
            throw new BadRequestError('Invalid Request', 'This Race does not have Subraces enabled!');
        }

        if (sub.id) {
            const results = await query('SELECT * FROM subraces WHERE race_id = $1 AND id = $2', [race.id, sub.id]);

            if (results.length === 0) {
                throw new NotFoundError('Subrace not found', 'Could not find that Subrace in the Database!');
            }

            const dbSub = results[0];
            const [subProfs, subSenses, subTraits] = await Promise.all([this.profs.getAll(dbSub), this.senses.getAll(dbSub), this.traits.getAll(dbSub)]);

            return {
                id: dbSub.id,
                race_id: race.id,
                name: dbSub.name,
                description: dbSub.description,
                profs: subProfs,
                senses: subSenses,
                traits: subTraits,
            };
        }

        const results = await query('SELECT * FROM subraces WHERE race_id = $1 AND name = $2', [race.id, sub.name]);

        if (results.length === 0) {
            throw new NotFoundError('Subrace not found', 'Could not find a Subrace with that name in the Database!');
        }

        const dbSub = results[0];
        const [subProfs, subSenses, subTraits] = await Promise.all([this.profs.getAll(dbSub), this.senses.getAll(dbSub), this.traits.getAll(dbSub)]);

        return {
            id: dbSub.id,
            race_id: race.id,
            name: dbSub.name,
            description: dbSub.description,
            profs: subProfs,
            senses: subSenses,
            traits: subTraits,
        };
    }

    async exists(race, sub) {
        if (sub.id) {
            const results = await query('SELECT * FROM subraces WHERE race_id = $1 AND id = $2', [race.id, sub.id]);

            return results.length === 1;
        }

        const results = await query('SELECT * FROM subraces WHERE race_id = $1 AND name = $2', [race.id, sub.name]);

        return results.length === 1;
    }

    async add(race, sub) {
        if (await this.exists(race, sub)) {
            throw new DuplicateError('Duplicate Subrace', 'That Subrace already exists in the Database!');
        }

        const sql = 'INSERT INTO subraces (race_id, name, description) VALUES($1, $2, $3)';
        await query(sql, [race.id, sub.name, sub.description]);

        return 'Successfully added Subrace to Database';
    }

    async remove(race, sub) {
        if (!(await this.exists(race, sub))) {
            throw new NotFoundError('Subrace not found', 'Could not find that Subrace in the Database!');
        }

        await query('DELETE FROM subraces WHERE race_id = $1 AND id = $2', [race.id, sub.id]);

        return 'Successfully removed Subrace from Database';
    }

    async update(race, sub) {
        if (!(await this.exists(race, sub))) {
            throw new NotFoundError('Subrace not found', 'Could not find that Subrace in the Database!');
        }

        const sql = 'UPDATE subraces SET name = $1 AND description = $2 WHERE race_id = $3 AND id = $4';
        await query(sql, [sub.name, sub.description, race.id, sub.id]);

        return 'Sucessfully updated Subrace in Database';
    }
}

const Subrace = new subrace();

export { Subrace };
