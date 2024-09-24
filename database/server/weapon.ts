import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, DuplicateError, BadRequestError } from '../../custom/errors';
import { Weapon } from '..';
const query = psql.query;

interface DBServerWeapon {
    id: bigint;
    server_id: bigint;
    weapon_id: bigint;
    overwrites: JSON;
    deleted_at: Date | null;
}

class ServerWeapon {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1', [server.id]) as DBServerWeapon[];

        if (results.length === 0) throw new NotFoundError('No Server Weapons found', 'Could not find any Server Weapons in the Database!');

        return results.map((weapon) => {
            if (weapon.deleted_at) return;

            return weapon;
        });
    }

    static async getOne(server: Guild, weapon: { id?: bigint, name?: string }) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]) as DBServerWeapon[];

            if (results.length === 0) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to view has been deleted!');

            return results[0];
        }

        const dbWeapon = await Weapon.getOne(weapon);
        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]) as DBServerWeapon[];

        if (results.length === 0) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to view has been deleted!');

        return results[0];
    }

    static async exists(server: Guild, weapon: { id?: bigint, name?: string }) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]) as DBServerWeapon[];

            return results.length === 1;
        }

        const dbWeapon = await Weapon.getOne(weapon);
        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]) as DBServerWeapon[];

        return results.length === 1;
    }

    static async isDeleted(server: Guild, weapon: { id?: bigint, name?: string }) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]) as DBServerWeapon[];

            return !!results[0].deleted_at;
        }

        const dbWeapon = await Weapon.getOne(weapon);
        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]) as DBServerWeapon[];

        return !!results[0].deleted_at;
    }

    static async add(server: Guild, weapon: { id?: bigint, name?: string }) {
        if (await this.exists(server, weapon)) throw new DuplicateError('Duplicate Server Weapon', 'This Server Weapon already exists in the Database!');

        const dbWeapon = await Weapon.getOne(weapon);
        const sql = 'INSERT INTO server_weapons (server_id, weapon_id) VALUES ($1, $2)';
        await query(sql, [server.id, dbWeapon.id]);

        return 'Successfully added Server Weapon to Database';
    }

    static async remove(server: Guild, weapon: { id: bigint}) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (await this.isDeleted(server, weapon)) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to remove has been deleted!');

        await query('UPDATE server_weapons SET deleted_at = $1 WHERE server_id = $2 AND weapon_id = $3', [Date.now(), server.id, weapon.id]);

        return 'Successfully marked Server Weapon as deleted in Database';
    }

    static async remove_final(server: Guild, weapon: { id: bigint }) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        await query('DELETE FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]);

        return 'Successfully removed Server Weapon from Database';
    }

    static async update(server: Guild, weapon: { id: bigint, overwrites: JSON }) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (await this.isDeleted(server, weapon)) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to update has been deleted!');

        const sql = 'UPDATE server_weapons SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3';
        await query(sql, [JSON.stringify(weapon.overwrites), server.id, weapon.id]);

        return 'Successfully updated Server Weapon in Database';
    }

    static async restore(server: Guild, weapon: { id: bigint }) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (!(await this.isDeleted(server, weapon))) throw new BadRequestError('Server Weapon not deleted', 'The Server Weapon you are trying to restore is not deleted!');

        await query('UPDATE server_weapons SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [null, server.id, weapon.id]);

        return 'Successfully restored Server Weapon in Database';
    }
}

export { ServerWeapon };