import pkg from 'pg';
const Pool = pkg.Pool;
import 'dotenv/config';
import { InternalServerError } from '../custom/errors';
import { client } from '..';

class PSQL {
    pool: any;
    constructor() {
        this.pool = new Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_NAME,
            password: process.env.PG_PWD,
            port: process.env.PG_PORT,
        });

        this.pool.connect((err: Error) => {
            if (err) return client.writeDevLog(`${err}`);
            
            client.writeDevLog('Connected to Database!');
        });
    }

    query(query: string, params: any[] | undefined = undefined) {
        return new Promise((resolve, reject) => {
            this.pool.query(query, params, (err: any, results: any) => {
                if (err) reject(new InternalServerError('Something went wrong!', err));

                if (query.includes('SELECT')) results = JSON.parse(JSON.stringify(results.rows));
                
                resolve(results);
            });
        });
    }
}

export const psql = new PSQL();