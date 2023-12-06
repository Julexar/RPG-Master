import { psql } from "./psql.js";
import { NotFoundError, DuplicateError, BadRequestError } from "../custom/errors/index.js";
import { Class } from "./class.js";
import { SubclassProficiency } from "./subclass_proficiency.js";
import { SubclassSense } from "./subclass_sense.js";
import { SubclassTrait } from "./subclass_trait.js";
const query = psql.query;

class subclass {
    constructor () {
        this.profs = SubclassProficiency
        this.senses = SubclassSense
        this.traits = SubclassTrait
    };

    async getAll(clas) {
        if (!(await Class.hasSub(clas))) {
            throw new BadRequestError("Invalid Request", "This Class does not have Subclasses enabled!");
        }

        const results = await query("SELECT * FROM subclasses WHERE class_id = $1", [clas.id])

        if (results.length === 0) {
            throw new NotFoundError("No Subclasses found", "Could not find any Subclasses for that Class in the Database!");
        }

        return Promise.all(results.map(async (dbSub) => {
            const [subProfs, subSenses, subTraits] = await Promise.all([
                this.profs.getAll(dbSub),
                this.senses.getAll(dbSub),
                this.traits.getAll(dbSub)
            ]);

            return {
                id: dbSub.id,
                class_id: clas.id,
                name: dbSub.name,
                description: dbSub.description,
                caster: dbSub.caster,
                cast_lvl: dbSub.cast_lvl,
                profs: subProfs,
                senses: subSenses,
                traits: subTraits
            };
        }));
    };

    async getOne(clas, sub) {
        if (sub.id) {
            const results = await query("SELECT * FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])

            if (results.length === 0) {
                throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
            }

            const dbSub = results[0];
            const [subProfs, subSenses, subTraits] = await Promise.all([
                this.profs.getAll(dbSub),
                this.senses.getAll(dbSub),
                this.traits.getAll(dbSub)
            ]);

            return {
                id: dbSub.id,
                class_id: clas.id,
                name: dbSub.name,
                description: dbSub.description,
                caster: dbSub.caster,
                cast_lvl: dbSub.cast_lvl,
                profs: subProfs,
                senses: subSenses,
                traits: subTraits
            };
        }

        const results = await query("SELECT * FROM subclasses WHERE class_id = $1 AND name = $2", [clas.id, sub.name])

        if (results.length === 0) {
            throw new NotFoundError("Subclass not found", "Could not find a Subclass with that name in the Database!");
        }

        const dbSub = results[0];
        const [subProfs, subSenses, subTraits] = await Promise.all([
            this.profs.getAll(dbSub),
            this.senses.getAll(dbSub),
            this.traits.getAll(dbSub)
        ]);

        return {
            id: dbSub.id,
            class_id: clas.id,
            name: dbSub.name,
            description: dbSub.description,
            caster: dbSub.caster,
            cast_lvl: dbSub.cast_lvl,
            profs: subProfs,
            senses: subSenses,
            traits: subTraits
        };
    };

    async exists(clas, sub) {
        if (sub.id) {
            const results = await query("SELECT * FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])
      
            return results.length === 1;
        }
    
        const results = await query("SELECT * FROM subclasses WHERE class_id = $1 AND name = $2", [clas.id, sub.name])
    
        return results.length === 1;
    };

    async add(clas, sub) {
        if (await this.exists(clas, sub)) {
            throw new DuplicateError("Duplicate Subclass", "That Subclass already exists in the Database!");
        }

        const sql = "INSERT INTO subclasses (class_id, name, description, caster, cast_lvl) VALUES($1, $2, $3, $4, $5)";
        await query(sql, [clas.id, sub.name, sub.description, sub.caster, sub.cast_lvl])

        return "Successfully added Subclass to Database";
    };

    async remove(clas, sub) {
        if (!(await this.exists(clas, sub))) {
            throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
        }

        await query("DELETE FROM subclasses WHERE class_id = $1 AND id = $2", [clas.id, sub.id])

        return "Successfully removed Subclass from Database";
    };

    async update(clas, sub) {
        if (!(await this.exists(clas, sub))) {
            throw new NotFoundError("Subclass not found", "Could not find that Subclass in the Database!");
        }

        const sql = "UPDATE subclasses SET name = $1, description = $2, caster = $3, cast_lvl = $4 WHERE class_id = $5 AND id = $6";
        await query(sql, [sub.name, sub.description, sub.caster, sub.cast_lvl, clas.id, sub.id])

        return "Successfully updated Subclass in Database";
    };
};

const Subclass = new subclass();

export { Subclass };