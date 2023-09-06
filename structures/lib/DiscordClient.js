import { Client, Collection, GatewayIntentBits } from "discord.js";
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
        this.config = require("../../config");
        this.database = require("../../database/psql");
    };

    start() {
        ["events", "slashCommands", "prefixCommands", "contextCommands"].forEach(handler => {
            require(`../handlers/${handler}`)(this);
        });

        this.login(this.config.token);
    };
};

return DiscordClient();