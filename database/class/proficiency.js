import { psql } from '../psql.js';
import { NotFoundError, DuplicateError } from '../../custom/errors/index.js';
const query = psql.query;

class ClassProficiency {
    static async getAll(clas) {}

    static async getOne(clas, prof) {}

    static async exists(clas, prof) {}

    static async add(clas, prof) {}

    static async remove(clas, prof) {}

    static async update(clas, prof) {}
}

export { ClassProficiency };
