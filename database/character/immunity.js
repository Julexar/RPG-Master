import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Condition, Damagetype } from '../global';
const query = psql.query;

class CharacterImmunity {
    static async getAll(server, char) {
        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1', [char.id]);

        if (results.length === 0) throw new NotFoundError('No Character Immunities found', 'Could not find any Immunities for that Character in the Database!');

        return Promise.all(
            results.map(async (charImmune) => {
                let dbImmune;

                switch (charImmune.type) {
                    case 'damagetype':
                        dbImmune = await Damagetype.getOne(server, { id: charImmune.imm_id });
                    break;
                    case 'condition':
                        dbImmune = await Condition.getOne(server, { id: charImmune.imm_id });
                    break;
                }

                if (charImmune.deleted_at) return;

                return {
                    id: charImmune.id,
                    name: dbImmune.name,
                    type: charImmune.type,
                    name: dbImmune.name,
                    immune_id: dbImmune.id,
                    deleted_at: charImmune.deleted_at
                };
            })
        );
    }

    static async getOne(server, char, immune) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');
            }

            const charImmune = results[0];
            let dbImmune;

            switch (charImmune.type) {
                case 'damagetype':
                    dbImmune = await Damagetype.getOne(server, { id: charImmune.immune_id });
                break;
                case 'condition':
                    dbImmune = await Condition.getOne(server, { id: charImmune.immune_id });
                break;
            }

            if (charImmune.deleted_at) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to view has been deleted!');

            return {
                id: charImmune.id,
                name: dbImmune.name,
                type: charImmune.type,
                name: dbImmune.name,
                immune_id: dbImmune.id,
                deleted_at: charImmune.deleted_at
            };
        }

        let dbImmune;

        switch (charImmune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { id: charImmune.immune_id });
            break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { id: charImmune.immune_id });
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]);

        if (results.length === 0) throw new NotFoundError('Character Immunity not found', 'Could not find an Immunity with that name for that Character in the Database!');

        const charImmune = results[0];

        if (charImmune.deleted_at) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to view has been deleted!');

        return {
            id: charImmune.id,
            name: dbImmune.name,
            type: charImmune.type,
            name: dbImmune.name,
            immune_id: dbImmune.id,
            deleted_at: charImmune.deleted_at
        };
    }

    static async exists(server, char, immune) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

            return results.length === 1;
        }

        let dbImmune;

        switch (charImmune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { id: charImmune.immune_id });
            break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { id: charImmune.immune_id });
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]);

        return results.length === 1;
    }

    static async isDeleted(server, char, immune) {
        if (immune.id) {
            const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

            return !!results[0].deleted_at;
        }

        let dbImmune;

        switch (charImmune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { id: charImmune.immune_id });
            break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { id: charImmune.immune_id });
            break;
        }

        const results = await query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, char, immune) {
        if (await this.exists(server, char, immune)) throw new DuplicateError('Duplicate Character Immunity', 'That Immunity is already linked to that Character!');

        if (!immune.imm_id) {
            let dbImmune;

            switch (immunity.type) {
                case 'damagetype':
                    dbImmune = await this.getDamagetype(server, { name: immunity.name });
                break;
                case 'condition':
                    dbImmune = await this.getCondition(server, { name: immunity.name });
                break;
            }

            immune.imm_id = dbImmune.id;
        }

        const sql = 'INSERT INTO character_immunities (char_id, type, immune_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, immune.type, immune.immune_id]);

        return 'Successfully added Character Immunity to Database';
    }

    static async remove(server, char, immune) {
        if (!(await this.exists(server, char, immune))) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

        if (await this.isDeleted(server, char, immune)) throw new BadRequestError('Character Immunity deleted', 'The Character Immunity you are trying to remove has already been deleted!');

        await query('UPDATE character_immunities SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, immune.id]);

        return 'Successfully removed Character Immunity from Database';
    }

    static async remove_final(server, char, immune) {
        if (!(await this.exists(server, char, immune))) throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');

        await query('DELETE FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

        return 'Successfully removed Character Immunity from Database';
    }
}

export { CharacterImmunity };
