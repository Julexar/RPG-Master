const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
module.exports = {
  name: "character",
  description: "Lets you select your Character",
  options: [
    {
      name: "select",
      description: "Selects a Character.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Provide the Name of the Character.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "view",
      description: "Pulls up Infos about your Character.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "classfeats",
          description: "Pulls up your Character's Class Features",
          type: ApplicationCommandOptionType.Subcommand,
        },
        {
          name: "racefeats",
          description: "Pulls up your Character's Racial Features",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: "create",
      description: "Creates a new Character.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Provide a name for the Character.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "race",
          description: "Provide your Character's race.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "class",
          description: "Provide a Class for your Character.",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            {
              name: "Artificer",
              value: "art",
            },
            {
              name: "Barbarian",
              value: "barb",
            },
            {
              name: "Bard",
              value: "bard",
            },
            {
              name: "Cleric",
              value: "cleric",
            },
            {
              name: "Druid",
              value: "druid",
            },
            {
              name: "Fighter",
              value: "fight",
            },
            {
              name: "Monk",
              value: "monk",
            },
            {
              name: "Paladin",
              value: "pal",
            },
            {
              name: "Ranger",
              value: "rang",
            },
            {
              name: "Rogue",
              value: "rogue",
            },
            {
              name: "Sorcerer",
              value: "sor",
            },
            {
              name: "Warlock",
              value: "warl",
            },
            {
              name: "Wizard",
              value: "wiz",
            },
          ],
        },
        {
          name: "level",
          description: "Provide your Character's Level.",
          type: ApplicationCommandOptionType.Integer,
          required: true,
        },
      ],
    },
    {
      name: "delete",
      description: "Deletes a Character permanently.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Provide the name of the Character.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "edit",
      description: "Pulls up the Editor.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async (client, interaction) => {
    const file = JSON.parse(fs.readFileSync("./database/rpg.json"));
    const user = interaction.user;
    const dnd = file.DND;
    const player = dnd.players.find(p => p.id == `${user.id}`);
    const option = interaction.options;
    if (!player) {
      dnd.players.push({
        name: `${user.tag}`,
        id: `${user.id}`,
        characters: []
      });
      await interaction.reply({ content: "You have been successfully registered! Please create a character using \`/character create name:{Insert Name} race:{Insert Race} class:{Insert Class} level:{Insert Level}\`", ephemeral: true });
    } else if (player) {
      const characters = player.characters;
      if (option.getSubcommand() == "select") {
        let name = option.getString("name");
        if (!characters.length || characters.length == 0) {
          await interaction.reply({ content: "You don't have any Characters! Create one using \`/character create name:{Insert Name} race:{Insert Race} class:{Insert Class} level:{Insert Level}\` first.", ephemeral: true });
        } else if (characters.length >= 1) {
          for (let i = 0; i < characters.length; i++) {
            if (characters[i].active == true && !characters[i].name.includes(name)) {
              characters[i].active = false;
            } else if (characters[i].active == true && characters[i].name.includes(name)) {
              await interaction.reply({ content: "Character is already active!", ephemeral: true });
            } else if (characters[i].active == false && characters[i].name.includes(name)) {
              characters[i].active = true;
            }
          }
        }
        player.characters = characters;
        for (let i = 0; i < dnd.players.length; i++) {
          if (dnd.players[i].id == player.id) {
            dnd.players[i] = player;
          }
        }
        file.DND = dnd;
        fs.writeFileSync("./database/rpg.json", JSON.stringify(file, null, "\t"));
      } else if (option.getSubcommandGroup() == "view") {
        let char = characters.find(c => c.active == true);
        if (!char) {
          await interaction.reply({ content: "No active Character has been selected! Select one using \`/character select name:{Insert Name}\` first.", ephemeral: true });
        } else if (char) {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("nextfeat")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏪')
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("prevfeat")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏩')
                .setDisabled(false),
            );
          const list1 = new EmbedBuilder()
            .setColor('#00ffff')
            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
            .setThumbnail(`${char.image}`)
            .setTitle(char.name)
            .setTimestamp();
          const list2 = new EmbedBuilder()
            .setColor('#00ffff')
            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
            .setThumbnail(`${char.image}`)
            .setTitle(char.name)
            .setTimestamp();
          const list3 = new EmbedBuilder()
            .setColor('#00ffff')
            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
            .setThumbnail(`${char.image}`)
            .setTitle(char.name)
            .setTimestamp();
          const list4 = new EmbedBuilder()
            .setColor('#00ffff')
            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
            .setThumbnail(`${char.image}`)
            .setTitle(char.name)
            .setTimestamp();
          const list5 = new EmbedBuilder()
            .setColor('#00ffff')
            .setAuthor({ name: user.username, iconURL: user.avatarURL() })
            .setThumbnail(`${char.image}`)
            .setTitle(char.name)
            .setTimestamp();
          if (option.getSubcommand() == "classfeats") {
            list1.setDescription("Class Features");
            list2.setDescription("CLass Features");
            list3.setDescription("Class Features");
            list4.setDescription("Class Features");
            list5.setDescription("Class Features");
            if (char.class.length == 1) {
              let clas = char.class[0];
              let feats = clas.feats;
              if (!feats[0]) {
                list1.setDescription("Class Features\n\nNo features found.");
              } else if (feats) {
                list1.setFooter({ text: "Page 1/1" });
                row.components[1].setDisabled(true);
                for (let i = 0; i < feats.length; i++) {
                  list1.addFields(
                    { name: `${clas.name}: ${feats[i].name}`, value: `${feats[i].desc}` }
                  );
                }
              }
              await interaction.reply({ embeds: [list1], components: [row] });
              return;
            } else if (char.class.length == 2) {
              list1.setFooter({ text: "Page 1/2" });
              list2.setFooter({ text: "Page 2/2" });
              for (let i = 0; i < char.class.length; i++) {
                let clas = char.class[i];
                for (let j = 0; j < clas.feats.length; j++) {
                  let feat = clas.feats[j];
                  if (i == 1) {
                    list1.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 2) {
                    list2.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  }
                }
              }
              row.components[1].setDisabled(false);
              let page = 1;
              await interaction.reply({ embeds: [list1], components: [row] });
              const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
              collector.on("collect", async (i) => {
                await i.deferUpdate();
                if (i.customId == "nextfeat") {
                  page++;
                  row.components[0].setDisabled(false);
                  row.components[1].setDisabled(true);
                  await interaction.editReply({ embeds: [list2], components: [row] });
                } else if (i.customId == "prevfeat") {
                  page--;
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(false);
                  await interaction.editReply({ embeds: [list1], components: [row] });
                }
              });
              collector.on("end", async (collected) => {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
                if (page == 1) {
                  await interaction.editReply({ embeds: [list1], components: [row] });
                } else if (page == 2) {
                  await interaction.editReply({ embeds: [list2], components: [row] });
                }
                console.log(`Collected ${collected.size} Interactions.`);
              });
            } else if (char.class.length == 3) {
              list1.setFooter({ text: "Page 1/3" });
              list2.setFooter({ text: "Page 2/3" });
              list3.setFooter({ text: "Page 3/3" });
              for (let i = 0; i < char.class.length; i++) {
                let clas = char.class[i];
                for (let j = 0; j < clas.feats.length; j++) {
                  let feat = clas.feats[j];
                  if (i == 1) {
                    list1.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 2) {
                    list2.addField(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 3) {
                    list3.addField(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  }
                }
              }
              row.components[1].setDisabled(false);
              let page = 1;
              await interaction.reply({ embeds: [list1], components: [row] });
              const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
              collector.on("collect", async (i) => {
                await i.deferUpdate();
                if (i.customId == "nextfeat") {
                  if (page < 3) {
                    page++;
                    if (page == 2) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list2], components: [row] });
                    } else if (page == 3) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(true);
                      await interaction.editReply({ embeds: [list3], components: [row] });
                    }
                  }
                } else if (i.cutomId == "prevfeat") {
                  if (page > 1) {
                    page--;
                    if (page == 1) {
                      row.components[0].setDisabled(true);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list1], components: [row] });
                    } else if (page == 2) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list2], components: [row] });
                    }
                  }
                }
              });
              collector.on("end", async (collected) => {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
                if (page == 1) {
                  await interaction.editReply({ embeds: [list1], components: [row] });
                } else if (page == 2) {
                  await interaction.editReply({ embeds: [list2], components: [row] });
                } else if (page == 3) {
                  await interaction.editReply({ embeds: [list3], components: [row] });
                }
                console.log(`Collected ${collected.size} Interactions.`);
              });
            } else if (char.class.length == 4) {
              list1.setFooter({ text: "Page 1/4" });
              list2.setFooter({ text: "Page 2/4" });
              list3.setFooter({ text: "Page 3/4" });
              list4.setFooter({ text: "Page 4/4" });
              for (let i = 0; i < char.class.length; i++) {
                let clas = char.class[i];
                for (let j = 0; j < clas.feats.length; j++) {
                  let feats = clas.feats[j];
                  if (i == 1) {
                    list1.addFields(
                      { name: `${clas.name}: ${feats.name}`, value: `${feats.desc}` }
                    );
                  } else if (i == 2) {
                    list2.addFields(
                      { name: `${clas.name}: ${feats.name}`, value: `${feats.desc}` }
                    );
                  } else if (i == 3) {
                    list3.addFields(
                      { name: `${clas.name}: ${feats.name}`, value: `${feats.desc}` }
                    );
                  } else if (i == 4) {
                    list4.addFields(
                      { name: `${clas.name}: ${feats.name}`, value: `${feats.desc}` }
                    );
                  }
                }
              }
              row.components[1].setDisabled(false);
              let page = 1;
              await interaction.reply({ embeds: [list1], components: [row] });
              const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
              collector.on("collect", async (i) => {
                await i.deferUpdate();
                if (i.customId == "nextfeat") {
                  if (page < 4) {
                    page++;
                    if (page == 2) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list2], components: [row] });
                    } else if (page == 3) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list3], components: [row] });
                    } else if (page == 4) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(true);
                      await interaction.editReply({ embeds: [list4], components: [row] });
                    }
                  }
                } else if (i.customId == "prevfeat") {
                  if (page > 1) {
                    page--;
                    if (page == 1) {
                      row.components[0].setDisabled(true);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list1], components: [row] });
                    } else if (page == 2) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list2], components: [row] });
                    } else if (page == 3) {
                      row.components[0].setDisabled(false);
                      row.components[1].setDisabled(false);
                      await interaction.editReply({ embeds: [list3], components: [row] });
                    }
                  }
                }
              });
              collector.on("end", async (collected) => {
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
                if (page == 1) {
                  await interaction.editReply({ embeds: [list1], components: [row] });
                } else if (page == 2) {
                  await interaction.editReply({ embeds: [list2], components: [row] });
                } else if (page == 3) {
                  await interaction.editReply({ embeds: [list3], components: [row] });
                } else if (page == 4) {
                  await interaction.editReply({ embeds: [list4], components: [row] });
                }
              });
            } else if (char.class.length == 5) {
              list1.setFooter({ text: "Page 1/5" });
              list2.setFooter({ text: "Page 2/5" });
              list3.setFooter({ text: "Page 3/5" });
              list4.setFooter({ text: "Page 4/5" });
              list5.setFooter({ text: "Page 5/5" });
              for (let i = 0; i < char.class.length; i++) {
                let clas = char.class[i];
                for (let j = 0; j < clas.feats.length; j++) {
                  let feat = clas.feats[j];
                  if (i == 1) {
                    list1.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 2) {
                    list2.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 3) {
                    list3.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 4) {
                    list4.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  } else if (i == 5) {
                    list5.addFields(
                      { name: `${clas.name}: ${feat.name}`, value: `${feat.desc}` }
                    );
                  }
                }
              }
            }
            row.components[1].setDisabled(false);
            let page = 1;
            await interaction.reply({ embeds: [list1], components: [row] });
            const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
            collector.on("collect", async (i) => {
              await i.deferUpdate();
              if (i.customId == "nextfeat") {
                if (page < 5) {
                  page++;
                  if (page == 2) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list2], components: [row] });
                  } else if (page == 3) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list3], components: [row] });
                  } else if (page == 4) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list4], components: [row] });
                  } else if (page == 5) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(true);
                    await interaction.editReply({ embeds: [list5], components: [row] });
                  }
                }
              } else if (i.customId == "prevfeat") {
                if (page > 1) {
                  page--;
                  if (page == 1) {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list1], components: [row] });
                  } else if (page == 2) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list2], components: [row] });
                  } else if (page == 3) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list3], components: [row] });
                  } else if (page == 4) {
                    row.components[0].setDisabled(false);
                    row.components[1].setDisabled(false);
                    await interaction.editReply({ embeds: [list4], components: [row] });
                  }
                }
              }
            });
            collector.on("end", async (collected) => {
              row.components[0].setDisabled(true);
              row.components[1].setDisabled(true);
              if (page == 1) {
                await interaction.editReply({ embeds: [list1], components: [row] });
              } else if (page == 2) {
                await interaction.editReply({ embeds: [list2], components: [row] });
              } else if (page == 3) {
                await interaction.editReply({ embeds: [list3], components: [row] });
              } else if (page == 4) {
                await interaction.editReply({ embeds: [list4], components: [row] });
              } else if (page == 5) {
                await interaction.editReply({ embeds: [list6], components: [row] });
              }
            });
          } else if (option.getSubcommand("racefeats")) {
            list1.setDescription(`Racial Features (${char.race})`);
            for (let i = 0; i < char.racefeats.length; i++) {
              let feat = char.racefeats[i];
              list1.addFields(
                { name: `${feat.name}`, value: `${feat.desc}` }
              );
            }
            await interaction.reply({ embeds: [list1] });
          }
        }
      } else if (option.getSubcommand() == "create") {
        let name = option.getString("name");
        let racename = option.getString("race");
        let clasname = option.getString("class");
        let level = option.getInteger("level");
        const races = dnd.races;
        let race;
        if (racename.includes("Legacy")) {
          racename=racename.replace(" (Legacy)","");
          for (let i=0;i<races.length;i++) {
            if (races[i].name.includes(racename) && races[i].id.includes("leg")) {
              race=races[i];
            }
          }
        } else if (racename.includes("New")) {
          racename=racename.replace(" (New)","");
          for (let i=0;i<races.length;i++) {
            if (races[i].name.includes(racename) && races[i].id.includes("new")) {
              race=races[i];
            }
          }
        } else {
          race = races.find(r => r.name.includes(racename));
          console.log(race);
          if (!race || race.length>1) {
            await interaction.reply({content: "Could not find that race. Please make sure to include if you want a Legacy race (if applicable) by adding (Legacy) or (New) to the end of the name."});
          }
        }
        console.log(race);
        if (race.sub) {
          const row = new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('raceselect')
                .setPlaceholder('No Race selected...')
                .setMaxValues(1)
            );
          for (let i = 0; i < race.sub.length; i++) {
            row.components[0].addOptions(
              {
                label: `${race.sub[i].name}`,
                value: `${race.sub[i].id}`,
              },
            );
          }
          await interaction.reply({ content: "Select a Subrace:", components: [row] });
          const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
          let truerace;
          collector.on("collect", async (i) => {
            await i.deferUpdate();
            if (i.customId == "raceselect") {
              truerace = `${i.values[0]} ${race.name}`;
              await interaction.deleteReply();
            }
          });
          
        }
      } else if (option.getSubcommand() == "delete") {
        let name = option.getString("name");
        let char = characters.find(c => c.name.includes(name));
        if (!char) {
          await interaction.reply({ content: "Could not find a Character with that Name!", ephemeral: true });
        } else if (char) {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('confirm')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
                .setLabel("Confirm"),
              new ButtonBuilder()
                .setCustomId('cancel')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚫')
                .setLabel("Cancel"),
            );
          await interaction.reply({ content: `Are you sure you want to delete the Character \"${char.name}\"?`, components: [row], ephemeral: true });
          const collector = interaction.channel.createMessageComponentCollector({ time: 90000 });
          collector.on("collect", async (i) => {
            await i.deferReply();
            if (i.customId == "confirm") {
              await i.editReply({ content: "Successfully deleted the Character.", ephemeral: true });
              for (let i = 0; i < characters.length; i++) {
                if (characters[i].name.includes(name)) {
                  characters.splice(i);
                }
              }
              player.characters = characters;
              for (let i = 0; i < dnd.players.length; i++) {
                if (dnd.players[i].id == player.id) {
                  dnd.players[i] = player;
                }
              }
              file.DND = dnd;
              fs.writeFileSync("./database/rpg.json", JSON.stringify(file, null, "\t"));
            } else if (i.customId == "cancel") {
              await i.editReply({ content: "Deletion has been cancelled.", components: [], ephemeral: true });
            }
          });
          collector.on("end", async (collected) => {
            await interaction.editReply({ content: "Selection time has expired" });
            console.log(`Collected ${collected.size} Interactions.`);
          });
        }
      } else if (option.getSubcommand() == "edit") {
        await interaction.reply({ content: "Coming soon 😉", ephemeral: true });
      }
    }
  },
};
