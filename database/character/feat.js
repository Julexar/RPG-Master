import { psql } from '../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { ServerFeats } from '../server/feat.js';
const query = psql.query;

class CharacterFeat {
    static async getAll(server, char) {
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1', [char.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character Feats found', 'Could not find any Feats for that Character in the Database!');
        }

        return Promise.all(
            results.map(async (charFeat) => {
                const dbFeat = await ServerFeats.getOne(server, { id: charFeat.feat_id });

                if (charFeat.deleted_at) return;

                return {
                    id: charFeat.id,
                    char_id: char.id,
                    feat: dbFeat,
                    overwrites: charFeat.overwrites,
                    deleted_at: charFeat.deleted_at
                };
            })
        );
    }

    static async getOne(server, char, feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

            if (results.length === 0) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

            const charFeat = results[0];
            const dbFeat = await ServerFeats.getOne(server, { id: charFeat.feat_id });

            if (charFeat.deleted_at) throw new BadRequestError('Character Feat deleted', 'The Character Feat you are trying to view has been deleted!');

            return {
                id: charFeat.id,
                char_id: char.id,
                feat: dbFeat,
                overwrites: charFeat.overwrites,
                deleted_at: charFeat.deleted_at
            };
        }

        const dbFeat = await ServerFeats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]);

        if (results.length === 0) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        const charFeat = results[0];

        if (charFeat.deleted_at) throw new BadRequestError('Character Feat deleted', 'The Character Feat you are trying to view has been deleted!');

        return {
            id: charFeat.id,
            char_id: char.id,
            feat: dbFeat,
            overwrites: charFeat.overwrites,
            deleted_at: charFeat.deleted_at
        };
    }

    static async exists(char, feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

            return results.length === 1;
        }

        const dbFeat = await ServerFeats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]);

        return results.length === 1;
    }

    static async isDeleted(char, feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

            return !!results[0].deleted_at;
        }

        const dbFeat = await ServerFeats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, char, feat) {
        if (await this.exists(char, feat)) throw new DuplicateError('Duplicate Character Feat', 'That Feat is already linked to that Character!');

        if (!(await ServerFeats.exists(server, { id: feat.feat_id }))) throw new BadRequestError('Invalid Feat', 'That Feat does not exist in the Database!');

        await query('INSERT INTO character_feats (char_id, feat_id) VALUES ($1, $2)', [char.id, feat.feat_id]);

        return 'Successfully added Feat to Character in Database';
    }

    static async remove(char, feat) {
        if (!(await this.exists(char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        await query('UPDATE character_feats SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, feat.id]);

        return 'Successfully marked Feat as deleted for Character in Database';
    }

    static async remove_final(char, feat) {
        if (!(await this.exists(char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        await query('DELETE FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

        return 'Successfully removed Feat from Character in Database';
    }

    static async update(char, feat) {
        if (!(await this.exists(char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        if (await this.isDeleted(char, feat)) throw new BadRequestError('Character Feat deleted', 'The Character Feat you are trying to update has been deleted!');
        
        await query('UPDATE character_feats SET overwrites = $1 WHERE char_id = $2 AND id = $3', [feat.overwrites, char.id, feat.id]);

        return 'Successfully updated Feat for Character in Database';
    }
}

export { CharacterFeat };
