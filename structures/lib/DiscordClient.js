import { Client, Collection, GatewayIntentBits } from "discord.js";
import config from "../../config.js";
import * as psql from "../../database/psql.js";
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
    this.database = psql.default;
  };

  async start() {
    const handlers = ["events", "slashCommands", "prefixCommands", "contextCommands"];
    handlers.forEach(async (handler) => {
      const module = await import(`../handlers/${handler}.js`);
      module.default.run();
    });

    this.login(this.config.token);
  };
};

export default DiscordClient;