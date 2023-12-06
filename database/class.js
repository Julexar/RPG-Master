import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { ClassProficiency } from "./class_proficiency.js";
import { ClassSave } from "./class_save.js";
import { ClassSense } from "./class_sense.js";
import { ClassTrait } from "./class_trait.js";
const query = psql.query;

class Class {
    static async getAll() {
        const results = await this.query("SELECT * FROM classes")

        if (results.length === 0) {
            throw new NotFoundError("No Classes found", "Could not find any Classes in the Database!");
        }

        return Promise.all(results.map(async (dbClass) => {
            const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
                await ClassProficiency.getAll(dbClass),
                await ClassSave.getAll(dbClass),
                await ClassSense.getAll(dbClass),
                await ClassTrait.getAll(dbClass)
            ]);

            return {
                id: dbClass.id,
                name: dbClass.name,
                hitdice: dbClass.hitdice,
                hitdice_size: dbClass.hitdice_size,
                caster: dbClass.caster,
                cast_lvl: dbClass.cast_lvl,
                sub: dbClass.sub,
                profs: classProfs,
                saves: classSaves,
                senses: classSenses,
                traits: classTraits
            };
        }));
    };

    static async getOne(clas) {
        if (clas.id) {
            const results = await this.query("SELECT * FROM classes WHERE id = $1", [clas.id])

            if (results.length === 0) {
                throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
            }

            const dbClass = results[0];
            const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
                await ClassProficiency.getAll(dbClass),
                await ClassSave.getAll(dbClass),
                await ClassSense.getAll(dbClass),
                await ClassTrait.getAll(dbClass)
            ]);

            return {
                id: dbClass.id,
                name: dbClass.name,
                hitdice: dbClass.hitdice,
                hitdice_size: dbClass.hitdice_size,
                caster: dbClass.caster,
                cast_lvl: dbClass.cast_lvl,
                sub: dbClass.sub,
                profs: classProfs,
                saves: classSaves,
                senses: classSenses,
                traits: classTraits
            };
        }

        const results = await this.query("SELECT * FROM classes WHERE name = $1", [clas.name])

        if (results.length === 0) {
            throw new NotFoundError("Class not found", "Could not find a Class with that name in the Database!");
        }

        const dbClass = results[0];
        const [classProfs, classSaves, classSenses, classTraits] = await Promise.all([
            await ClassProficiency.getAll(dbClass),
            await ClassSave.getAll(dbClass),
            await ClassSense.getAll(dbClass),
            await ClassTrait.getAll(dbClass)
        ]);

        return {
            id: dbClass.id,
            name: dbClass.name,
            hitdice: dbClass.hitdice,
            hitdice_size: dbClass.hitdice_size,
            caster: dbClass.caster,
            cast_lvl: dbClass.cast_lvl,
            sub: dbClass.sub,
            profs: classProfs,
            saves: classSaves,
            senses: classSenses,
            traits: classTraits
        };
    };

    static async exists(clas) {
        if (clas.id) {
            const results = await this.query("SELECT * FROM classes WHERE id = $1", [clas.id])

            return results.length === 1;
        }

        const results = await this.query("SELECT * FROM classes WHERE name = $1", [clas.name])

        return results.length === 1;
    };

    static async add(clas) {
        if (await this.exists(clas)) {
            throw new DuplicateError("Duplicate Class", "That Class already exists in the Database!");
        }

        const sql = "INSERT INTO classes (name, description, hitdice, hitdice_size, caster, cast_lvl, sub) VALUES($1, $2, $3, $4, $5, $6, $7. $8)";
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.hitdice_size, clas.caster, clas.cast_lvl, clas.sub])

        return "Successfully added Class to Database";
    };

    static async remove(clas) {
        if (!(await this.exists(clas))) {
            throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
        }

        await query("DELETE FROM classes WHERE id = $1", [clas.id])

        return "Successfully removed Class from Database";
    };

    static async update(clas) {
        if (!(await this.exists(clas))) {
            throw new NotFoundError("Class not found", "Could not find that Class in the Database!");
        }

        const sql = "UPDATE classes SET name = $1, description = $2, hitdice = $3, hitdice_size = $4, caster = $5, cast_lvl = $6, sub = $7 WHERE id = $8";
        await query(sql, [clas.name, clas.description, clas.hitdice, clas.hitdice_size, clas.caster, clas.cast_lvl, clas.sub, clas.id])

        return "Successfully updated Class in Database";
    };
};

export { Class };