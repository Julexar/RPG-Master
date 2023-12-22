import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandPermissionType, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
class Command {
    constructor() {
        this.name = 'character';
        this.description = 'Character related Commands';
        this.enabled = false;
        this.options = [
            {
                name: 'select',
                description: 'Selects a Character',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'view',
                description: 'Posts Info about your Characters',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'add',
                description: 'Adds a new Character',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'remove',
                description: 'Removes a Character',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'edit',
                description: 'Edits a Character',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'notes',
                description: 'Character Note Commands',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'view',
                        description: 'Pulls up your Character Notes',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "id",
                                description: "Provide the ID of the Note",
                                type: ApplicationCommandOptionType.Integer,
                                required: false,
                                min_value: 1,
                            },
                            {
                                name: 'private',
                                description: 'Toggle viewing private Notes',
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: 'add',
                        description: 'Adds a Character Note',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'remove',
                        description: 'Removes a Character Note',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'edit',
                        description: 'Edits a Character Note',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const server = interaction.guild;
        const filter = (m) => m.user.id == user.id;
        switch (option.getSubcommand()) {
            case 'select':
                const rows = [];
                rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('charsel').setMaxValues(1).setPlaceholder('No Character selected...')));
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                    new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                );
                client.database
                    .getChar(user)
                    .then(async (chars) => {
                        let count = 0;
                        let num = 0;
                        for (const char of chars) {
                            if (count == 25) {
                                rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('charsel').setMaxValues(1).setPlaceholder('No Character selected...')));
                                num++;
                                count = 0;
                            }
                            rows[num].components[0].addOptions({
                                label: `${char.name}`,
                                value: `${char.id}`,
                            });
                            count++;
                        }
                        let page = 0;
                        if (rows.length === 1) {
                            row.components[1].setDisabled(true);
                            const msg = await interaction.reply({
                                content: 'Select a Character:',
                                components: [rows[page], row],
                                ephemeral: true,
                            });
                            const collector = msg.createMessageComponentCollector({
                                filter,
                                time: 90000,
                            });
                            collector.on('collect', async (i) => {
                                if (i.customId == 'charsel') {
                                    const mes = await i.deferReply();
                                    client.database
                                        .selectChar(user, { id: Number(i.values[0]) })
                                        .then(async (m) => {
                                            await mes.edit({
                                                content: `${m}`,
                                            });
                                        })
                                        .catch(async (err) => {
                                            if (String(err).includes('Error 404')) {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async () => {
                                                        await mes.edit({
                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Character in the Database. Contact the Developer if this Issue persists.').setTimestamp()],
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            } else {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async () => {
                                                        await mes.edit({
                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch(console.error);
                                            }
                                        });
                                    setTimeout(async function () {
                                        await mes.delete();
                                    }, 5000);
                                } else if (i.customId == 'cancel') {
                                    await msg.edit({
                                        content: 'Selection cancelled',
                                        components: [],
                                        ephemeral: true,
                                    });
                                    await collector.stop();
                                }
                            });
                            collector.on('end', async (collected) => {
                                if (collected.size === 0) {
                                    await msg.edit({
                                        content: 'Selection timed out...',
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    console.log(`Collected ${collected.size} Interactions`);
                                }
                                setTimeout(async function () {
                                    await msg.delete();
                                }, 5000);
                            });
                        } else if (rows.length > 1) {
                            const msg = await interaction.reply({
                                content: 'Select a Character:',
                                components: [rows[page], row],
                                ephemeral: true,
                            });
                            const collector = msg.createMessageComponentCollector({
                                filter,
                                time: 90000,
                            });
                            collector.on('collect', async (i) => {
                                if (i.customId == 'charsel') {
                                    const mes = await i.deferReply();
                                    client.database
                                        .selectChar(user, { id: Number(i.values[0]) })
                                        .then(async (m) => {
                                            await mes.edit({
                                                content: `${m}`,
                                            });
                                        })
                                        .catch(async (err) => {
                                            if (String(err).includes('Error 404')) {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async () => {
                                                        await mes.edit({
                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Character in the Database. Contact the Developer if this Issue persists.').setTimestamp()],
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            } else {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async () => {
                                                        await mes.edit({
                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            }
                                        });
                                    setTimeout(async function () {
                                        await mes.delete();
                                    }, 5000);
                                } else if (i.customId == 'cancel') {
                                    await msg.edit({
                                        content: 'Selection cancelled',
                                        components: [],
                                        ephemeral: true,
                                    });
                                    await collector.stop();
                                } else if (i.customId == 'prev') {
                                    await i.deferUpdate();
                                    page--;
                                    if (page >= 0) {
                                        if (page == 0) {
                                            row.components[0].setDisabled(true);
                                            row.components[1].setDisabled(false);
                                        } else {
                                            row.components[0].setDisabled(false);
                                            row.components[1].setDisabled(false);
                                        }
                                        await msg.edit({
                                            content: 'Select a Character:',
                                            components: [rows[page], row],
                                        });
                                    }
                                } else if (i.customId == 'next') {
                                    page++;
                                    if (page <= rows.length - 1) {
                                        if (page == rows.length - 1) {
                                            row.components[0].setDisabled(false);
                                            row.components[1].setDisabled(true);
                                        } else {
                                            row.components[0].setDisabled(false);
                                            row.components[1].setDisabled(false);
                                        }
                                        await msg.edit({
                                            content: 'Select a Character:',
                                            components: [rows[page], row],
                                        });
                                    }
                                }
                            });
                            collector.on('end', async (collected) => {
                                if (collected.size === 0) {
                                    await msg.edit({
                                        content: 'Selection timed out...',
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    console.log(`Collected ${collected.size} Interactions`);
                                }
                                setTimeout(async function () {
                                    await msg.delete();
                                }, 5000);
                            });
                        }
                    })
                    .catch(async (err) => {
                        client.database
                            .writeLog(server, `${err}`)
                            .then(async () => {
                                await interaction.reply({
                                    embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                    ephemeral: true,
                                });
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
                return;
            case "view":
                if (option.getSubcommandGroup() == "notes") {
                    const noteId = option.getInteger("id");
                    if (!noteId) {
                        const rows = [];
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId("notesel")
                                    .setMinValues(1)
                                    .setMaxValues(1)
                                    .setPlaceholder("No Note selected...")
                            );
                        rows.push(row);
                        const row2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("prev")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏪")
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId("next")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏩"),
                                new ButtonBuilder()
                                    .setCustomId("cancel")
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel("Cancel")
                            );
                        client.database.getUser(user)
                            .then(async (u) => {
                                if (!u.char_id) {
                                    const cmd = await server.commands.cache.find(c => c.name == "character");
                                    client.database.writeDevLog(await client.database.writeLog(server, "Error 404: No Character selected").catch(err => client.database.writeDevLog(`${err}`)));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("Error 404: No Character selected")
                                                .setDescription(`You need to select a Character first before you use this Command! Use </character select:${cmd.id}> to select a Character.`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    client.database.getCharNote(user, {id: u.char_id})
                                        .then(async (notes) => {
                                            let count = 0;
                                            let num = 0;
                                            for (const note of notes) {
                                                if (count == 24) {
                                                    rows.push(row);
                                                    num++;
                                                    count = 0;
                                                }
                                                if (note.title) {
                                                    rows[num].components[0].addOptions({
                                                        label: `${note.title} (#${note.id})`,
                                                        value: `${note.id}`
                                                    });
                                                } else {
                                                    rows[num].components[0].addOptions({
                                                        label: `Note #${note.id}`,
                                                        value: `${note.id}`
                                                    });
                                                }
                                                count++;
                                            }
                                            if (rows.length==1) {
                                                row2.components[1].setDisabled(true);
                                            }
                                            let page = 0;
                                            const msg = await interaction.reply({
                                                content: "Select a Note:",
                                                components: [rows[page], row2],
                                                ephemeral: true
                                            });
                                            const collector = msg.createMessageComponentCollector({
                                                filter,
                                                time: 90000
                                            });
                                            collector.on("collect", async (i) => {
                                                if (i.customId=="notesel") {
                                                    const mes = await i.deferReply();
                                                    client.database.getCharNote(user, {id: u.char_id}, {id: Number(i.values[0])})
                                                        .then(async (note) => {
                                                            const embed = new EmbedBuilder()
                                                                .setColor("Yellow")
                                                                .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                                                .setTitle(`Note #${note.id}`)
                                                                .setDescription(note.content)
                                                                .setTimestamp()
                                                            if (note.title) {
                                                                embed.setTitle(`${note.title} (#${note.id})`);
                                                            }
                                                            await mes.edit({
                                                                embeds: [embed],
                                                                ephemeral: note.private
                                                            });
                                                        })
                                                        .catch(async (err) => {
                                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                                            if (String(err).includes("Error 404")) {
                                                                await mes.edit({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor("Red")
                                                                            .setTitle(`${err}`)
                                                                            .setDescription("Could not find that Character Note in the Database!")
                                                                            .setTimestamp()
                                                                    ],
                                                                    ephemeral: true
                                                                });
                                                            } else {
                                                                await mes.edit({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor("Red")
                                                                            .setTitle("An Error occurred...")
                                                                            .setDescription(`${err}`)
                                                                            .setTimestamp()
                                                                    ],
                                                                    ephemeral: true
                                                                });
                                                            }
                                                        });
                                                } else if (i.customId=="prev") {
                                                    if (page>0) {
                                                        page--;
                                                        if (page==0) {
                                                            row2.components[0].setDisabled(true);
                                                            row2.components[1].setDisabled(false);
                                                        } else {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select a Note:",
                                                            components: [rows[page], row2],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId=="next") {
                                                    if (page<rows.length-1) {
                                                        page++;
                                                        if (page==rows.length-1) {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(true);
                                                        } else {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select a Note:",
                                                            components: [rows[page], row2],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId=="cancel") {
                                                    await i.deferUpdate();
                                                    collector.stop();
                                                }
                                            });
                                            collector.on("end", async (collected) => {
                                                if (collected.size===0) {
                                                    await msg.edit({
                                                        content: "Selection timed out...",
                                                        components: [],
                                                        ephemeral: true
                                                    });
                                                } else {
                                                    client.database.writeDevLog(await client.database.writeLog(server, `Collected ${collected.size} Interactions`).catch(err => client.database.writeDevLog(`${err}`)));
                                                }
                                                setTimeout(async () => {
                                                    await msg.delete();
                                                }, 5000);
                                            });
                                        })
                                        .catch(async (err) => {
                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                            if (String(err).includes("Error 404")) {
                                                if (String(err).includes("Note")) {
                                                    await interaction.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find any Character Notes in the Database!")
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                } else {
                                                    await interaction.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find that Character in the Database. Make sure to select an existing Character!")
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                }
                                            }
                                        });
                                }
                            })
                            .catch(async (err) => {
                                client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find User in the Database. Please contact the Developer if this Issue persists!")
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("An Error occurred...")
                                                .setDescription(`${err}`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                }
                            });
                    } else {
                        client.database.getUser(user)
                            .then(async (u) => {
                                if (!u.char_id) {
                                    const cmd = await server.commands.cache.find(c => c.name == "character");
                                    client.database.writeDevLog(await client.database.writeLog(server, "Error 404: No Character selected").catch(err => client.database.writeDevLog(`${err}`)));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("Error 404: No Character selected")
                                                .setDescription(`You need to select a Character first before you use this Command! Use </character select:${cmd.id}> to select a Character.`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    client.database.getCharNote(user, {id: u.char_id}, {id: noteId})
                                        .then(async (note) => {
                                            const embed = new EmbedBuilder()
                                                .setColor("Yellow")
                                                .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                                .setTitle(`Note #${note.id}`)
                                                .setDescription(note.content)
                                                .setTimestamp()
                                            if (note.title) {
                                                embed.setTitle(`${note.title} (#${note.id})`);
                                            }
                                            await interaction.reply({
                                                embeds: [embed],
                                                ephemeral: note.private
                                            });
                                        })
                                        .catch(async (err) => {
                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find that Character Note in the Database!")
                                                            .setTimestamp()
                                                    ],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle("An Error occurred...")
                                                            .setDescription(`${err}`)
                                                            .setTimestamp()
                                                    ],
                                                    ephemeral: true
                                                });
                                            }
                                        });
                                }
                            })
                            .catch(async (err) => {
                                client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find User in the Database. Contact the Developer if this Issue persists!")
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("An Error occurred...")
                                                .setDescription(`${err}`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                }
                            });
                    }
            return;
            case "add":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Add Character Note
                return;
            case 'add':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO: Add Character
                }
            return;
            case "remove":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Remove Character Note
                return;
            return;
            case "edit":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Edit Character Note
                return;
        }
    }
}
export default new Command();
