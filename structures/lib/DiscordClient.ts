import { Client, Collection, GatewayIntentBits, Guild } from "discord.js";
import { config } from "../../config.ts";
import { prisma } from '../../database/prisma.ts';
import { loggers } from 'winston';
import fs from 'fs';
import { devlog } from '../../logs/dev/logger.ts';
import { Config, Error } from "../../*";

class DiscordClient extends Client {
    slashCommands: Collection<string, any>;
    prefixCommands: Collection<string, any>;
    contextCommands: Collection<string, any>;
    config: Config;
    database: typeof prisma;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
            ],
        });

        this.slashCommands = new Collection();
        this.prefixCommands = new Collection();
        this.contextCommands = new Collection();
        this.config = config;
        this.database = prisma;
    }

    async start() {
        try {
            ['events', 'slashCommands', 'prefixCommands', 'contextCommands'].forEach(async handler => {
                const module = await import(`../handlers/${handler}.ts`);
                await module.handler.run();
            });

            this.login(this.config.token);
        } catch (err) {
            this.logDevError(err);
        }
    }

    chkServerLog(server: Guild) {
        try {
            if (!fs.existsSync(`./logs/server/${server.id}`)) fs.mkdirSync(`./logs/server/${server.id}`);
        
            return loggers.get(`${server.id}`);
        } catch (err) {
            throw err;
        }
    }

    async getLatestServerLog(server: Guild) {
        return await this.database.server_logs.findFirst({
            where: {
                server_id: server.id
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }

    async writeServerLog(server: Guild, content: string) {
        try {
            const logger = this.chkServerLog(server);
            const log = await this.getLatestServerLog(server);

            if (!fs.existsSync(`./logs/server/${server.id}/${log?.created_at}.log`)) logger.info('========Beginning of new Log========\n');
            
            logger.info(content);

            this.writeDevLog(`Successfully wrote into Logfile of Server "${server.name}"`);
        } catch (err) {
            this.logDevError(err);
        }
    }

    async logServerError(server: Guild, err: Error) {
        try {
            const logger = this.chkServerLog(server);
            logger.error(`${err} - ${err.cause}`);
        } catch (error) {
            this.logDevError(error);
        }
    }

    writeDevLog(content: string) {
        try {
            if (!fs.existsSync(`./logs/dev`)) fs.mkdirSync(`./logs/dev`);

            if (!fs.existsSync('./logs/dev/devlog.log')) devlog.info('========Beginning of new Log========\n');

            devlog.info(content);
        } catch (err) {
            this.logDevError(err);
        }
    }

    logDevError(err: Error) {
        devlog.error(`${err} - ${err.cause}`);
    }
}

export { DiscordClient };