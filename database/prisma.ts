import { PrismaClient } from '@prisma/client';
import { client } from '..';

class Database {
    prisma: PrismaClient;
    constructor() {
        this.prisma = new PrismaClient();

        try {
            this.prisma.$connect();
        } catch (err) {
            client.logDevError(err);
        }
    }
}

export const prisma = new Database().prisma;