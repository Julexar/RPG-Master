import { psql } from '../psql.js';
import { DuplicateError, NotFoundError, BadRequestError } from '../../custom/errors';
import { Weapon } from '../global';
const query = psql.query;

class ServerWeapon {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1', [server.id]);

        if (results.length === 0) throw new NotFoundError('No Server Weapons found', 'Could not find any Server Weapons in the Database!');

        return results.map(async (servWeapon) => {
            const dbWeapon = await Weapon.getOne({id: servWeapon.weapon_id});

            if (servWeapon.deleted_at) return;

            return {
                id: servWeapon.id,
                server_id: server.id,
                weapon: dbWeapon,
                overwrites: servWeapon.overwrites,
                deleted_at: servWeapon.deleted_at
            }
        });
    }

    static async getOne(server, weapon) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]);

            if (results.length === 0) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

            const dbWeapon = await Weapon.getOne({id: results[0].weapon_id});
            const servWeapon = results[0];

            if (servWeapon.deleted_at) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to view has been deleted!');

            return {
                id: servWeapon.id,
                server_id: server.id,
                weapon: dbWeapon,
                overwrites: servWeapon.overwrites,
                deleted_at: servWeapon.deleted_at
            }
        }

        const dbWeapon = await Weapon.getOne({name: weapon.name});

        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]);

        if (results.length === 0) throw new NotFoundError('Server Weapon not found', 'Could not find a Server Weapon with that Server ID and Weapon ID in the Database!');

        const servWeapon = results[0];

        if (servWeapon.deleted_at) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to view has been deleted!');

        return {
            id: servWeapon.id,
            server_id: server.id,
            weapon: dbWeapon,
            overwrites: servWeapon.overwrites,
            deleted_at: servWeapon.deleted_at
        }
    }

    static async exists(server, weapon) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]);

            return results.length === 1;
        }

        const dbWeapon = await Weapon.getOne({name: weapon.name});

        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]);

        return results.length === 1;
    }

    static async isDeleted(server, weapon) {
        if (weapon.id) {
            const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]);

            return !!results[0].deleted_at;
        }

        const dbWeapon = await Weapon.getOne({name: weapon.name});

        const results = await query('SELECT * FROM server_weapons WHERE server_id = $1 AND weapon_id = $2', [server.id, dbWeapon.id]);

        return !!results[0].deleted_at;
    }

    static async add(server, weapon) {
        if (await this.exists(server, weapon)) throw new DuplicateError('Server Weapon already exists', 'A Server Weapon with that Server ID and Weapon ID already exists in the Database!');

        const dbWeapon = await Weapon.getOne({name: weapon.name});

        const sql = 'INSERT INTO server_weapons (server_id, weapon_id, overwrites) VALUES($1, $2, $3::JSON)'
        await query(sql, [server.id, dbWeapon.id, weapon.overwrites]);

        return 'Successfully added Weapon to Server in Database';
    }

    static async remove(server, weapon) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (await this.isDeleted(server, weapon)) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to remove has already been deleted!');

        const sql = 'UPDATE server_weapons SET deleted_at = $1 WHERE server_id = $2 AND id = $3';
        await query(sql, [Date.now(), server.id, weapon.id]);

        return 'Successfully marked Weapon as deleted for Server in Database';
    }

    static async remove_final(server, weapon) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        await query('DELETE FROM server_weapons WHERE server_id = $1 AND id = $2', [server.id, weapon.id]);

        return 'Successfully removed Weapon from Server in Database';
    }

    static async update(server, weapon) {
        if (!(await this.exists(server, weapon))) throw new NotFoundError('Server Weapon not found', 'Could not find that Server Weapon in the Database!');

        if (await this.isDeleted(server, weapon)) throw new BadRequestError('Server Weapon deleted', 'The Server Weapon you are trying to update has been deleted!');

        const sql = 'UPDATE server_weapons SET overwrites = $1::JSON WHERE server_id = $2 AND id = $3';
        await query(sql, [weapon.overwrites, server.id, weapon.id]);

        return 'Successfully updated Weapon for Server in Database';
    }
}

export { ServerWeapon };