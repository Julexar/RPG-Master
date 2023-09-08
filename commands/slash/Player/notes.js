import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
class Command {
    constructor() {
        this.name = "notes";
        this.description = "Note related Commands";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.SendMessages];
        this.options = [
            {
                name: "view",
                description: "Shows a List of your Notes",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                {
                    name: "server",
                    description: "Shows server specific Notes",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "private",
                            description: "When true, shows private Notes",
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: "id",
                            description: "Provide the ID of a Note",
                            type: ApplicationCommandOptionType.Number,
                            required: false,
                            minValue: 1
                        },
                    ],
                },
                {
                    name: "global",
                    description: "Shows global Notes",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "private",
                            description: "When true, shows private Notes",
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: "id",
                            description: "Provide the ID of a Note",
                            type: ApplicationCommandOptionType.Number,
                            required: false,
                            minValue: 1
                        },
                    ],
                },
                ],
            },
            {
                name: "add",
                description: "Adds a Note",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "server",
                        description: "Adds a server specific Note",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "global",
                        description: "Adds a global Note",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "remove",
                description: "Removes a Note",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "server",
                        description: "Removes a server specific Note",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "id",
                                description: "Provide the ID of the Note",
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                    {
                        name: "global",
                        description: "Removes a global Note",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "id",
                                description: "Provide the ID of the Note",
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                ],
            },
            {
                name: "edit",
                description: "Edits a Note",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "server",
                        description: "Edits a server specific Note",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "id",
                                description: "Provide the ID of the Note",
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                    {
                        name: "global",
                        description: "Edits a global Note",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "id",
                                description: "Provide the ID of the Note",
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                ],
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const member = interaction.member;
        const noteId = option.getNumber("id");
        switch (option.getSubcommandGroup()) {
            case "view":
                switch (option.getSubcommand()) {
                    case "server":
                        this.viewNote(client, "server", member, noteId);
                    return;
                    case "global":
                        this.viewNote(client, "global", member, noteId);
                    return;
                }
            return;
            case "add":
                switch (option.getSubcommand()) {
                    case "server":
                        this.noteCreator(client, "server", member);
                    return;
                    case "global":
                        this.noteCreator(client, "global", member);
                    return;
                }
            return;
            case "remove":
                switch (option.getSubcommand()) {
                    case "server":
                        this.noteRemover(client, "server", member, noteId);
                    return;
                    case "global":
                        this.noteRemover(client, "global", member, noteId);
                    return;
                }
            return;
            case "edit":
                switch (option.getSubcommand()) {
                    case "server":
                        this.noteEditor(client, "server", member, noteId);
                    return;
                    case "global":
                        this.noteEditor(client, "global", member, noteId);
                    return;
                }
            return;
        }
    };

    viewNote(client, type, member, noteId) {
        const filter = m => m.user.id == member.user.id;
        const menu = new EmbedBuilder()
            .setColor("Yellow")
            .setAuthor({name: member.user.username, iconURL: member.user.avatarURL()})
        if (!noteId) {
            if (type=="server") {
                menu.setTitle("Server Notes List");
                const menus = [];
                menus.push(menu);
                client.database.getServerNote(member.guild, member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        const priv = option.getBoolean("private");
                        if (priv) {
                        for (const note of notes) {
                            if (count==9) {
                                menus.push(menu);
                                count = 0;
                                num++;
                            }
                            if (note.private) {
                                if (note.title) {
                                    menus[num].addFields({
                                        name: `${note.title} (#${note.id})`,
                                        value: note.content
                                    });
                                } else {
                                    menus[num].addFields({
                                        name: `Note #${note.id}`,
                                        value: note.content
                                    });
                                }
                            }
                        }
                        } else {
                        for (const note of notes) {
                            if (count==9) {
                            menus.push(menu);
                            count = 0;
                            num++;
                            }
                            if (note.title) {
                            menus[num].addFields({
                                name: `${note.title} (#${note.id})`,
                                value: note.content
                            });
                            } else {
                            menus[num].addFields({
                                name: `Note #${note.id}`,
                                value: note.content
                            });
                            }
                        }
                        }
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("prev")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏪")
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId("next")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏩")
                            );
                        let page = 0;
                        const msg = await interaction.reply({
                            embeds: [menus[page]],
                            components: [row],
                            ephemeral: priv
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000
                        });
                        collector.on("collect", async (i) => {
                        await i.deferUpdate();
                            if (i.customId=="prev") {
                                if (page>0) {
                                    page--;
                                    if (page==0) {
                                        row.components[0].setDisabled(true);
                                        row.components[1].setDisabled(false);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv
                                    });
                                }
                            } else if (i.customId=="next") {
                                if (page<menus.length-1) {
                                    page++;
                                    if (page==menus.length-1) {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(true);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv
                                    });
                                }
                            }
                        });
                        collector.on("end", async (collected) => {
                            if (collected.size===0) {
                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true)
                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: priv
                                });
                            } else {
                                client.database.writeLog(member.guild, `Collected ${collected.size} Interactions`)
                                    .then(mes => client.database.writeDevLog(`${mes}`))
                                    .catch(err => client.database.writeDevLog(`${err}`));
                            }
                        });
                    })
                    .catch(err => {
                        client.database.writeLog(member.guild, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(`${msg}`);
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                        new EmbedBuilder()
                                            .setColor("Red")
                                            .setTitle(`${err}`)
                                            .setDescription("Could not find any Server Notes in the Database!")
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
                            })
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                    });
            } else if (type=="global") {
                menu.setTitle("Global Notes List");
                const menus = [];
                menus.push(menu);
                client.database.getGlobalNote(member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        const priv = option.getBoolean("private");
                        if (priv) {
                            for (const note of notes) {
                                if (count==9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }
                                if (note.private) {
                                    if (note.title) {
                                        menus[num].addFields({
                                        name: `${note.title} (#${note.id})`,
                                        value: note.content
                                        });
                                    } else {
                                        menus[num].addFields({
                                        name: `Note #${note.id}`,
                                        value: note.content
                                        });
                                    }
                                }
                            }
                        } else {
                        for (const note of notes) {
                            if (count==9) {
                                menus.push(menu);
                                count = 0;
                                num++;
                            }
                            if (note.title) {
                                menus[num].addFields({
                                    name: `${note.title} (#${note.id})`,
                                    value: note.content
                                });
                            } else {
                                menus[num].addFields({
                                    name: `Note #${note.id}`,
                                    value: note.content
                                });
                            }
                        }
                        }
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("prev")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏪")
                                .setDisabled(true),
                                new ButtonBuilder()
                                .setCustomId("next")
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("⏩")
                            );
                        let page = 0;
                        const msg = await interaction.reply({
                            embeds: [menus[page]],
                            components: [row],
                            ephemeral: priv
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000
                        });
                        collector.on("collect", async (i) => {
                            await i.deferUpdate();
                            if (i.customId=="prev") {
                                if (page>0) {
                                    page--;
                                    if (page==0) {
                                        row.components[0].setDisabled(true);
                                        row.components[1].setDisabled(false);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv
                                    });
                                }
                            } else if (i.customId=="next") {
                                if (page<menus.length-1) {
                                    page++;
                                    if (page==menus.length-1) {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(true);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv
                                    });
                                }
                            }
                        });
                        collector.on("end", async (collected) => {
                            if (collected.size===0) {
                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true)
                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: priv
                                });
                            } else {
                                client.database.writeLog(member.guild, `Collected ${collected.size} Interactions`)
                                    .then(mes => client.database.writeDevLog(`${mes}`))
                                    .catch(err => client.database.writeDevLog(`${err}`));
                            }
                        });
                    })
                    .catch(err => {
                        client.database.writeLog(member.guild, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(`${msg}`);
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                        new EmbedBuilder()
                                            .setColor("Red")
                                            .setTitle(`${err}`)
                                            .setDescription("Could not find any Global Notes in the Database!")
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
                            })
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                    });
            }
        } else {
            if (type=="server") {
                client.database.getServerNote(member.guild, member.user, {id: noteId})
                    .then(async (note) => {
                        if (note.title) {
                            menu.setTitle(`${note.title} (#${note.id})`);
                        } else {
                            menu.setTitle(`Note #${note.id}`);
                        }
                        menu.setDescription(note.content);
                        menu.setTimestamp();
                        if (note.private) {
                            await interaction.reply({
                                embeds: [menu],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [menu]
                            });
                        }
                    })
                    .catch(err => {
                        client.database.writeLog(member.guild, `${err}`)
                        .then(async (mes) => {
                            client.database.writeDevLog(`${mes}`);
                            if (String(err).includes("Error 404")) {
                                await interaction.reply({
                                    embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`${err}`)
                                        .setDescription("Could not find that Note in the Database!")
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
                        })
                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                    });
            } else if (type=="global") {
                client.database.getGlobalNote(member.user, {id: noteId})
                    .then(async (note) => {
                        if (note.title) {
                            menu.setTitle(`${note.title} (#${note.id})`);
                        } else {
                            menu.setTitle(`Note #${note.id}`);
                        }
                        menu.setDescription(note.content);
                        menu.setTimestamp();
                        if (note.private) {
                            await interaction.reply({
                                embeds: [menu],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [menu]
                            });
                        }
                    })
                    .catch(err => {
                        client.database.writeLog(member.guild, `${err}`)
                            .then(async (mes) => {
                                client.database.writeDevLog(`${mes}`);
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                        new EmbedBuilder()
                                            .setColor("Red")
                                            .setTitle(`${err}`)
                                            .setDescription("Could not find that Note in the Database!")
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
                            })
                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                    });
            }
        }
    }

    async noteCreator(client, type, member) {
        const filter = m => m.user.id == member.user.id;
        const menu = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("Note Creator")
            .setAuthor({name: member.user.username, iconURL: member.user.avatarURL()})
            .setFields(
                {
                name: "Title",
                value: "\ ",
                inline: true,
                },
                {
                name: "Private?",
                value: "false",
                inline: true,
                },
                {
                name: "Content",
                value: "\ "
                }
            )
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("title")
                    .setLabel("Change Title")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("🔤"),
                new ButtonBuilder()
                    .setCustomId("content")
                    .setLabel("Change Content")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("📝"),
                new ButtonBuilder()
                    .setCustomId("priv")
                    .setLabel("Toggle Private")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("🔁")
            );
        const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("finish")
                .setLabel("Finish")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );
        const msg = await interaction.reply({
            embeds: [menu],
            components: [row1, row2],
            ephemeral: Boolean(menu.data.fields[1].value)
        });
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 90000
        });
        collector.on("collect", async (i) => {
            if (i.customId=="title") {
                const mes = await i.deferReply();
                await mes.edit({
                    content: "Reply with a new Title."
                });
                const mesfil = m => m.reference.messageId == mes.id && m.author.id == member.user.id;
                const mescol = i.channel.createMessageCollector({
                    mesfil,
                    time: 35000,
                    max: 1
                });
                mescol.on("collect", j => {
                    menu.data.fields[0].value = j.content;
                });
                mescol.on("end", async (collected) => {
                    if (collected.size===0) {
                        await mes.edit({
                            content: "Reply collection timed out..."
                        });
                    } else {
                        client.database.writeLog(member.guild, `Collected ${collected.size} Replies`)
                            .then(async (mes1) => {
                                client.database.writeDevLog(`${mes1}`);
                                await msg.edit({
                                    embeds: [menu],
                                    components: [row1, row2],
                                    ephemeral: Boolean(menu.data.fields[1].value)
                                });
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            })
                            .catch(err => client.database.writeDevLog(`${err}`));
                    }
                });
            } else if (i.customId=="content") {
                const mes = await i.deferReply();
                await mes.edit({
                    content: "Reply with the Content of the Note!"
                });
                const mesfil = m => m.reference.messageId == mes.id && m.author.id == member.user.id;
                const mescol = i.channel.createMessageCollector({
                    mesfil,
                    time: 35000,
                    max: 1
                });
                mescol.on("collect", j => {
                    menu.data.fields[2].value = j.content;
                });
                mescol.on("end", async (collected) => {
                if (collected.size===0) {
                    await mes.edit({
                        content: "Reply collection timed out..."
                    });
                } else {
                    client.database.writeLog(member.guild, `Collected ${collected.size} Replies`)
                        .then(async (mes1) => {
                            client.database.writeDevLog(`${mes1}`);
                            await msg.edit({
                                embeds: [menu],
                                components: [row1, row2],
                                ephemeral: Boolean(menu.data.fields[1].value)
                            });
                            setTimeout(async () => {
                                await mes.delete();
                            }, 5000);
                        })
                        .catch(err => client.database.writeDevLog(`${err}`));
                }
                });
            } else if (i.customId=="priv") {
                await i.deferUpdate();
                let bool = Boolean(menu.data.fields[1].value);
                if (bool) {
                    bool = false;
                } else {
                    bool = true;
                }
                menu.data.fields[1].value = `${bool}`;
                await msg.edit({
                    embeds: [menu],
                    components: [row1, row2],
                    ephemeral: bool
                });
            } else if (i.customId=="finish") {
                const note = {
                    title: menu.data.fields[0].value,
                    content: menu.data.fields[2].value,
                    private: Boolean(menu.data.fields[1].value)
                };
                const m = i.deferReply();
                if (type=="server") {
                    client.database.addServerNote(member.guild, member.user, note)
                        .then(mes => {
                            client.database.writeLog(member.guild, `${mes}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    await m.edit({
                                        content: "Note has been created successfully!"
                                    });
                                })
                                .catch(err => client.database.writeDevLog(`${err}`));
                        })
                        .catch(err => {
                            client.database.writeLog(member.guild, `${err}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    if (String(err).includes("Error 409")) {
                                        await m.edit({
                                            embeds: [
                                                new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("A Note with this Content/Title already exists!")
                                                .setTimestamp()
                                            ],
                                            ephemeral: true
                                        });
                                    } else {
                                        await m.edit({
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
                                })
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                        });
                } else if (type=="global") {
                    client.database.addGlobalNote(member.user, note)
                        .then(mes => {
                            client.database.writeLog(member.guild, `${mes}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    await m.edit({
                                        content: "Note has been created successfully!"
                                    });
                                })
                                .catch(err => client.database.writeDevLog(`${err}`));
                        })
                        .catch(err => {
                            client.database.writeLog(member.guild, `${err}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    if (String(err).includes("Error 409")) {
                                        await m.edit({
                                            embeds: [
                                                new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("A Note with this Content/Title already exists!")
                                                .setTimestamp()
                                            ],
                                            ephemeral: true
                                        });
                                    } else {
                                        await m.edit({
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
                                })
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                        });
                }
            } else if (i.customId=="cancel") {
                const mes = await i.deferReply();
                await mes.edit({
                    content: "Note Creation has been cancelled...",
                    ephemeral: true
                });
                collector.stop();
            }
        });
        collector.on("end", async (collected) => {
        if (collected.size > 0) {
            client.database.writeLog(member.guild, `Collected ${collected.size} Interactions`)
            .then(mes => client.database.writeDevLog(`${mes}`))
            .catch(err => client.database.writeDevLog(`${err}`));
        }
        await msg.edit({
            embeds: [menu],
            components: [],
            ephemeral: Boolean(menu.data.fields[1].value)
        });
        });
    }

    noteRemover(client, type, member, noteId) {

    }

    noteEditor(client, type, member, noteId) {
        
    }
}
export default new Command();