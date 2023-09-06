import { Client, Collection, GatewayIntentBits } from "discord.js";
import config from "../../config.js";
import psql from "../../database/psql.js";
import eventsHandler from '../handlers/events.js';
import slashCommandsHandler from '../handlers/slashCommands.js';
import prefixCommandsHandler from '../handlers/prefixCommands.js';
import contextCommandsHandler from '../handlers/contextCommands.js';
class DiscordClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        this.slashCommands = new Collection();
        this.prefixCommands = new Collection();
        this.contextCommands = new Collection();
        this.config = config;
        this.database = psql;
    };

    start() {
        const handlers = [eventsHandler, slashCommandsHandler, prefixCommandsHandler, contextCommandsHandler];
        handlers.forEach(handler => handler(this));

        this.login(this.config.token);
    };
};

export default DiscordClient;