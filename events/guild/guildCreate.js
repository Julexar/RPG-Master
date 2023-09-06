class Event {
  constructor() {
    this.name = "guildCreate";
  };
  /**
   * 
   * @param {import("discord.js").Guild} guild
   * @param {import("../../index")} client 
   */
  async run(guild, client) {
    const commandsArray = client.slashCommands;

  }
}