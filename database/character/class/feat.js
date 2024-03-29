import { psql } from '../../psql.js';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { ServerFeats } from '../../server/feat.js';
const query = psql.query;

class CharacterClassFeat {
    static async getAll(server, char, clas) {
        const results = await query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2', [char.id, clas.id]);

        if (results.length === 0)
            throw new NotFoundError(
                'No Character (class-only) Feats found',
                "Could not find any Feats granted by the Character's Class in the Database!"
            );

        return Promise.all(
            results.map(async charFeat => {
                const dbFeat = await ServerFeats.getOne(server, { id: charFeat.feat_id });

                if (charFeat.deleted_at) return;

                return {
                    id: charFeat.id,
                    char_id: char.id,
                    class_id: clas.id,
                    feat: dbFeat,
                    overwrites: charFeat.overwrites,
                    deleted_at: charFeat.deleted_at,
                };
            })
        );
    }

    static async getOne(server, char, clas, feat) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, feat.id]);

            if (results.length === 0)
                throw new NotFoundError(
                    'Character (class-only) Feat not found',
                    'Could not find that Feat granted by that Class for that Character in the Database!'
                );

            const charFeat = results[0];
            const dbFeat = await ServerFeats.getOne(server, { id: charFeat.feat_id });

            if (charFeat.deleted_at)
                throw new BadRequestError(
                    'Character (class-only) Feat deleted',
                    'The Character (class-only) Feat you are trying to view has been deleted!'
                );

            return {
                id: charFeat.id,
                char_id: char.id,
                class_id: clas.id,
                feat: dbFeat,
                overwrites: charFeat.overwrites,
                deleted_at: charFeat.deleted_at,
            };
        }

        if (feat.feat.id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
            const results = await query(sql, [char.id, clas.id, feat.feat_id]);

            if (results.length === 0)
                throw new NotFoundError(
                    'Character (class-only) Feat not found',
                    'Could not find that Feat granted by that Class for that Character in the Database!'
                );

            const charFeat = results[0];
            const dbFeat = await ServerFeats.getOne(server, { id: feat.feat_id });

            if (charFeat.deleted_at)
                throw new BadRequestError(
                    'Character (class-only) Feat deleted',
                    'The Character (class-only) Feat you are trying to view has been deleted!'
                );

            return {
                id: charFeat.id,
                char_id: char.id,
                class_id: clas.id,
                feat: dbFeat,
                overwrites: charFeat.overwrites,
                deleted_at: charFeat.deleted_at,
            };
        }

        const dbFeat = await ServerFeats.getOne(server, { name: feat.name });
        const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
        const results = await query(sql, [char.id, clas.id, dbFeat.id]);

        if (results.length === 0)
            throw new NotFoundError(
                'Character (class-only) Feat not found',
                'Could not find that Feat granted by that Class for that Character in the Database!'
            );

        const charFeat = results[0];

        if (charFeat.deleted_at)
            throw new BadRequestError(
                'Character (class-only) Feat deleted',
                'The Character (class-only) Feat you are trying to view has been deleted!'
            );

        return {
            id: charFeat.id,
            char_id: char.id,
            class_id: clas.id,
            feat: dbFeat,
            overwrites: charFeat.overwrites,
            deleted_at: charFeat.deleted_at,
        };
    }

    static async exists(server, char, clas, feat) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, feat.id]);

            return results.length === 1;
        }

        if (feat.feat_id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
            const results = await query(sql, [char.id, clas.id, feat.feat_id]);

            return results.length === 1;
        }

        const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
        const dbFeat = await ServerFeats.getOne(server, { name: feat.name });
        const results = await query(sql, [char.id, clas.id, dbFeat.id]);

        return results.length === 1;
    }

    static async isDeleted(server, char, clas, feat) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3';
            const results = await query(sql, [char.id, clas.id, feat.id]);

            return !!results[0].deleted_at;
        }

        if (feat.feat_id) {
            const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
            const results = await query(sql, [char.id, clas.id, feat.feat_id]);

            return !!results[0].deleted_at;
        }

        const dbFeat = await ServerFeats.getOne(server, { name: feat.name });
        const sql = 'SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3';
        const results = await query(sql, [char.id, clas.id, dbFeat.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, char, clas, feat) {
        if (await this.exists(server, char, clas, feat))
            throw new DuplicateError('Duplicate Character (class-only) Feat', 'That Character already has that Feat granted by that Class!');

        if (!feat.feat_id) {
            const dbFeat = await ServerFeats.getOne(server, { name: feat.name });

            feat.feat_id = dbFeat.id;
        }

        const sql = 'INSERT INTO character_class_feats (char_id, class_id, feat_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, clas.id, feat.feat_id]);

        return 'Successfully added Character (class-only) Feat to Database';
    }

    static async remove_final(server, char, clas, feat) {
        if (!(await this.exists(server, char, clas, feat)))
            throw new NotFoundError(
                'Character (class-only) Feat not found',
                'Could not find that Feat granted by that Class for that Character in the Database!'
            );

        await query('DELETE FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, feat.id]);

        return 'Successfully removed Character (class-only) Feat from Database';
    }

    static async remove(server, char, clas, feat) {
        if (!(await this.exists(server, char, clas, feat)))
            throw new NotFoundError(
                'Character (class-only) Feat not found',
                'Could not find that Feat granted by that Class for that Character in the Database!'
            );

        if (await this.isDeleted(server, char, clas, feat))
            throw new BadRequestError(
                'Character (class-only) Feat deleted',
                'The Character (class-only) Feat you are trying to remove has already been deleted!'
            );

        const sql = 'UPDATE character_class_feats SET deleted_at = $1 WHERE char_id = $2 AND class_id = $3 AND id = $4';
        await query(sql, [Date.now(), char.id, clas.id, feat.id]);

        return 'Successfully marked Character (class-only) Feat as deleted in Database';
    }

    static async update(server, char, clas, feat) {
        if (!(await this.exists(server, char, clas, feat)))
            throw new NotFoundError(
                'Character (class-only) Feat not found',
                'Could not find that Feat granted by that Class for that Character in the Database!'
            );

        if (await this.isDeleted(server, char, clas, feat))
            throw new BadRequestError(
                'Character (class-only) Feat deleted',
                'The Character (class-only) Feat you are trying to update has been deleted!'
            );

        const sql = 'UPDATE character_class_feats SET overwrites = $1::JSON WHERE char_id = $2 AND class_id = $3 AND id = $4';
        await query(sql, [feat.overwrites, char.id, clas.id, feat.id]);

        return 'Successfully updated Character (class-only) Feat in Database';
    }

    static async restore(server, char, clas, feat) {
        if (!(await this.exists(server, char, clas, feat)))
            throw new NotFoundError(
                'Character (class-only) Feat not found',
                'Could not find that Feat granted by that Class for that Character in the Database!'
            );

        if (!(await this.isDeleted(server, char, clas, feat)))
            throw new BadRequestError(
                'Character (class-only) Feat not deleted',
                'The Character (class-only) Feat you are trying to restore is not deleted!'
            );

        const sql = 'UPDATE character_class_feats SET deleted_at = NULL WHERE char_id = $2 AND class_id = $3 AND id = $4';
        await query(sql, [char.id, clas.id, feat.id]);

        return 'Successfully restored Character (class-only) Feat in Database';
    }
}

export { CharacterClassFeat };
