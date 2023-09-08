import { client } from "../../index.js";
class Event {
  constructor() {
    this.name = "guildDelete";
  }
  /**
   * 
   * @param {import("discord.js").Guild} guild 
   */
  async run(guild) {
    await client.database.remServer(guild)
      .then(msg => client.database.writeDevLog(msg))
      .catch(err => client.database.writeDevLog(`${err}`));
  };
}
export default new Event();