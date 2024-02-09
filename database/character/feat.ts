import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Server } from '..';
const query = psql.query;

interface CharFeat {
    id: bigint;
    char_id: bigint;
    feat_id: bigint;
    overwrites: string;
    deleted_at: Date | null;
}

interface AddCharFeat {
    id?: bigint;
    name?: string;
    overwrites: JSON | null;
}

class CharacterFeat {
    static async getAll(server: Guild, char: { id: bigint }) {
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1', [char.id]) as CharFeat[];

        if (results.length === 0) throw new NotFoundError('No Character Feats found', 'Could not find any Feats for that Character in the Database!');

        return Promise.all(
            results.map(async (charFeat) => {
                const dbFeat = await Server.feats.getOne(server, { id: charFeat.feat_id });

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

    static async getOne(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]) as CharFeat[];

            if (results.length === 0) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

            const charFeat = results[0];
            const dbFeat = await Server.feats.getOne(server, { id: charFeat.feat_id });

            if (charFeat.deleted_at) throw new BadRequestError('Character Feat deleted', 'The Character Feat you are trying to view has been deleted!');

            return {
                id: charFeat.id,
                char_id: char.id,
                feat: dbFeat,
                overwrites: charFeat.overwrites,
                deleted_at: charFeat.deleted_at
            };
        }

        const dbFeat = await Server.feats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]) as CharFeat[];

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

    static async exists(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]) as CharFeat[];

            return results.length === 1;
        }

        const dbFeat = await Server.feats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]) as CharFeat[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (feat.id) {
            const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]) as CharFeat[];

            return !!results[0].deleted_at;
        }

        const dbFeat = await Server.feats.getOne(server, feat);
        const results = await query('SELECT * FROM character_feats WHERE char_id = $1 AND feat_id = $2', [char.id, dbFeat.id]) as CharFeat[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, char: { id: bigint }, feat: AddCharFeat) {
        if (await this.exists(server, char, feat)) throw new DuplicateError('Duplicate Character Feat', 'That Feat is already linked to that Character!');

        const dbFeat = await Server.feats.getOne(server, feat);
        await query('INSERT INTO character_feats (char_id, feat_id) VALUES ($1, $2)', [char.id, dbFeat.id]);

        return 'Successfully added Feat to Character in Database';
    }

    static async remove(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (!(await this.exists(server, char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        await query('UPDATE character_feats SET deleted_at = $1 WHERE char_id = $2 AND id = $3', [Date.now(), char.id, feat.id]);

        return 'Successfully marked Feat as deleted for Character in Database';
    }

    static async remove_final(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (!(await this.exists(server, char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        await query('DELETE FROM character_feats WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

        return 'Successfully removed Feat from Character in Database';
    }

    static async update(server: Guild, char: { id: bigint }, feat: CharFeat) {
        if (!(await this.exists(server, char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        if (await this.isDeleted(server, char, feat)) throw new BadRequestError('Character Feat deleted', 'The Character Feat you are trying to update has been deleted!');
        
        await query('UPDATE character_feats SET overwrites = $1 WHERE char_id = $2 AND id = $3', [feat.overwrites, char.id, feat.id]);

        return 'Successfully updated Feat for Character in Database';
    }

    static async restore(server: Guild, char: { id: bigint }, feat: { id?: bigint, name?: string }) {
        if (!(await this.exists(server, char, feat))) throw new NotFoundError('Character Feat not found', 'Could not find that Feat for that Character in the Database!');

        if (!(await this.isDeleted(server, char, feat))) throw new BadRequestError('Character Feat not deleted', 'The Character Feat you are trying to restore has not been deleted!');

        await query('UPDATE character_feats SET deleted_at = NULL WHERE char_id = $1 AND id = $2', [char.id, feat.id]);

        return 'Successfully restored Feat for Character in Database';
    }
}

export { CharacterFeat };
