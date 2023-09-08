import { Client, Collection, GatewayIntentBits } from "discord.js";
import config from "../../config.js";
import psql from "../../database/psql.js";
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

  async start() {
    ['events', 'slashCommands', 'prefixCommands', 'contextCommands'].forEach(async (handler) => {
      const module = await import(`../handlers/${handler}.js`);
      return module.default;
    });

    const handlers = await Promise.all(handlerModules);

    this.login(this.config.token);
  };
};

export default DiscordClient;