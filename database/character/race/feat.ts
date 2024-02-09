import { Guild } from 'discord.js';
import { psql } from '../../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../../custom/errors';
import { Server } from '../..';
const query = psql.query;

interface CharRaceFeat {
    id: bigint;
    char_id: bigint;
    race_id: bigint;
    feat_id: bigint;
    overwrites: JSON | null;
    deleted_at: Date | null;
}

interface AddCharRaceFeat {
    id?: bigint;
    feat_id?: bigint;
    name?: string;
    overwrites: JSON | null;
}

class CharacterRaceFeat {
    static async getAll(server: Guild, char: { id: bigint }, race: { id: bigint }) {
        const results = await query('SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2', [char.id, race.id]) as CharRaceFeat[];

        if (results.length === 0) throw new NotFoundError('No Character Race Feats found', 'Could not find any racial Feats for that Character in the Database!');

        return Promise.all(
            results.map(async (charRaceFeat) => {
                const dbFeat = await Server.feats.getOne(server, { id: charRaceFeat.feat_id });

                if (charRaceFeat.deleted_at) return;

                return {
                    id: charRaceFeat.id,
                    char_id: char.id,
                    race_id: race.id,
                    feat: dbFeat,
                    overwrites: charRaceFeat.overwrites,
                    deleted_at: charRaceFeat.deleted_at
                };
            })
        );
    }

    static async getOne(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3';
            const results = await query(sql, [char.id, race.id, feat.id]) as CharRaceFeat[];

            if (results.length === 0) throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');

            const charRaceFeat = results[0];
            const dbFeat = await Server.feats.getOne(server, { id: charRaceFeat.feat_id });

            if (charRaceFeat.deleted_at) throw new BadRequestError('Character Race Feat deleted', 'The racial Feat you are trying to view for that Character has been deleted!');

            return {
                id: charRaceFeat.id,
                char_id: char.id,
                race_id: race.id,
                feat: dbFeat,
                overwrites: charRaceFeat.overwrites,
                deleted_at: charRaceFeat.deleted_at
            };
        }

        const dbFeat = await Server.feats.getOne(server, { name: feat.name });
        const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3';
        const results = await query(sql, [char.id, race.id, dbFeat.id]) as CharRaceFeat[];

        if (results.length === 0) throw new NotFoundError('Character Race Feat not found', 'Could not find a racial Feat with that name for that Character in the Database!');

        const charRaceFeat = results[0];

        if (charRaceFeat.deleted_at) throw new BadRequestError('Character Race Feat deleted', 'The racial Feat you are trying to view for that Character has been deleted!');

        return {
            id: charRaceFeat.id,
            char_id: char.id,
            race_id: race.id,
            feat: dbFeat,
            overwrites: charRaceFeat.overwrites,
            deleted_at: charRaceFeat.deleted_at
        };
    }

    static async exists(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3';
            const results = await query(sql, [char.id, race.id, feat.id]) as CharRaceFeat[];

            return results.length === 1;
        }

        const dbFeat = await Server.feats.getOne(server, { name: feat.name });
        const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3';
        const results = await query(sql, [char.id, race.id, dbFeat.id]) as CharRaceFeat[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id?: bigint; name?: string }) {
        if (feat.id) {
            const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3';
            const results = await query(sql, [char.id, race.id, feat.id]) as CharRaceFeat[];

            return !!results[0].deleted_at;
        }

        const dbFeat = await Server.feats.getOne(server, { name: feat.name });
        const sql = 'SELECT * FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND feat_id = $3';
        const results = await query(sql, [char.id, race.id, dbFeat.id]) as CharRaceFeat[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: AddCharRaceFeat) {
        if (await this.exists(server, char, race, feat)) throw new DuplicateError('Duplicate Character Race Feat', 'That Character already has that racial Feat!');

        const dbFeat = await Server.feats.getOne(server, feat);
        const sql = 'INSERT INTO character_race_feats (char_id, race_id, feat_id) VALUES($1, $2, $3)';
        await query(sql, [char.id, race.id, dbFeat.id]);

        return 'Successfully added Race Feat to Character in Database';
    }

    static async remove(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id: bigint }) {
        if (!(await this.exists(server, char, race, feat))) throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');

        if (await this.isDeleted(server, char, race, feat)) throw new BadRequestError('Character Race Feat deleted', 'The racial Feat you are trying to remove has already been deleted!');

        const sql = 'UPDATE character_race_feats SET deleted_at = $1 WHERE char_id = $2 AND race_id = $3 AND id = $4';
        await query(sql, [Date.now(), char.id, race.id, feat.id])

        return 'Successfully marked racial Feat as deleted for Character in Database';
    }

    static async remove_final(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id: bigint }) {
        if (!(await this.exists(server, char, race, feat))) throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');

        await query('DELETE FROM character_race_feats WHERE char_id = $1 AND race_id = $2 AND id = $3', [char.id, race.id, feat.id]);

        return 'Successfully removed racial Feat from Character in Database';
    }

    static async update(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: CharRaceFeat) {
        if (!(await this.exists(server, char, race, feat))) throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');

        if (await this.isDeleted(server, char, race, feat)) throw new BadRequestError('Character Race Feat deleted', 'The racial Feat you are trying to update has been deleted!');

        const sql = 'UPDATE character_race_feats SET overwrites = $1::JSON WHERE char_id = $2 AND race_id = $3 AND id = $4';
        await query(sql, [feat.overwrites, char.id, race.id, feat.id]);

        return 'Successfully updated Character Race Feat in Database';
    }

    static async restore(server: Guild, char: { id: bigint }, race: { id: bigint }, feat: { id: bigint }) {
        if (!(await this.exists(server, char, race, feat))) throw new NotFoundError('Character Race Feat not found', 'Could not find that racial Feat for that Character in the Database!');

        if (!(await this.isDeleted(server, char, race, feat))) throw new BadRequestError('Character Race Feat not deleted', 'The racial Feat you are trying to restore has not been deleted!');

        const sql = 'UPDATE character_race_feats SET deleted_at = NULL WHERE char_id = $1 AND race_id = $2 AND id = $3';
        await query(sql, [char.id, race.id, feat.id])

        return 'Successfully restored racial Feat for Character in Database';
    }
}

export { CharacterRaceFeat };
