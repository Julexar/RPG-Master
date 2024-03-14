import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors';
import { Condition, Damagetype } from '../global';
const query = psql.query;

class CharacterResistance {
    static async getAll(server, char) {
        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Resistances found', 'Could not find any Resistances for that Character in the Database!');
        }

        return Promise.all(
            results.map(async charResist => {
                let dbResist;

                switch (charResist.type) {
                    case 'damagetype':
                        dbResist = await Damagetype.getOne(server, { id: charResist.res_id });
                        break;
                    case 'condition':
                        dbResist = await Condition.getOne(server, { id: charResist.res_id });
                        break;
                }

                return {
                    id: charResist.id,
                    name: dbResist.name,
                    type: charResist.type,
                    name: dbResist.name,
                    res_id: dbResist.id,
                };
            })
        );
    }

    static async getOne(server, char, resist) {
        if (resist.id) {
            const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');
            }

            const charResist = results[0];
            let dbResist;

            switch (charResist.type) {
                case 'damagetype':
                    dbResist = await Damagetype.getOne(server, { id: charResist.res_id });
                    break;
                case 'condition':
                    dbResist = await Condition.getOne(server, { id: charResist.res_id });
                    break;
            }

            return {
                id: charResist.id,
                name: dbResist.name,
                type: charResist.type,
                name: dbResist.name,
                res_id: dbResist.id,
            };
        }

        let dbResist;

        switch (resist.type) {
            case 'damagetype':
                dbResist = await Damagetype.getOne(server, { name: resist.name });
                break;
            case 'condition':
                dbResist = await Condition.getOne(server, { name: resist.name });
                break;
        }

        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2', [char.id, dbResist.id]);

        if (results.length === 0) {
            throw new NotFoundError(
                'Character Resistance not found',
                'Could not find a Resistance with that name for that Character in the Database!'
            );
        }

        const charResist = results[0];

        return {
            id: charResist.id,
            name: dbResist.name,
            type: charResist.type,
            name: dbResist.name,
            res_id: dbResist.id,
        };
    }

    static async exists(server, char, resist) {
        if (resist.id) {
            const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resistance.id]);

            return results.length === 1;
        }

        let dbResist;

        switch (resist.type) {
            case 'damagetype':
                dbResist = await Damagetype.getOne(server, { name: resist.name });
                break;
            case 'condition':
                dbResist = await Condition.getOne(server, { name: resist.name });
                break;
        }

        const results = await query('SELECT * FROM character_resistances WHERE char_id = $1 AND res_id = $2', [char.id, dbResist.id]);

        return results.length === 1;
    }

    static async add(server, char, resist) {
        if (await this.exists(server, char, resist)) {
            throw new DuplicateError('Duplicate Character Resistance', 'That Resistance is already linked to that Character!');
        }

        if (!resist.res_id) {
            let dbResist;

            switch (resist.type) {
                case 'damagetype':
                    dbResist = await Damagetype.getOne(server, { name: resist.name });
                    break;
                case 'condition':
                    dbResist = await Condition.getOne(server, { name: resist.name });
                    break;
            }

            resist.res_id = dbResist.id;
        }

        const sql = 'INSERT INTO character_resistances (char_id, type, res_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, resist.type, resist.res_id]);

        return 'Successfully added Resistance to Character in Database';
    }

    static async remove(server, char, resist) {
        if (!(await this.exists(server, char, resist))) {
            throw new NotFoundError('Character Resistance not found', 'Could not find that Resistance for that Character in the Database!');
        }

        await query('DELETE FROM character_resistances WHERE char_id = $1 AND id = $2', [char.id, resist.id]);

        return 'Successfully removed Resistance from Character in Database';
    }
}

export { CharacterResistance };
