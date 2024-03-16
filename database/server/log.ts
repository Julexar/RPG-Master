import { Guild } from 'discord.js';
import { psql } from '../psql.ts';
import { NotFoundError, BadRequestError } from '../../custom/errors/index.ts';
import moment from 'moment';
import fs from 'fs';
const query = psql.query;

interface DBServerLog {
    id: bigint;
    server_id: bigint;
    created_at: string;
    deleted_at: Date | null;
}

class ServerLog {
    static async getAll(server: Guild) {
        const results = await query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at DESC', [server.id]) as DBServerLog[];

        if (results.length === 0) throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');

        return results.map((log) => {
            if (log.deleted_at) return;

            return log;
        });
    }

    static async getOne(server: Guild, log: { id?: bigint, created_at?: string }) {
        if (log.id) {
            const results = await query('SELECT * FROM server_logs WHERE server_id = $1 AND id = $2', [server.id, log.id]) as DBServerLog[];

            if (results.length === 0) throw new NotFoundError('Log not found', 'Could not find that Log for that Server in the Database!');

            if (results[0].deleted_at) throw new BadRequestError('Log deleted', 'The Log you are trying to view has been deleted!');

            return results[0];
        }

        const sql = 'SELECT * FROM server_logs WHERE server_id = $1 ORDER BY ABS(EXTRACT(epoch FROM created_at - $2)) LIMIT 1';
        const results = await query(sql, [server.id, log.created_at]) as DBServerLog[];

        if (results.length === 0) throw new NotFoundError('No recent Log found', 'Could not find any recent Logs for that Server in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Log deleted', 'The Log you are trying to view has been deleted!');

        return results[0];
    }

    static async getLatest(server: Guild) {
        const results = await query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at DESC LIMIT 1', [server.id]) as DBServerLog[];

        if (results.length === 0) throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');

        if (results[0].deleted_at) throw new BadRequestError('Log deleted', 'The Log you are trying to view has been deleted!');

        return results[0];
    }

    static async add(server: Guild) {
        const date = moment().format('YYYY-MM-DDTHH:mm:ss.msZ');
        try {
            const dbLog = await this.getOne(server, { created_at: date });

            const duration = moment.duration(moment(date).diff(moment(dbLog.created_at)));

            if (duration.asDays() >= 1 || duration.asHours() >= 8) {
                const sql = 'INSERT INTO server_logs (server_id, created_at) VALUES($1, $2)';
                await query(sql, [server.id, date]);

                if (!fs.existsSync(`./logs/server/${server.id}`)) fs.mkdirSync(`./logs/server/${server.id}`);

                fs.writeFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

                return 'Successfully added new Log to Server';
            }

            fs.appendFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

            throw new BadRequestError('Logfile is too new', 'Can\'t create new Log as there is a Logfile newer than 8 hours!');
        } catch (err) {
            if (!(err instanceof NotFoundError)) throw err;

            const sql = 'INSERT INTO server_logs (server_id, created_at) VALUES($1, $2)';
            await query(sql, [server.id, date]);

            if (!fs.existsSync(`./logs/server/${server.id}`)) fs.mkdirSync(`./logs/server/${server.id}`);

            fs.writeFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

            return 'Successfully added new Log to Server';
        }
    }

    static async removeOld(server: Guild) {
        const date = moment().format('YYYY-MM-DDTHH:mm:ss.msZ');

        const results = await query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at ASC', [server.id]) as DBServerLog[];

        if (results.length === 0) throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');

        let num = 0;
        results.map(async (log) => {
            num++;
            if (moment.duration(moment(date).diff(moment(log.created_at))).asDays() > 7) {
                await query('UPDATE server_logs SET deleted_at = $1 WHERE server_id = $2 AND id = $3', [Date.now(), server.id, log.id]);

                if (fs.existsSync(`./logs/server/${server.id}/${log.created_at}.log`)) fs.unlinkSync(`./logs/server/${server.id}/${log.created_at}.log`);

                num--;
            }
        });

        if (num === 0) throw new NotFoundError('No Logfiles found', 'Could not find any Logfiles older than 7 days in the Database!');

        return `Successfully removed ${num} Logs older than 7 days from the Database`;
    }
}

export { ServerLog };
