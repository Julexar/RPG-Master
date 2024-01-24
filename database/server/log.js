import { psql } from '../psql.js';
import { NotFoundError, BadRequestError } from '../../custom/errors/index.js';
import moment from 'moment';
import fs from 'fs';
const query = psql.query;

class ServerLog {
    static async getAll(server) {
        const results = await query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at DESC', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');
        }

        return results;
    }

    static async getOne(server, log) {
        if (log.id) {
            const results = await query('SELECT * FROM server_logs WHERE server_id = $1 AND id = $2', [server.id, log.id]);

            if (results.length === 0) {
                throw new NotFoundError('Log not found', 'Could not find that Log for that Server in the Database!');
            }

            return results[0];
        }

        const sql = 'SELECT * FROM server_logs WHERE server_id = $1 ORDER BY ABS(EXTRACT(epoch FROM created_at - $2)) LIMIT 1';
        const results = await query(sql, [server.id, log.created_at]);

        if (results.length === 0) {
            throw new NotFoundError('No recent Log found', 'Could not find any recent Logs for that Server in the Database!');
        }

        return results[0];
    }

    static async getLatest(server) {
        const results = await query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at DESC LIMIT 1', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');
        }

        return results[0];
    }

    static async add(server) {
        const date = moment().format('YYYY-MM-DDTHH:mm:ss.msZ');
        try {
            const dbLog = await this.getOne(server, { created_at: date });

            const duration = moment.duration(date.diff(moment(dbLog.created_at)));

            if (duration.asDays() >= 1 || duration.asHours() >= 8) {
                const sql = 'INSERT INTO server_logs (server_id, created_at) VALUES($1, $2)';
                await query(sql, [server.id, date]);

                if (!fs.existsSync(`./logs/server/${server.id}`)) {
                    fs.mkdirSync(`./logs/server/${server.id}`);
                }

                fs.writeFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

                return 'Successfully added new Log to Server';
            }

            fs.appendFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

            throw new BadRequestError('Logfile is too new', "Can't create new Log as there is a Logfile newer than 8 hours!");
        } catch (err) {
            if (!(err instanceof NotFoundError)) {
                throw err;
            }

            const sql = 'INSERT INTO server_logs (server_id, created_at) VALUES($1, $2)';
            await query(sql, [server.id, date]);

            if (!fs.existsSync(`./logs/server/${server.id}`)) {
                fs.mkdirSync(`./logs/server/${server.id}`);
            }

            fs.writeFileSync(`./logs/server/${server.id}/${date}.log`, '========Beginning of new Log========\n');

            return 'Successfully added new Log to Server';
        }
    }

    static async removeOld(server) {
        const date = moment().format('YYYY-MM-DDTHH:mm:ss.msZ');

        const results = await this.query('SELECT * FROM server_logs WHERE server_id = $1 ORDER BY created_at ASC', [server.id]);

        if (results.length === 0) {
            throw new NotFoundError('No Logs found', 'Could not find any Logs for that Server in the Database!');
        }

        let num = 0;
        results.map(async (log) => {
            if (moment.duration(date.diff(moment(log.created_at))).asDays() > 7) {
                await query('DELETE FROM server_logs WHERE server_id = $1 AND id = $2', [server.id, log.id]);

                if (fs.existsSync(`./logs/server/${server.id}/${log.created_at}.log`)) {
                    fs.unlinkSync(`./logs/server/${server.id}/${log.created_at}.log`);
                    num++;
                }
            }
        });

        if (num === 0) {
            throw new NotFoundError('No Logfiles found', 'Could not find any Logfiles older than 7 days in the Database!');
        }

        return `Successfully removed ${num} Logs older than 7 days from the Database`;
    }
}

export { ServerLog };
