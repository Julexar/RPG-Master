import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder } from "discord.js";
class Command {
    constructor() {
        this.name = "server";
        this.description = "Server specific Commands";
        this.defaultMemberPermissions = [PermissionFlagsBits.ManageGuild];
        this.enabled = true;
        this.options = [
            {
                name: "gm",
                description: "GM related Commands",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "add",
                        description: "Adds a GM",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "user",
                                description: "Provide a User",
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "remove",
                        description: "Removes a GM",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "list",
                        description: "Shows a List of all GMs",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "can-edit",
                        description: "Sets whether GMs can edit Game assets",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "bool",
                                description: "Provide a Boolean",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "setrole",
                description: "Sets a Server Role",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "gm",
                        description: "Sets the GM Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "mod",
                        description: "Sets the Mod Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "admin",
                        description: "Sets the Admin Role",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "role",
                                description: "Provide a Role",
                                type: ApplicationCommandOptionType.Role,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "getrole",
                description: "Gets Server Roles",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "gm",
                        description: "Gets the GM Role",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "staff",
                        description: "Gets the Staff Roles",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "setchannel",
                description: "Sets serverwide Channels",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "summary",
                        description: "Sets Session Summary Channel",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "Provide a Channel",
                                type: ApplicationCommandOptionType.Channel,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "log",
                        description: "Sets the Log Channel",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "channel",
                                description: "Provide a Channel",
                                type: ApplicationCommandOptionType.Channel,
                                required: true,
                            },
                        ],
                    },
                ],
            },
            {
                name: "dup-sessions",
                description: "Sets whether duplicate Sessions can be created",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "bool",
                        description: "Provide a Boolean",
                        type: ApplicationCommandOptionType.Boolean,
                        required: true,
                    },
                ],
            },
            {
                name: "print-logs",
                description: "Sets whether Logs should be posted Daily",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "bool",
                        description: "Provide a Boolean",
                        type: ApplicationCommandOptionType.Boolean,
                        required: true,
                    },
                ],
            },
        ];
    };

    async run(client, interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        client.database.getServer(server)
            .then(async (s) => {
                if (option.getSubcommandGroup() == "gm") {
                    const gm_role = await server.roles.cache.get(s.dm_role);
                    switch (option.getSubcommand()) {
                        case "add":
                            const user = option.getUser("user");
                            client.database.addGM(server, user)
                                .then(async (msg1) => {
                                    client.database.writeLog(server, msg1)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                    const member = await server.members.cache.get(user.id);
                                    await member.roles.add(gm_role);
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setTitle("Success")
                                                .setDescription(`<@${user.id}> has been added as a GM!`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 409")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("This User is already a GM!")
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
                        return;
                        case "remove":
                            client.database.getGM(server)
                                .then(async (gms) => {
                                    const rows = [];
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
                                                .setLabel("Cancel")
                                                .setStyle(ButtonStyle.Danger)
                                        );
                                    let count = 0;
                                    const row1 = new ActionRowBuilder()
                                        .addComponents(
                                            new StringSelectMenuBuilder()
                                                .setCustomId("gmsel")
                                                .setMaxValues(1)
                                                .setPlaceholder("No GM selected...")
                                        );
                                    for (async(gm) of gms) {
                                        if (count == 24) {
                                            rows.push(row1);
                                            row1 = new ActionRowBuilder()
                                                .addComponents(
                                                    new StringSelectMenuBuilder()
                                                        .setCustomId("gmsel")
                                                        .setMaxValues(1)
                                                        .setPlaceholder("No GM selected...")
                                                );
                                            count = 0;
                                        }
                                        const dm = await server.members.cache.get(gm.user_id);
                                        row1.components[0].addOptions({
                                            label: `${dm.username}`,
                                            value: `${gm.user_id}`
                                        });
                                        count++;
                                    }
                                    let page = 0;
                                    const msg = await interaction.reply({
                                        content: "Select a GM:",
                                        components: [rows[page], row2],
                                        ephemeral: true
                                    });
                                    const filter = m => m.user.id == interaction.user.id;
                                    const collector = await msg.createMessageComponentCollector({
                                        filter,
                                        time: 90000
                                    });
                                    collector.on("collect", async (i) => {
                                        switch (i.customId) {
                                            case "gmsel":
                                                client.database.remGM(server, { id: Number(i.values[0]) })
                                                    .then(async (msg1) => {
                                                        client.database.writeLog(server, msg1)
                                                            .then(msg2 => client.database.writeDevLog(msg2))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        const member = await server.members.cache.get(Number(i.values[0]));
                                                        await member.roles.remove(gm_role);
                                                        await i.deferReply({
                                                            content: `User <@${Number(i.values[0])}> has been removed as a GM!`,
                                                            ephemeral: true
                                                        });
                                                    })
                                                    .catch(async (err) => {
                                                        let mes = await i.deferReply();
                                                        client.database.writeLog(server, `${err}`)
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                if (String(err).includes("Error 404")) {
                                                                    await mes.edit({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor("Red")
                                                                                .setTitle(`${err}`)
                                                                                .setDescription("This User is not a GM!")
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
                                                            })
                                                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                    });
                                            break;
                                            case "prev":
                                                await i.deferUpdate();
                                                page--;
                                                if (page >= 0) {
                                                    if (page == 0) {
                                                        row2.components[0].setDisabled(true);
                                                        row2.components[1].setDisabled(false);
                                                    } else {
                                                        row2.components[0].setDisabled(false);
                                                        row2.components[1].setDisabled(false);
                                                    }
                                                    await msg.editReply({
                                                        content: "Select a GM:",
                                                        components: [rows[page], row2],
                                                        ephemeral: true
                                                    });
                                                }
                                            break;
                                            case "next":
                                                await i.deferUpdate();
                                                page++;
                                                if (page <= rows.length - 1) {
                                                    if (page == rows.length - 1) {
                                                        row2.components[0].setDisabled(false);
                                                        row2.components[1].setDisabled(true);
                                                    } else {
                                                        row2.components[0].setDisabled(false);
                                                        row2.components[1].setDisabled(false);
                                                    }
                                                    await msg.editReply({
                                                        content: "Select a GM:",
                                                        components: [rows[page], row2],
                                                        ephemeral: true
                                                    });
                                                }
                                            break;
                                            case "cancel":
                                                await i.deferUpdate();
                                                await collector.stop();
                                            break;
                                        }
                                    });
                                    collector.on("end", async (collected) => {
                                        if (collected.size === 0) {
                                            await msg.editReply({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err => client.database.writeDevLog(`${err}`));
                                        }
                                        setTimeout(async () => {
                                            await msg.delete();
                                        }, 5000);
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("There are no GMs registered in this Server!")
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
                        return;
                        case "list":
                            client.database.getGM(server)
                                .then(async (gms) => {
                                    const rows = [];
                                    const row1 = new ActionRowBuilder()
                                        .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("prev")
                                            .setEmoji("⏪")
                                            .setStyle(ButtonStyle.Secondary)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId("next")
                                            .setEmoji("⏩")
                                            .setStyle(ButtonStyle.Secondary)
                                        );
                                    let count = 0;
                                    const emb = new EmbedBuilder()
                                        .setColor("Aqua")
                                        .setTitle("GM List")
                                    let list = "";
                                    for (const gm in gms) {
                                        if (count == 24) {
                                            emb.setDescription(list);
                                            rows.push(emb);
                                            emb = new EmbedBuilder()
                                                .setColor("Aqua")
                                                .setTitle("GM List")
                                            count = 0;
                                        }
                                        list += `<@${gm.user_id}>\n`;
                                        count++;
                                    }
                                    let page = 0;
                                    const msg = await interaction.reply({
                                        embeds: [rows[page]],
                                        components: [row1],
                                    });
                                    const filter = m => m.user.id == interaction.user.id;
                                    const collector = await msg.createMessageComponentCollector({
                                        filter,
                                        time: 90000
                                    });
                                    collector.on("collect", async (i) => {
                                        await i.deferUpdate();
                                        if (i.customId == "prev") {
                                            page++;
                                            if (page <= rows.length - 1) {
                                                if (page == rows.length - 1) {
                                                    row1.components[0].setDisabled(false);
                                                    row1.components[1].setDisabled(true);
                                                } else {
                                                    row1.components[0].setDisabled(false);
                                                    row1.components[1].setDisabled(false);
                                                }
                                                await msg.edit({
                                                    embeds: [rows[page]],
                                                    components: [row1]
                                                });
                                            }
                                        } else if (i.customId == "next") {
                                            page--;
                                            if (page >= 0) {
                                                if (page == 0) {
                                                    row1.components[0].setDisabled(true);
                                                    row1.components[1].setDisabled(false);
                                                } else {
                                                    row1.components[0].setDisabled(false);
                                                    row1.components[1].setDisabled(false);
                                                }
                                                await msg.edit({
                                                    embeds: [rows[page]],
                                                    components: [row1]
                                                });
                                            }
                                        }
                                    });
                                    collector.on("end", async (collected) => {
                                        if (collected.size === 0) {
                                            await msg.edit({
                                                content: "Selection timed out...",
                                                embeds: [],
                                                components: []
                                            });
                                        } else {
                                            client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                .then(msg1 => client.database.writeDevLog(msg1))
                                                .catch(err => client.database.writeDevLog(`${err}`));
                                        }
                                        setTimeout(async () => {
                                            await msg.delete();
                                        }, 5000);
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find any GMs in the Database! Try adding one first by using </server gm add:1115936113803145328>")
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
                        return;
                        case "can-edit":
                            const bool = option.getBoolean("bool");
                            client.database.setGMEdit(server, bool)
                                .then(async (msg1) => {
                                    client.database.writeDevLog(msg1);
                                    if (bool) {
                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor("Green")
                                                    .setTitle("Success")
                                                    .setDescription("GMs are now able to edit Rules, create custom Assets, etc.")
                                                    .setTimestamp()
                                            ],
                                            ephemeral: true
                                        });
                                    } else {
                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor("Green")
                                                    .setTitle("Success")
                                                    .setDescription("GMs are no longer able to edit Rules, create custom Assets, etc.")
                                                    .setTimestamp()
                                            ],
                                            ephemeral: true
                                        });
                                    }
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
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
                                        })
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                });
                        return;
                    }
                } else if (option.getSubcommandGroup() == "setrole") {
                    switch (option.getSubcommand()) {
                        case "gm":
                            const gm = option.getRole("role");
                            client.database.setDMRole(server, gm)
                                .then(async function() {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setTitle("Success")
                                                .setDescription(`GM Role has been set to <@&${gm.id}> successfully!`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
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
                                        })
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                });
                        return;
                        case "mod":
                            const mod = option.getRole("role");
                            client.database.setStaffRole(server, "mod", mod)
                                .then(async (msg1) => {
                                    client.database.writeLog(server, msg1)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setTitle("Success")
                                                .setDescription(`Moderator Role has been set to <@&${mod.id}> successfully!`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async () => {
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
                                        })
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                });
                        return;
                        case "admin":
                            const admin = option.getRole("role");
                            client.database.setStaffRole(server, "admin", admin)
                                .then(async function() {
                                    await interaction.reply({
                                        embeds: [
                                        new EmbedBuilder()
                                            .setColor("Green")
                                            .setTitle("Success")
                                            .setDescription(`Moderator Role has been set to <@&${admin.id}> successfully!`)
                                            .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
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
                                        })
                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                });
                        return;
                    }
                } else if (option.getSubcommandGroup() == "getrole") {
                    switch (option.getSubcommand()) {
                        case "gm":
                            client.database.getDMRole(server.id)
                                .then(async (dmr) => {
                                    const role = await server.roles.cache.get(dmr);
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Aqua")
                                                .setTitle("GM Role")
                                                .setDescription(`This Server\'s GM Role is: <@&${role.id}>`)
                                                .setTimestamp()
                                        ]
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find a GM Role in the Database. Contact the Developer if this Issue persists.")
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
                        return;
                        case "staff":
                            client.database.getStaffRole(server)
                                .then(async (serv) => {
                                    const admin = await server.roles.cache.get(serv.admin_role);
                                    const mod = await server.roles.cache.get(serv.mod_role);
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Aqua")
                                                .setTitle("Staff Roles")
                                                .setFields(
                                                    {
                                                        name: "Admin Role",
                                                        value: `<@&${admin.id}>`
                                                    },
                                                    {
                                                        name: "Moderator Role",
                                                        value: `<@&${mod.id}>`
                                                    }
                                                )
                                                .setTimestamp()
                                        ]
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Staff")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find any Staff Roles in the Database! Try setting the Roles first.\n\nContact the Developer if this Issue persists.")
                                                            .setTimestamp()
                                                    ],
                                                    ephemeral: true
                                                });
                                            } else if (String(err).includes("Server")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Server could not be found in the Database! Contact the Developer if this Issue persists.")
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
                        return;
                    }
                } else if (option.getSubcommandGroup() == "setchannel") {
                    switch (option.getSubcommand()) {
                        case "summary":
                            const channel = option.getChannel("channel");
                            client.database.setSummaryChannel(server, channel)
                                .then(async (msg1) => {
                                    client.database.writeLog(server, msg1)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setTitle("Success")
                                                .setDescription(`Successfully set Summary Channel for Sessions to <#${channel.id}>`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Server could not be found in the Database! Contact the Developer if this Issue persists.")
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
                        return;
                        case "log":
                            const chan = option.getChannel("channel");
                            client.database.setLogChannel(server, chan)
                                .then(async (msg1) => {
                                    client.database.writeLog(server, msg1)
                                        .then(msg2 => client.database.writeDevLog(msg2))
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setTitle("Success")
                                                .setDescription(`Successfully set Log Channel to <#${chan.id}>`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Server could not be found in the Database! Contact the Developer if this Issue persists.")
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
                                })
                        return;
                    }
                } else if (option.getSubcommand() == "dup_sessions") {
                    const bool = option.getBoolean("bool");
                    client.database.setDupSessions(server, bool)
                        .then(async (msg1) => {
                            client.database.writeLog(server, msg1)
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err => client.database.writeDevLog(`${err}`));
                            if (bool) {
                                await interaction.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor("Green")
                                            .setTitle("Success")
                                            .setDescription("The creation of duplicate Sessions has been enabled!")
                                            .setTimestamp()
                                    ],
                                    ephemeral: true
                                });
                            } else {
                                await interaction.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor("Green")
                                            .setTitle("Success")
                                            .setDescription("The creation of duplicate Sessions has been disabled!")
                                            .setTimestamp()
                                    ],
                                    ephemeral: true
                                });
                            }
                        })
                        .catch(async (err) => {
                            client.database.writeLog(server, `${err}`)
                                .then(async (msg1) => {
                                    client.database.writeDevLog(msg1);
                                    if (String(err).includes("Error 404")) {
                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor("Red")
                                                    .setTitle(`${err}`)
                                                    .setDescription("The Server could not be found in the Database! Contact the Developer if this Issue persists.")
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
                } else if (option.getSubcommand() == "print-logs") {
                    const bool = option.getBoolean("bool");
                    client.database.toggleLogs(server, bool)
                        .then(async (msg1) => {
                            client.database.writeLog(server, msg1)
                                .then(msg2 => client.database.writeDevLog(msg2))
                                .catch(err => client.database.writeDevLog(`${err}`));
                            let opt = "";
                            if (bool) {
                                await interaction.reply({
                                    content: `Logs ${opt} will now be printed in the Log Channel.`,
                                    ephemeral: true
                                });
                            } else {
                                await interaction.reply({
                                    content: `Logs ${opt} will no longer be printed in the Log Channel.`,
                                    ephemeral: true
                                });
                            }
                        })
                        .catch(async (err) => {
                            client.database.writeLog(server, `${err}`)
                                .then(async (msg1) => {
                                    client.database.writeDevLog(msg1);
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
                                })
                                .catch(err1 => client.database.writeDevLog(`${err1}`));
                        });
                }
            })
            .catch(async (err) => {
                client.database.writeLog(server, `${err}`)
                    .then(async (msg1) => {
                        client.database.writeDevLog(msg1);
                        if (String(err).includes("Error 404")) {
                            await interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`${err}`)
                                        .setDescription("The Server could not be found in the Database! Contact the Developer if this Issue persists.")
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
export default new Command();
