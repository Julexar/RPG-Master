import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
const query = psql.query;

class Senses {
    static async getAll() {
        const results = await this.query("SELECT * FROM senses")

        if (results.length === 0) {
            throw new NotFoundError("No Senses found", "Could not find any Senses in the Database!");
        }

        return results;
    };

    static async getOne(sense) {
        if (sense.id) {
            const results = await this.query("SELECT * FROM senses WHERE id = $1", [sense.id])

            if (results.length === 0) {
                throw new NotFoundError("Sense not found", "Could not find that Sense in the Database!");
            }

            return results[0];
        }

        const results = await this.query("SELECT * FROM senses WHERE name = $1", [sense.name])

        if (results.length === 0) {
            throw new NotFoundError("Sense not found", "Could not find a Sense with that name in the Database!");
        }

        return results[0];
    };

    static async exists(sense) {
        if (sense.id) {
            const results = await this.query("SELECT * FROM senses WHERE id = $1", [sense.id])

            return results.length === 1;
        }

        const results = await this.query("SELECT * FROM senses WHERE name = $1", [sense.name])

        return results.length === 1;
    };

    static async add(sense) {
        if (await this.exists(sense)) {
            throw new DuplicateError("Duplicate Sense", "That Sense already exists in the Database!");
        }

        await query("INSERT INTO senses (name) VALUES($1)", [sense.name])

        return "Successfully added Sense to Database";
    };

    static async remove(sense) {
        if (!(await this.exists(sense))) {
            throw new NotFoundError("Sense not found", "Could not find that Sense in the Database!");
        }

        await query("DELETE FROM senses WHERE id = $1", [sense.id])

        return "Successfully removed Sense from Database";
    };
};

export { Senses };