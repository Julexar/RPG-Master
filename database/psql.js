import pkg from 'pg';
const Pool = pkg.Pool;
import 'dotenv/config';
import { InternalServerError } from '../custom/errors/index.js';

class PSQL {
    constructor() {
        this.pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_NAME,
            password: process.env.PG_PWD,
            port: process.env.PG_PORT,
        });

        this.pool.connect(err => {
            if (err) {
                return this.writeDevLog(`${err}`);
            }
            this.writeDevLog('Connected to Database!');
        });
    }

    query(query, params = []) {
        return new Promise((resolve, reject) => {
            this.pool.query(query, params, (err, results) => {
                if (err) {
                    return reject(new InternalServerError('Something went wrong!', err));
                }

                if (query.includes('SELECT')) {
                    results = JSON.parse(JSON.stringify(results.rows));
                }
                resolve(results);
            });
        });
    }
}

const psql = new PSQL();

export { psql };
