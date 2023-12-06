import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { Senses } from "./senses.js";
const query = psql.query;

class ClassSense {
    static async getAll(clas) {
        const results = await query("SELECT * FROM class_senses WHERE class_id = $1", [clas.id])

        if (results.length === 0) {
            throw new NotFoundError("No Class Senses found", "Could not find any Senses for that Class in the Database!");
        }

        return Promise.all(results.map(async (classSense) => {
            const dbSense = await Senses.getOne({id: classSense.sense_id})

            return {
                id: classSense.id,
                class_id: clas.id,
                name: dbSense.name,
                sense_id: dbSense.id,
                range: classSense.range
            };
        }));
    };

    static async getOne(clas, sense) {
        if (sense.id) {
            const results = await query("SELECT * FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])

            if (results.length === 0) {
                throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
            }

            const classSense = results[0];
            const dbSense = await Senses.getOne({id: classSense.sense_id})

            return {
                id: classSense.id,
                class_id: clas.id,
                name: dbSense.name,
                sense_id: dbSense.id,
                range: classSense.range
            };
        }

        const results = await query("SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2", [clas.id, sense.sense_id])

        if (results.length === 0) {
            throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
        }

        const classSense = results[0];
        const dbSense = await Senses.getOne({id: classSense.sense_id})

        return {
            id: classSense.id,
            class_id: clas.id,
            name: dbSense.name,
            sense_id: dbSense.id,
            range: classSense.range
        };
    };

    static async exists(clas, sense) {
        if (sense.id) {
            const results = await query("SELECT * FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])
      
            return results.length === 1;
        }
    
        const results = await query("SELECT * FROM class_senses WHERE class_id = $1 AND sense_id = $2", [clas.id, sense.sense_id])
    
        return results.length === 1;
    };

    static async add(clas, sense) {
        if (await this.exists(clas, sense)) {
            throw new DuplicateError("Duplicate Class Sense", "That Class already has that Sense in the Database!");
        }

        const sql = "INSERT INTO class_senses (class_id, sense_id, range) VALUES($1, $2, $3)";
        await query(sql, [clas.id, sense.sense_id, sense.range])

        return "Successfully added Class Sense to Database";
    };

    static async remove(clas, sense) {
        if (!(await this.exists(clas, sense))) {
            throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
        }

        await query("DELETE FROM class_senses WHERE class_id = $1 AND id = $2", [clas.id, sense.id])

        return "Successfully removed Class Sense from Database";
    };

    static async update(clas, sense) {
        if (!(await this.exists(clas, sense))) {
            throw new NotFoundError("Class Sense not found", "Could not find that Sense for that Class in the Database!");
        }

        await query("UPDATE class_senses SET range = $1 WHERE class_id = $2 AND id = $3", [sense.range, clas.id, sense.id])

        return "Successfully updated Class Saves in Database";
    };
};

export { ClassSense };