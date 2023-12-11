import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class Condition {
    static async getAll(server) {}

    static async getOne(server, condition) {}

    static async exists(server, condition) {}

    static async add(server, condition) {}

    static async remove(server, condition) {}

    static async update(server, condition) {}
}

export { Condition };
