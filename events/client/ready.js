const fs = require("fs");
module.exports = {
  name: 'ready',
  /**
    * 
    * @param {import('../../structures/lib/DiscordClient')} client 
    */
  run: (client) => {
    console.log("Client is ready.");
    let servers = JSON.parse(fs.readFileSync("./database/servers.json")).list;
    for (let i = 0; i < servers.length; i++) {
      const MainGuild = client.guilds.cache.get(`${servers[i].id}`);
      const commandsArray = []
      client.slashCommands.forEach(cmd => {
        commandsArray.push(cmd)
      });
      MainGuild.commands.set(commandsArray);
      client.user.setPresence(client.config.presence);
    }
  }
};
