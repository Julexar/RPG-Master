import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Class } from '..';
import { SubclassProficiency } from './proficiency.ts';
import { SubclassSense } from './sense.ts';
import { SubclassTrait } from './trait.ts';
const query = psql.query;

interface DBSubclass {
    id: bigint;
    class_id: bigint;
    name: string;
    description: string;
    caster: boolean;
    castlvl: number;
    cast_stat: string;
}

interface AddSubclass {
    name: string;
    description: string;
    caster: boolean;
    castlvl: number;
    cast_stat: string;
}

class subclass {
    profs: typeof SubclassProficiency;
    senses: typeof SubclassSense;
    traits: typeof SubclassTrait;
    constructor() {
        this.profs = SubclassProficiency;
        this.senses = SubclassSense;
        this.traits = SubclassTrait;
    }

    async getAll(clas: { id: bigint }) {
        if (!(await Class.hasSub(clas))) throw new BadRequestError('Invalid Request', 'This Class does not have Subclasses enabled!');

        const results = await query('SELECT * FROM subclasses WHERE class_id = $1', [clas.id]) as DBSubclass[];

        if (results.length === 0) throw new NotFoundError('No Subclasses found', 'Could not find any Subclasses for that Class in the Database!');

        return Promise.all(
            results.map(async (dbSub) => {
                const [subProfs, subSenses, subTraits] = await Promise.all([
                    await this.profs.getAll(dbSub),
                    await this.senses.getAll(dbSub),
                    await this.traits.getAll(dbSub)
                ]);

                return {
                    ...dbSub,
                    profs: subProfs,
                    senses: subSenses,
                    traits: subTraits
                };
            })
        );
    }

    async getOne(clas: { id: bigint }, sub: { id?: bigint; name?: string }) {
        if (sub.id) {
            const results = await query('SELECT * FROM subclasses WHERE class_id = $1 AND id = $2', [clas.id, sub.id]) as DBSubclass[];

            if (results.length === 0) throw new NotFoundError('Subclass not found', 'Could not find that Subclass in the Database!');

            const dbSub = results[0];
            const [subProfs, subSenses, subTraits] = await Promise.all([
                await this.profs.getAll(dbSub),
                await this.senses.getAll(dbSub),
                await this.traits.getAll(dbSub)
            ]);

            return {
                ...dbSub,
                profs: subProfs,
                senses: subSenses,
                traits: subTraits,
            };
        }

        const results = await query('SELECT * FROM subclasses WHERE class_id = $1 AND name = $2', [clas.id, sub.name]) as DBSubclass[];

        if (results.length === 0) throw new NotFoundError('Subclass not found', 'Could not find a Subclass with that name in the Database!');

        const dbSub = results[0];
        const [subProfs, subSenses, subTraits] = await Promise.all([
            await this.profs.getAll(dbSub),
            await this.senses.getAll(dbSub),
            await this.traits.getAll(dbSub)
        ]);

        return {
            ...dbSub,
            profs: subProfs,
            senses: subSenses,
            traits: subTraits,
        };
    }

    async exists(clas: { id: bigint }, sub: { id?: bigint; name?: string }) {
        if (sub.id) {
            const results = await query('SELECT * FROM subclasses WHERE class_id = $1 AND id = $2', [clas.id, sub.id]) as DBSubclass[];

            return results.length === 1;
        }

        const results = await query('SELECT * FROM subclasses WHERE class_id = $1 AND name = $2', [clas.id, sub.name]) as DBSubclass[];

        return results.length === 1;
    }

    async add(clas: { id: bigint }, sub: AddSubclass) {
        if (await this.exists(clas, sub)) throw new DuplicateError('Duplicate Subclass', 'That Subclass already exists in the Database!');

        const sql = 'INSERT INTO subclasses (class_id, name, description, caster, castlvl, cast_stat) VALUES($1, $2, $3, $4, $5, $6)';
        await query(sql, [clas.id, sub.name, sub.description, sub.caster, sub.castlvl, sub.cast_stat]);

        return 'Successfully added Subclass to Database';
    }

    async remove(clas: { id: bigint }, sub: { id: bigint }) {
        if (!(await this.exists(clas, sub))) throw new NotFoundError('Subclass not found', 'Could not find that Subclass in the Database!');

        await query('DELETE FROM subclasses WHERE class_id = $1 AND id = $2', [clas.id, sub.id]);

        return 'Successfully removed Subclass from Database';
    }

    async update(clas: { id: bigint }, sub: DBSubclass) {
        if (!(await this.exists(clas, sub))) throw new NotFoundError('Subclass not found', 'Could not find that Subclass in the Database!');

        const sql = 'UPDATE subclasses SET name = $1, description = $2, caster = $3, cast_lvl = $4, cast_stat = $5 WHERE class_id = $6 AND id = $7';
        await query(sql, [sub.name, sub.description, sub.caster, sub.castlvl, sub.cast_stat, clas.id, sub.id]);

        return 'Successfully updated Subclass in Database';
    }
}

const Subclass = new subclass();

export { Subclass };
