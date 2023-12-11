import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Feats } from '../server_feats.js';
const query = psql.query;

class CharacterClassFeat {
    static async getAll(server, char, clas) {
        const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2', [char.id, clas.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Character (class-only) Feats found', "Could not find any Feats granted by the Character's Class in the Database!");
        }

        return Promise.all(
            results.map(async (charFeat) => {
                const dbFeat = await Feats.getOne(server, { id: charFeat.feat_id });

                return {
                    id: charFeat.id,
                    char_id: char.id,
                    class_id: clas.id,
                    feat_id: dbFeat.id,
                    name: dbFeat.name,
                    description: dbFeat.description,
                    visible: dbFeat.visible,
                };
            })
        );
    }

    static async getOne(server, char, clas, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Character (class-only) Feat not found', 'Could not find that Feat granted by that Class for that Character in the Database!');
            }

            const charFeat = results[0];
            const dbFeat = await this.getFeat(server, { id: charFeat.feat_id });

            return {
                id: charFeat.id,
                char_id: char.id,
                class_id: clas.id,
                feat_id: dbFeat.id,
                name: dbFeat.name,
                description: dbFeat.description,
                visible: dbFeat.visible,
            };
        }

        if (feat.feat_id) {
            const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3', [char.id, clas.id, feat.feat_id]);

            if (results.length === 0) {
                throw new NotFoundError('Character (class-only) Feat not found', 'Could not find that Feat granted by that Class for that Character in the Database!');
            }

            const charFeat = results[0];
            const dbFeat = await this.getFeat(server, { id: feat.feat_id });

            return {
                id: charFeat.id,
                char_id: char.id,
                class_id: clas.id,
                feat_id: dbFeat.id,
                name: dbFeat.name,
                description: dbFeat.description,
                visible: dbFeat.visible,
            };
        }

        const dbFeat = await this.getFeat(server, { name: feat.name });
        const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3', [char.id, clas.id, dbFeat.id]);

        if (results.length === 0) {
            throw new NotFoundError('Character (class-only) Feat not found', 'Could not find that Feat granted by that Class for that Character in the Database!');
        }

        const charFeat = results[0];

        return {
            id: charFeat.id,
            char_id: char.id,
            class_id: clas.id,
            feat_id: dbFeat.id,
            name: dbFeat.name,
            description: dbFeat.description,
            visible: dbFeat.visible,
        };
    }

    static async exists(server, char, clas, feat) {
        if (feat.id) {
            const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, feat.id]);

            return results.length === 1;
        }

        if (feat.feat_id) {
            const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3', [char.id, clas.id, feat.feat_id]);

            return results.length === 1;
        }

        const dbFeat = await this.getFeat(server, { name: feat.name });
        const results = await this.query('SELECT * FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND feat_id = $3', [char.id, clas.id, dbFeat.id]);

        return results.length === 1;
    }

    static async add(server, char, clas, feat) {
        if (await this.exists(server, char, clas, feat)) {
            throw new DuplicateError('Duplicate Character (class-only) Feat', 'That Character already has that Feat granted by that Class!');
        }

        if (!feat.feat_id) {
            const dbFeat = await this.getFeat(server, { name: feat.name });

            feat.feat_id = dbFeat.id;
        }

        const sql = 'INSERT INTO character_class_feats (char_id, class_id, feat_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, clas.id, feat.feat_id]);

        return 'Successfully added Character (class-only) Feat to Database';
    }

    static async remove(server, char, clas, feat) {
        if (!(await this.exists(server, char, clas, feat))) {
            throw new NotFoundError('Character (class-only) Feat not found', 'Could not find that Feat granted by that Class for that Character in the Database!');
        }

        await query('DELETE FROM character_class_feats WHERE char_id = $1 AND class_id = $2 AND id = $3', [char.id, clas.id, feat.id]);

        return 'Successfully removed Character (class-only) Feat from Database';
    }
}

export { CharacterClassFeat };
