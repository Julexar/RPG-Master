const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
module.exports = {
  name: "notes",
  description: "Lets you view/edit/add/remove notes",
  options: [
    {
      name: "view",
      description: "Pulls up your Character's Notes.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "title",
          description: "Provide the Title of a Note.",
          type: ApplicationCommandOptionType.String,
        },
      ],
    },
    {
      name: "edit",
      description: "Edits a Note.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "title",
          description: "Provide the Title of the Note.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "newtitle",
          description: "Provide the new Title for the Note.",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "content",
          description: "Provide the new Content for the Note.",
          type: ApplicationCommandOptionType.String,
        },
      ],
    },
    {
      name: "add",
      description: "Adds a Note to your Character.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "title",
          description: "Provide a Title for the Note.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "content",
          description: "Provide the Content for the Note.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Removes a note from your Character.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "title",
          description: "Provide the Title of the Note.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],

  run: async (client, interaction) => {
    const option = interaction.options;
    const user = interaction.user;
    const file = JSON.parse(fs.readFileSync("./database/rpg.json"));
    const dnd = file.DND;
    const player = dnd.players.find(p => p.id==user.id);
    if (!player) {
      dnd.players.push(
        {
          name: user.tag,
          id: `${user.id}`,
          characters: []
        }
      );
      file.DND=dnd;
      fs.writeFileSync("./database/rpg.json",JSON.stringify(file, null, "\t"));
      await interaction.reply({content: "You have been registered! Create a Character using \`/character create name:{Insert Name} race:{Insert Race} class:{Insert Class} level:{Insert Level}\`"});
    } else if (player) {
      const characters = player.characters;
      const char = characters.find(c => c.active==true);
      if (!char) {
        await interaction.reply({content:"No active Character selected! Select one using \`/character select name:{Insert Name}\` first."});
      } else if (char) {
        const notes = char.notes;
        const list1 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list2 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list3 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list4 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list5 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list6 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list7 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list8 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list9 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const list10 = new EmbedBuilder()
          .setColor('#ffdf00')
          .setAuthor({name: user.username, iconURL: user.avatarURL()})
          .setThumbnail(`${char.image}`)
          .setTitle(char.name)
          .setDescription("**__Character Notes__**")
          .setTimestamp();
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prevnote')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⏪')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('nextnote')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('⏩')
              .setDisabled(false),
          );
        if (option.getSubcommand()=="view") {
          if (!option.getString("title")) {
            if (notes.length==0) {
              list1.setDescription("**__Character Notes__**\n\n_No Notes yet..._\n\n_You can add a Note using \`/notes add title:{Insert Title} content:{Insert Content}\`_");
              await interaction.reply({embeds: [list1]});
            } else if (notes.length>0) {
              if (notes.length<=5) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  list1.addFields(
                    { name: `${note.title}`, value: `${note.content}` },
                  );
                }
                list1.setFooter({text: "Page 1/1"});
                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);
                await interaction.reply({embeds: [list1], components: [row]});
              } else if (notes.length<=10) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>5) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/2"});
                list2.setFooter({text: "Page 2/2"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<2) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=15) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>10) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/3"});
                list2.setFooter({text: "Page 2/3"});
                list3.setFooter({text: "Page 3/3"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<3) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=20) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>15) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/4"});
                list2.setFooter({text: "Page 2/4"});
                list3.setFooter({text: "Page 3/4"});
                list4.setFooter({text: "Page 4/4"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<4) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=25) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>20) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/5"});
                list2.setFooter({text: "Page 2/5"});
                list3.setFooter({text: "Page 3/5"});
                list4.setFooter({text: "Page 4/5"});
                list5.setFooter({text: "Page 5/5"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<5) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=30) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=25) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>25) {
                    list6.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/6"});
                list2.setFooter({text: "Page 2/6"});
                list3.setFooter({text: "Page 3/6"});
                list4.setFooter({text: "Page 4/6"});
                list5.setFooter({text: "Page 5/6"});
                list6.setFooter({text: "Page 6/6"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<6) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  } else if (page==6) {
                    await interaction.editReply({embeds: [list6], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=35) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=25) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=30) {
                    list6.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>30) {
                    list7.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/7"});
                list2.setFooter({text: "Page 2/7"});
                list3.setFooter({text: "Page 3/7"});
                list4.setFooter({text: "Page 4/7"});
                list5.setFooter({text: "Page 5/7"});
                list6.setFooter({text: "Page 6/7"});
                list7.setFooter({text: "Page 7/7"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<7) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  } else if (page==6) {
                    await interaction.editReply({embeds: [list6], components: [row]});
                  } else if (page==7) {
                    await interaction.editReply({embeds: [list7], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=40) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=25) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=30) {
                    list6.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=35) {
                    list7.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>35) {
                    list8.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/8"});
                list2.setFooter({text: "Page 2/8"});
                list3.setFooter({text: "Page 3/8"});
                list4.setFooter({text: "Page 4/8"});
                list5.setFooter({text: "Page 5/8"});
                list6.setFooter({text: "Page 6/8"});
                list7.setFooter({text: "Page 7/8"});
                list8.setFooter({text: "Page 8/8"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<8) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      } else if (page==8) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list8], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  } else if (page==6) {
                    await interaction.editReply({embeds: [list6], components: [row]});
                  } else if (page==7) {
                    await interaction.editReply({embeds: [list7], components: [row]});
                  } else if (page==8) {
                    await interaction.editReply({embeds: [list8], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=45) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=25) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=30) {
                    list6.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=35) {
                    list7.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=40) {
                    list8.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>40) {
                    list9.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/9"});
                list2.setFooter({text: "Page 2/9"});
                list3.setFooter({text: "Page 3/9"});
                list4.setFooter({text: "Page 4/9"});
                list5.setFooter({text: "Page 5/9"});
                list6.setFooter({text: "Page 6/9"});
                list7.setFooter({text: "Page 7/9"});
                list8.setFooter({text: "Page 8/9"});
                list9.setFooter({text: "Page 9/9"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<9) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      } else if (page==8) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list8], components: [row]});
                      } else if (page==9) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list9], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      } else if (page==8) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list8], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  } else if (page==6) {
                    await interaction.editReply({embeds: [list6], components: [row]});
                  } else if (page==7) {
                    await interaction.editReply({embeds: [list7], components: [row]});
                  } else if (page==8) {
                    await interaction.editReply({embeds: [list8], components: [row]});
                  } else if (page==9) {
                    await interaction.editReply({embeds: [list9], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              } else if (notes.length<=50) {
                for (let i=0;i<notes.length;i++) {
                  let note=notes[i];
                  if (i<=5) {
                    list1.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=10) {
                    list2.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=15) {
                    list3.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=20) {
                    list4.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=25) {
                    list5.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=30) {
                    list6.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=35) {
                    list7.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=40) {
                    list8.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i<=45) {
                    list9.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  } else if (i>45) {
                    list10.addFields(
                      { name: `${note.title}`, value: `${note.content}` },
                    );
                  }
                }
                list1.setFooter({text: "Page 1/10"});
                list2.setFooter({text: "Page 2/10"});
                list3.setFooter({text: "Page 3/10"});
                list4.setFooter({text: "Page 4/10"});
                list5.setFooter({text: "Page 5/10"});
                list6.setFooter({text: "Page 6/10"});
                list7.setFooter({text: "Page 7/10"});
                list8.setFooter({text: "Page 8/10"});
                list9.setFooter({text: "Page 9/10"});
                list10.setFooter({text: "Page 10/10"});
                let page=1;
                await interaction.reply({embeds: [list1], components: [row]});
                const collector = interaction.channel.createMessageComponentCollector({time: 90000});
                collector.on("collect", async (i) => {
                  await i.deferUpdate();
                  if (i.customId=="nextnote") {
                    if (page<10) {
                      page++;
                      if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      } else if (page==8) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list8], components: [row]});
                      } else if (page==9) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list9], components: [row]});
                      } else if (page==10) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(true);
                        await interaction.editReply({embeds: [list10], components: [row]});
                      }
                    }
                  } else if (i.customId=="prevnote") {
                    if (page>1) {
                      page--;
                      if (page==1) {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list1], components: [row]});
                      } else if (page==2) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list2], components: [row]});
                      } else if (page==3) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list3], components: [row]});
                      } else if (page==4) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list4], components: [row]});
                      } else if (page==5) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list5], components: [row]});
                      } else if (page==6) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list6], components: [row]});
                      } else if (page==7) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list7], components: [row]});
                      } else if (page==8) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list8], components: [row]});
                      }  else if (page==9) {
                        row.components[0].setDisabled(false);
                        row.components[1].setDisabled(false);
                        await interaction.editReply({embeds: [list9], components: [row]});
                      }
                    }
                  }
                });
                collector.on("end", async (collected) => {
                  row.components[0].setDisabled(true);
                  row.components[1].setDisabled(true);
                  if (page==1) {
                    await interaction.editReply({embeds: [list1], components: [row]});
                  } else if (page==2) {
                    await interaction.editReply({embeds: [list2], components: [row]});
                  } else if (page==3) {
                    await interaction.editReply({embeds: [list3], components: [row]});
                  } else if (page==4) {
                    await interaction.editReply({embeds: [list4], components: [row]});
                  } else if (page==5) {
                    await interaction.editReply({embeds: [list5], components: [row]});
                  } else if (page==6) {
                    await interaction.editReply({embeds: [list6], components: [row]});
                  } else if (page==7) {
                    await interaction.editReply({embeds: [list7], components: [row]});
                  } else if (page==8) {
                    await interaction.editReply({embeds: [list8], components: [row]});
                  } else if (page==9) {
                    await interaction.editReply({embeds: [list9], components: [row]});
                  } else if (page==10) {
                    await interaction.editReply({embeds: [list10], components: [row]});
                  }
                  console.log(`Collected ${collected.size} Interactions.`);
                });
              }
            }
          } else if (option.getString("title")) {
            let title = option.getString("title");
            let note = notes.find(n => n.title==title);
            if (!note) {
              await interaction.reply({content: "Could not find a Note with that Title!", ephemeral: true});
            } else if (note) {
              list1.addFields(
                { name: `${note.title}`, value: `${note.content}`}
              );
              await interaction.reply({embeds: [list1]});
            }
          }
        } else if (option.getSubcommand()=="edit") {
          let title=option.getString("title");
          let newtitle=option.getString("newtitle");
          let content=option.getString("content");
          let note = notes.find(n => n.title==title);
          if (!note) {
            await interaction.reply({content: "Could not find a Note with that Title!", ephemeral: true});
          } else if (note) {
            if (!newtitle && !content) {
              await interaction.reply({content: "You must define the part of the Note you wish to edit!", ephemeral: true});
            } else if (newtitle || content) {
              if (newtitle) {
                note.title=newtitle;
              }
              if (content) {
                note.content=content;
              }
              await interaction.reply({content: "Note has been edited. View the Changes with \`/notes view title:"+note.title+"\`", ephemeral: true});
              for (let i=0;i<notes.length;i++) {
                if (notes[i].title==title) {
                  notes[i]=note;
                }
              }
              char.notes=notes;
              for (let i=0;i<characters.length;i++) {
                if (characters[i].name==char.name) {
                  characters[i]=char;
                }
              }
              player.characters=characters;
              for (let i=0;i<dnd.players.length;i++) {
                if (dnd.players[i].id==user.id) {
                  dnd.players[i]=player;
                }
              }
              file.DND=dnd;
              fs.writeFileSync("./database/rpg.json",JSON.stringify(file, null, "\t"));
            }
          }
        } else if (option.getSubcommand()=="add") {
          let title = option.getString("title");
          let content = option.getString("content");
          notes.push(
            {
              title: title,
              content: content
            }
          );
          await interaction.reply({content: "Note has been added! View it with \`/notes view\`", ephemeral: true});
          char.notes=notes;
          for (let i=0;i<characters.length;i++) {
            if (characters[i].name==char.name) {
              characters[i]=char;
            }
          }
          player.characters=characters;
          for (let i=0;i<dnd.players.length;i++) {
            if (dnd.players[i].id==user.id) {
              dnd.players[i]=player;
            }
          }
          file.DND=dnd;
          fs.writeFileSync("./database/rpg.json",JSON.stringify(file, null, "\t"));
        } else if (option.getSubcommand()=="remove") {
          let title = option.getString("title");
          for (let i=0;i<notes.length;i++) {
            if (notes[i].title==title) {
              const row = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId("confirm")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
                    .setLabel("Confirm"),
                  new ButtonBuilder()
                    .setCustomId('cancel')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🛑')
                    .setLabel("Cancel"),
                );
              await interaction.reply({content: `Are you sure you want to delete the Note \"${title}\"?`, components: [row], ephemeral: true});
              const collector = interaction.channel.createMessageComponentCollector({time: 90000});
              collector.on("collect", async (j) => {
                await j.deferUpdate();
                if (j.customId=="confirm") {
                  notes.splice(i);
                  await interaction.editReply({content: "Note has been deleted", components: [], ephemeral: true});
                  char.notes=notes;
                  for (let i=0;i<characters.length;i++) {
                    if (characters[i].name==char.name) {
                      characters[i]=char;
                    }
                  }
                  player.characters=characters;
                  for (let i=0;i<dnd.players.length;i++) {
                    if (dnd.players[i].id==player.id) {
                      dnd.players[i]=player;
                    }
                  }
                  file.DND=dnd;
                  fs.writeFileSync("./database/rpg.json",JSON.stringify(file, null, "\t"));
                } else if (j.customId=="cancel") {
                  await j.editReply({content: "Deletion has been cancelled.", ephemeral: true});
                }
              });
              collector.on("end", async (collected) => {
                await interaction.editReply({content: "Selection time expired...", components: [], ephemeral: true});
                console.log(`Collected ${collected.size} Interactions`);
              });
            }
          }
        }
      }
    }
  },
};
