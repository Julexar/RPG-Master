const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: "ping",
  description: "Get a ping from the Bot",

  run: async (client, message, args) => {
    const ping = new EmbedBuilder()
      .setColor('#00ffff')
      .setTitle('Pong!')
      .addFields(
        {name: "Bot Latency", value: `\`${Number(Date.now() - message.createdTimestamp)} ms\``},
        {name: "Websocket Latency", value: `\`${client.ws.ping} ms\``}
      )
      .setTimestamp()
    await message.reply({embeds: [ping]});
  },
};
