import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Feats } from '..';
const query = psql.query;

interface DBServerFeat {
    id: bigint;
    server_id: bigint;
    feat_id: bigint;
    overwrites: string;
    deleted_at: Date | null;
}

class ServerFeats {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1', [server.id]) as DBServerFeat[];

        if (results.length === 0) throw new NotFoundError('No Server Feats found', 'Could not find any Server Feats in the Database!');

        return Promise.all(
            results.map(async servFeat => {
                const dbFeat = await Feats.getOne({ id: servFeat.feat_id });

                if (servFeat.deleted_at) return;

                return {
                    id: servFeat.id,
                    server_id: server.id,
                    feat: dbFeat,
                    overwrites: servFeat.overwrites,
                    deleted_at: servFeat.deleted_at,
                };
            })
        );
    }

    static async getOne(server: Guild, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]) as DBServerFeat[];

            if (results.length === 0) throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');

            const servFeat = results[0];
            const dbFeat = await Feats.getOne({ id: servFeat.feat_id });

            if (servFeat.deleted_at) throw new BadRequestError('Feat deleted', 'The Feat you are trying to view has been deleted!');

            return {
                id: servFeat.id,
                server_id: server.id,
                feat: dbFeat,
                overwrites: servFeat.overwrites,
                deleted_at: servFeat.deleted_at,
            };
        }

        const dbFeat = await Feats.getOne({ name: feat.name });
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND feat_id = $2', [server.id, dbFeat.id]) as DBServerFeat[];

        if (results.length === 0) throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');

        const servFeat = results[0];

        if (servFeat.deleted_at) throw new BadRequestError('Feat deleted', 'The Feat you are trying to view has been deleted!');

        return {
            id: servFeat.id,
            server_id: server.id,
            feat: dbFeat,
            overwrites: servFeat.overwrites,
            deleted_at: servFeat.deleted_at,
        };
    }

    static async exists(server: Guild, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]) as DBServerFeat[];

            return results.length === 1;
        }

        const dbFeat = await Feats.getOne({ name: feat.name });
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND feat_id = $2', [server.id, dbFeat.id]) as DBServerFeat[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]) as DBServerFeat[];

            return !!results[0].deleted_at;
        }

        const dbFeat = await Feats.getOne({ name: feat.name });
        const results = await query('SELECT * FROM server_feats WHERE server_id = $1 AND feat_id = $2', [server.id, dbFeat.id]) as DBServerFeat[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, feat: { name: string }) {
        if (await this.exists(server, feat)) throw new DuplicateError('Duplicate Server Feat', 'That Server Feat already exists in the Database!');

        const dbFeat = await Feats.getOne({ name: feat.name });
        const sql = 'INSERT INTO server_feats (server_id, feat_id) VALUES($1, $2)';
        await query(sql, [server.id, dbFeat.id]);

        return 'Successfully added Server Feat to Database';
    }

    static async remove_final(server: Guild, feat: { id: bigint }) {
        if (!(await this.exists(server, feat))) throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');

        await query('DELETE FROM server_feats WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

        return 'Successfully removed Server Feat from Database';
    }

    static async remove(server: Guild, feat: { id: bigint }) {
        if (!(await this.exists(server, feat))) throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');

        if (await this.isDeleted(server, feat)) throw new BadRequestError('Feat deleted', 'The Server Feat you are trying to remove has already been deleted!');

        await query('UPDATE server_feats SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, feat.id]);

        return 'Successfully removed Server Feat from Database';
    }

    static async restore(server: Guild, feat: { id: bigint }) {
        if (!(await this.exists(server, feat))) throw new NotFoundError('Server Feat not found', 'Could not find that Server Feat in the Database!');

        if (!(await this.getOne(server, feat)).deleted_at) throw new BadRequestError('Feat not deleted', 'That Server Feat is not deleted!');

        await query('UPDATE server_feats SET deleted_at = NULL WHERE server_id = $1 AND id = $2', [server.id, feat.id]);

        return 'Successfully restored Server Feat in Database';
    }
}

export { ServerFeats };
