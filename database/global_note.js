import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
import { User } from "./user.js";
const query = psql.query;

class GlobalNote {
    static async getAll(user) {
        if (!(await User.exists(user))) {
            throw new NotFoundError("User not found", "Could not find that User in the Database!");
        }

        const results = await query("SELECT * FROM global_notes WHERE user_id = $1", [user.id])

        if (results.length === 0) {
            throw new NotFoundError("No Global Notes found", "Could not find any Global Notes for that User in the Database!");
        }

        return results;
    };

    static async getOne(user, note) {
        if (!(await User.exists(user))) {
            throw new NotFoundError("User not found", "Could not find that User in the Database!");
        }

        if (note.id) {
            const results = await query("SELECT * FROM global_notes WHERE user_id = $1 AND id = $2", [user.id, note.id])

            if (results.length === 0) {
                throw new NotFoundError("Global Note not found", "Could not find that Global Note for that User in the Database!");
            }

            return results[0];
        }

        const results = await query("SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2", [user.id, note.title])

        if (results.length === 0) {
            throw new NotFoundError("Global Note not found", "Could not find a Global Note with that name for that User in the Database!");
        }

        return results[0];
    };

    static async exists(user, note) {
        if (note.id) {
            const results = await query("SELECT * FROM global_notes WHERE user_id = $1 AND id = $2", [user.id, note.id])

            return results.length === 1;
        }

        const results = await query("SELECT * FROM gloabal_notes WHERE user_id = $1 AND title = $2", [user.id, note.title])

        return results.length === 1;
    };

    static async add(user, note) {
        try {
            const globNote = await this.getOne(user, note)

            if (note.content === globNote.content) {
                throw new DuplicateError("Duplicate Global Note", "A Global Note with that title and content already exists in the Database!");
            }

            const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
            await query(sql, [user.id, note.title, note.content, note.private])

            return "Successfully added Global Note to Database";
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = "INSERT INTO global_notes (user_id, title, content, private) VALUES($1, $2, $3, $4)";
            await query(sql, [user.id, note.title, note.content, note.private])

            return "Successfully added Global Note to Database";
        }
    };

    static async remove(user, note) {
        if (!(await this.exists(user, note))) {
            throw new NotFoundError("Global Note not found", "Could not find that Global Note for that User in the Database!");
        }

        await query("DELETE FROM global_notes WHERE user_id = $1 AND id = $2", [user.id, note.id])

        return "Successfully removed Global Note from Database";
    };

    static async update(user, note) {
        if (!(await this.exists(user, note))) {
            throw new NotFoundError("Global Note not found", "Could not find that Global Note for that User in the Database!");
        }

        const sql = "UPDATE global_notes SET title = $1, content = $2, private = $3 WHERE user_id = $4 AND id = $5";
        await query(sql, [note.title, note.content, note.private, user.id, note.id])

        return "Successfully updated Global Note in Database";
    };
};

export { GlobalNote };