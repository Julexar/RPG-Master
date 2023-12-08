import { psql } from './psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../custom/errors/index.js';
import { Feats } from './feats.js';
const query = psql.query;

class CharacterFeat {
    static async getAll(server, char) {
        const results = await this.query('SELECT * FROM character_feats WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Feats found', 'Could not find any Feats for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charFeat) => {
                const dbFeat = await Feats.getOne(server, { id: charFeat.feat_id });

                return {
                    id: charFeat.id,
                    name: dbFeat.name,
                    description: dbFeat.description,
                    feat_id: dbFeat.id,
                };
            })
        );
    }

    static async getOne(server, char, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');
            }

            const charFeat = results[0];
            const dbFeat = await Feats.getOne(server, { id: charFeat.feat_id });

            return {
                id: charFeat.id,
                name: dbFeat.name,
                description: dbFeat.description,
                feat_id: dbFeat.id,
            };
        }

        const dbFeat = await Feats.getOne(server, feat);
        const results = await this.query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');
        }

        const charFeat = results[0];

        return {
            id: charFeat.id,
            name: dbFeat.name,
            description: dbFeat.description,
            feat_id: dbFeat.id,
        };
    }

    static async exists(char, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

            return results.length === 1;
        }

        const dbFeat = await Feats.getOne(server, feat);
        const results = await this.query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]);

        return results.length === 1;
    }

    static async add(server, char, feat) {
        if (await this.exists(char, feat)) {
            throw new DuplicateError('Duplicate Character Feat', 'That Feat is already linked to that Character!');
        }

        if (!(await Feats.exists(server, { id: feat.feat_id }))) {
            throw new BadRequestError('Invalid Feat', 'That Feat does not exist in the Database!');
        }

        await query('INSERT INTO character_feats (char_id, feat_id) VALUES ($1, $2)', [char.id, feat.feat_id]);

        return 'Successfully added Feat to Character in Database';
    }

    static async remove(char, feat) {
        if (!(await this.exists(char, feat))) {
            throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');
        }

        await query('DELETE FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

        return 'Successfully removed Feat from Character in Database';
    }
}

export { CharacterFeat };
