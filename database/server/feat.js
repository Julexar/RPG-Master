import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
import { Feats } from '../global/feats.js';
const query = psql.query;

class ServerFeats {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Server Feats found', 'Could not find any Server Feats in the Database!');
        }

        return Promise.all(
            results.map(async (servFeat) => {
                const dbFeat = await Feats.getOne({ id: servFeat.feat_id });

                return {
                    id: servFeat.id,
                    server_id: server.id,
                    feat_id: dbFeat.id,
                    name: dbFeat.name,
                    description: dbFeat.description,
                    type: dbFeat.type,
                    option: dbFeat.option,
                };
            })
        );
    }

    static async getOne(server, feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

            if (results.length === 0) {
                throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');
            }

            const servFeat = results[0];
            const dbFeat = await Feats.getOne({ id: servFeat.feat_id });

            return {
                id: servFeat.id,
                server_id: server.id,
                feat_id: dbFeat.id,
                name: dbFeat.name,
                description: dbFeat.description,
                type: dbFeat.type,
                option: dbFeat.option,
            };
        }

        const dbFeat = await Feats.getOne({ name: feat.name });
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND feat_id = $2', [server.id, dbFeat.id]);

        if (results.length === 0) {
            throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');
        }

        const servFeat = results[0];

        return {
            id: servFeat.id,
            server_id: server.id,
            feat_id: dbFeat.id,
            name: dbFeat.name,
            description: dbFeat.description,
            type: dbFeat.type,
            option: dbFeat.option,
        };
    }

    static async exists(server, feat) {
        if (feat.id) {
            const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

            return results.length === 1;
        }

        const dbFeat = await Feats.getOne({ name: feat.name });
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND feat_id = $2', [server.id, dbFeat.id]);

        return results.length === 1;
    }

    static async add(server, feat) {
        if (await this.exists(server, feat)) {
            throw new DuplicateError('Duplicate Server Feat', 'That Server Feat already exists in the Database!');
        }

        const sql = 'INSERT INTO server_feats (server_id, feat_id) VALUES($1, $2)';
        await query(sql, [server.id, feat.feat_id]);

        return 'Successfully added Server Feat to Database';
    }

    static async remove(server, feat) {
        if (!(await this.exists(server, feat))) {
            throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');
        }

        await query('DELETE FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

        return 'Successfully removed Server Feat from Database';
    }
}

export { ServerFeats };
