class Event {
  constructor() {
    this.name = "guildDelete";
  }
  /**
   * 
   * @param {import("discord.js").Guild} guild 
   * @param {import("../../index")} client 
   */
  async run(guild, client) {
    await client.database.remServer(guild)
      .then(msg => client.database.writeDevLog(msg))
      .catch(err => client.database.writeDevLog(`${err}`));
  };
}
export default new Event();