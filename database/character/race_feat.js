import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Feats } from '../server/server_feats.js';
const query = psql.query;

class CharacterRaceFeat {
    static async getAll(server, char, race) {
        const results = await this.query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2', [char.id, race.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Race Feats found', 'Could not find any racial Feats for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charRaceFeat) => {
                const dbFeat = await Feats.getOne(server, { id: charRaceFeat.feat_id });

                return {
                    id: charRaceFeat.id,
                    char_id: char.id,
                    race_id: race.id,
                    feat_id: dbFeat.id,
                    name: dbFeat.name,
                    description: dbFeat.description,
                };
            })
        );
    }

    static async getOne(server, char, race, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3', [char.id, race.id, feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');
            }

            const charRaceFeat = results[0];
            const dbFeat = await Feats.getOne(server, { id: charRaceFeat.feat_id });

            return {
                id: charRaceFeat.id,
                char_id: char.id,
                race_id: race.id,
                feat_id: dbFeat.id,
                name: dbFeat.name,
                description: dbFeat.description,
            };
        }

        const dbFeat = await Feats.getOne(server, { name: feat.name });
        const results = await this.query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3', [char.id, race.id, dbFeat.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character Race Feat not found', 'Could not find a racial Feat with that name for that Character in the Database!');
        }

        const charRaceFeat = results[0];

        return {
            id: charRaceFeat.id,
            char_id: char.id,
            race_id: race.id,
            feat_id: dbFeat.id,
            name: dbFeat.name,
            description: dbFeat.description,
        };
    }

    static async exists(server, char, race, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3', [char.id, race.id, feat.id]);

            return results.length === 1;
        }

        const dbFeat = await Feats.getOne(server, { name: feat.name });
        const results = await this.query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3', [char.id, race.id, dbFeat.id]);

        return results.length === 1;
    }

    static async add(server, char, race, feat) {
        if (await this.exists(server, char, race, feat)) {
            throw new DuplicateError('Duplicate Character Race Feat', 'That Character already has that racial Feat!');
        }

        const sql = 'INSERT INTO character_race_feats (char_id, race_id, feat_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, race.id, feat.feat_id]);

        return 'Successfully added Race Feat to Character in Database';
    }

    static async remove(server, char, race, feat) {
        if (!(await this.exists(server, char, race, feat))) {
            throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');
        }

        await query('DELETE FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3', [char.id, race.id, feat.id]);

        return 'Successfully removed racial Feat from Character in Database';
    }

    static async update(server, char, race, feat) {
        if (!(await this.exists(server, char, race, feat))) {
            throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');
        }

        const sql = 'UPDATE character_race_feats SET feat_id = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4';
        await query(sql, [feat.feat_id, char.id, race.id, feat.id]);

        return 'Successfully updated Character Race Feat in Database';
    }
}

export { CharacterRaceFeat };
