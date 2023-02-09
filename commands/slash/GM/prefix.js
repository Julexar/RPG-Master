const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require("fs");
module.exports = {
  name: 'prefix',
  description: 'Prefix command.',
  permissions: {
    member: ['ADMINISTRATOR'],
  },
  options: [
    {
      name: 'add',
      description: 'Add a prefix.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'prefix',
          description: 'Provide a prefix.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Remove a prefix.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'prefix',
          description: 'Provide a prefix.',
          type: ApplicationCommandOptionType.String,
          required: true,
        }
      ]
    },
    {
      name: 'list',
      description: 'List out the prefix of your server.',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  run: async (client, interaction) => {
    const servers = JSON.parse(fs.readFileSync("./database/servers.json"));
    let server = servers.list.find(i => i.id==interaction.guild.id);
    let prefixes = server.prefixes;
    if (!prefixes) {
      servers.list.push({
        name: interaction.guild.name,
        id: interaction.guild.id,
        prefixes: ["r!"]
      });
      await interaction.reply({content: "Your Server has been added to the list.", ephemeral: true});
    } else if (prefixes) {
      let prefix;
      switch (interaction.options.getSubcommand()) {
        case 'add':
          prefix=interaction.options.getString("prefix");
          if (prefixes.includes(prefix)) {
            return await interaction.reply({
              content: "This prefix already exists in the Database!",
              ephemeral: true,
            });
          } else {
            const newPrefix = [...prefixes, prefix];
            server.prefixes=newPrefix;
            for (let i=0;i<servers.list.length;i++) {
             if (servers.list[i].id==interaction.guild.id) {
               servers.list[i]=server;
             }
            }
            await interaction.reply({
              content: `The prefix \"${prefix}\" has been added to the Database.`,
              ephemeral: true,
            });
          }
        break;
        case 'remove':
          prefix=interaction.options.getString("prefix");
          if (!prefixes.includes(prefix)) {
            return await interaction.reply({
              content: "This prefix does not exist in the Database!",
              ephemeral: true,
            });
          } else {
            const array = [...prefixes.filter(p => !p.includes(prefix))];
            server.prefixes=array;
            for (let i=0;i<servers.list.length;i++) {
              if (servers.list[i].id==interaction.guild.id) {
                servers.list[i]=server;
              }
            }
          }
        break;
        case 'list':
          const embed = new EmbedBuilder()
            .setColor("#00ffff")
            .setTitle("Prefix List")
            .setDescription(prefixes.join('\n'))
            .setTimestamp();
          await interaction.reply({embeds: [embed]});
        break;
      }
      fs.writeFileSync("./database/servers.json", JSON.stringify(servers, null, "\t"));
    }
  },
};
