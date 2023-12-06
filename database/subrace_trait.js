import { psql } from "./psql.js";
import { NotFoundError, DuplicateError } from "../custom/errors/index.js";
const query = psql.query;

class SubraceTrait {
    static async getAll(sub) {
        const results = await query("SELECT * FROM subrace_traits WHERE sub_id = $1", [sub.id])

        if (results.length === 0) {
            throw new NotFoundError("No Subrace Traits found", "Could not find any Traits for that Subrace in the Database!");
        }
  
        return results;
    };

    static async getOne(sub, trait) {
        if (trait.id) {
            const results = await query("SELECT * FROM subrace_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])

            if (results.length === 0) {
                throw new NotFoundError("Subrace Trait not found", "Could not find that Trait for that Subrace in the Database!");
            }

            return results[0];
        }

        const results = await this.query("SELECT * FROM subrace_traits WHERE sub_id = $1 AND name = $2", [sub.id, trait.name])

        if (results.length === 0) {
            throw new NotFoundError("Subrace Trait not found", "Could not find a Trait with that name for that Subrace in the Database!");
        }

        return results[0];
    };

    static async exists(sub, trait) {
        if (trait.id) {
            const results = await this.query("SELECT * FROM subrace_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])
      
            return results.length === 1;
        }
    
        const results = await this.query("SELECT * FROM subrace_traits WHERE sub_id = $1 AND name = $2", [sub.id, trait.name])
    
        return results.length === 1;
    };

    static async add(sub, trait) {
        if (await this.exists(sub, trait)) {
            throw new DuplicateError("Duplicate Subrace Trait", "That Trait is already linked to that Subrace in the Database!");
        }

        const sql = "INSERT INTO subrace_traits (sub_id, level, name, description, type, visible, val, replace, abil_replace, dmg_dice, dmg_dice_size, dmg_stat) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)";
        await query(sql, [sub.id, trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat])

        return "Successfully added Subrace Trait to Database";
    };

    static async remove(sub, trait) {
        if (!(await this.exists(sub, trait))) {
            throw new NotFoundError("Subrace Trait not found", "Could not find that Trait for that Subrace in the Database!");
        }

        await query("DELETE FROM subrace_traits WHERE sub_id = $1 AND id = $2", [sub.id, trait.id])

        return "Successfully removed Subrace Trait from Database";
    };

    static async update(sub, trait) {
        if (!(await this.exists(sub, trait))) {
            throw new NotFoundError("Subrace Trait not found", "Could not find that Trait for that Subrace in the Database!");
        }

        const sql = "UPDATE subrace_traits SET level = $1, name = $2, description = $3, type = $4, visible = $5, val = $6, replace = $7, abil_replace = $8, dmg_dice = $9, dmg_dice_size = $10, dmg_stat = $11 WHERE sub_id = $12 AND id = $13";
        await query(sql, [trait.level, trait.name, trait.description, trait.type, trait.visible, trait.val, trait.replace, trait.abil_replace, trait.dmg_dice, trait.dmg_dice_size, trait.dmg_stat, sub.id, trait.id])

        return "Successfully updated Subrace Trait in Database";
    };
};

export { SubraceTrait };