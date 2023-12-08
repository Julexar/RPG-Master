import { psql } from './psql.js';
import { NotFoundError, DuplicateError } from '../custom/errors/index.js';
import { Condition } from './condition.js';
import { Damagetype } from './dmgtype.js';
const query = psql.query;

class CharacterImmunity {
    static async getAll(server, char, immune) {
        const results = await this.query('SELECT * FROM character_immunities WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Immunities found', 'Could not find any Immunities for that Character in the Database!');
        }

        return Promise.all(
            results.mao(async (charImmune) => {
                let dbImmune;

                switch (charImmune.type) {
                    case 'damagetype':
                        dbImmune = await Damagetype.getOne(server, { id: charImmune.imm_id });
                        break;
                    case 'condition':
                        dbImmune = await Condition.getOne(server, { id: charImmune.imm_id });
                        break;
                }

                return {
                    id: charImmune.id,
                    name: dbImmune.name,
                    type: charImmune.type,
                    name: dbImmune.name,
                    imm_id: dbImmune.id,
                };
            })
        );
    }

    static async getOne(server, char, immune) {
        if (immune.id) {
            const results = await this.query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');
            }

            const charImmune = results[0];
            let dbImmune;

            switch (charImmune.type) {
                case 'damagetype':
                    dbImmune = await Damagetype.getOne(server, { id: charImmune.imm_id });
                    break;
                case 'condition':
                    dbImmune = await Condition.getOne(server, { id: charImmune.imm_id });
                    break;
            }

            return {
                id: charImmune.id,
                name: dbImmune.name,
                type: charImmune.type,
                name: dbImmune.name,
                imm_id: dbImmune.id,
            };
        }

        let dbImmune;

        switch (charImmune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { id: charImmune.imm_id });
                break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { id: charImmune.imm_id });
                break;
        }

        const results = await this.query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character Immunity not found', 'Could not find an Immunity with that name for that Character in the Database!');
        }

        const charImmune = results[0];

        return {
            id: charImmune.id,
            name: dbImmune.name,
            type: charImmune.type,
            name: dbImmune.name,
            imm_id: dbImmune.id,
        };
    }

    static async exists(server, char, immune) {
        if (immune.id) {
            const results = await this.query('SELECT * FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

            return results.length === 1;
        }

        let dbImmune;

        switch (charImmune.type) {
            case 'damagetype':
                dbImmune = await Damagetype.getOne(server, { id: charImmune.imm_id });
                break;
            case 'condition':
                dbImmune = await Condition.getOne(server, { id: charImmune.imm_id });
                break;
        }

        const results = await this.query('SELECT * FROM character_immunities WHERE char_id = $1 AND imm_id = $2', [char.id, dbImmune.id]);

        return results.length === 1;
    }

    static async add(server, char, immune) {
        if (await this.exists(server, char, immune)) {
            throw new DuplicateError('Duplicate Character Immunity', 'That Immunity is already linked to that Character!');
        }

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

        const sql = 'INSERT INTO character_immunities (char_id, type, imm_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, immune.type, immune.imm_id]);

        return 'Successfully added Character Immunity to Database';
    }

    static async remove(server, char, immune) {
        if (!(await this.exists(server, char, immune))) {
            throw new NotFoundError('Character Immunity not found', 'Could not find that Immunity for that Character in the Database!');
        }

        await query('DELETE FROM character_immunities WHERE char_id = $1 AND id = $2', [char.id, immune.id]);

        return 'Successfully removed Character Immunity from Database';
    }
}

export { CharacterImmunity };
