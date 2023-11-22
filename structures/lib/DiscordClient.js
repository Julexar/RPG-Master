import { Client, Collection, GatewayIntentBits } from "discord.js";
import { config } from "../../config.js";
import { psql } from "../../database/psql.js";
import moment from "moment"
import fs from "fs";
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
    const handlers = ["events", "slashCommands", "prefixCommands", "contextCommands"];
    handlers.forEach(async (handler) => {
      const module = await import(`../handlers/${handler}.js`);
      module.default.run();
    });

    this.login(this.config.token);
  };

  writeServerLog(server, content) {
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    if (!fs.existsSync(`./logs/server/${server.id}`)) {
      fs.mkdirSync(`./logs/server/${server.id}`)
    }

    const log = this.database.getLog(server)
    if (!fs.existsSync(`./logs/server/${server.id}/${log.id}.log`)) {
      fs.writeFileSync(`./logs/server/${server.id}/${log.id}.log`, "========Beginning of new Log========\n");
    }

    fs.appendFileSync(`./logs/server/${server.id}/${log.id}.log`, `${date} - ${content}\n`);
  };

  logServerError(server, err) {
    this.writeLog(server, `${err}\n${err.cause}`)
  };

  writeDevLog(content) {
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    if (!fs.existsSync(`./logs/dev`)) {
      fs.mkdirSync(`./logs/dev`)
    }

    if (!fs.existsSync("./logs/dev/devlog.log")) {
      fs.writeFileSync("./logs/dev/devlog.log", "========Beginning of new Log========\n");
    }

    fs.appendFileSync("./logs/dev/devlog.log", `${date} - ${content}\n`);
  };

  logDevError(err) {
    this.writeDevLog(`${err}\n${err.cause}`);
  };
};

export { DiscordClient };