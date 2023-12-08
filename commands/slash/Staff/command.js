import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandPermissionType, ChannelSelectMenuBuilder, ChannelType, EmbedBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder, PermissionFlagsBits } from "discord.js";
const cmds = [];
import config from "../../../config.js";
class Command {
    constructor() {
        this.server;
        this.name = "command";
        this.description = "Command Settings";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
        this.options = [
            {
                name: "toggle",
                description: "Toggles a Command",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "command",
                        description: "Choose a Command",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: cmds,
                    },
                ],
            },
            {
                name: "restriction",
                description: "Edits Restrictions of a Command",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "toggle",
                        description: "Toggles the Restrictions of a Command",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "command",
                                description: "Choose a Command",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: cmds,
                            },
                        ],
                    },
                    {
                        name: "add",
                        description: "Adds a Restriction to a Command",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "command",
                                description: "Choose a Command",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: cmds,
                            },
                            {
                                name: "type",
                                description: "Choose a restriction type",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: [
                                    {
                                        name: "User",
                                        value: "user",
                                    },
                                    {
                                        name: "Role",
                                        value: "role",
                                    },
                                    {
                                        name: "Channel",
                                        value: "chan",
                                    },
                                ],
                            },
                            {
                                name: "permitted",
                                description: "Provide a boolean",
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                        ],
                    },
                    {
                        name: "rem",
                        description: "Removes a Restriction from a Command",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "command",
                                description: "Choose a Command",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: cmds,
                            },
                            {
                                name: "type",
                                description: "Choose a restriction type",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: [
                                    {
                                        name: "User",
                                        value: "user",
                                    },
                                    {
                                        name: "Role",
                                        value: "role",
                                    },
                                    {
                                        name: "Channel",
                                        value: "chan",
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: "view",
                        description: "Shows the Restrictions of a Command",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "command",
                                description: "Choose a Command",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                choices: cmds,
                            },
                        ],
                    },
                ],
            },
        ];
    };
    setServer(guild) {
        this.server = guild;
        this.setChoices();
    }

    setChoices() {
        this.server.commands.cache.forEach(cmd => {
            cmds.push({
                name: cmd.name,
                value: `${cmd.id}`,
            });
        });
    }

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const filter = m => m.user.id == user.id;
        const cmd = {
            id: Number(option.getString("command"))
        };
        switch (option.getSubcommand()) {
            case "toggle":
                if (option.getSubcommandGroup() == "restriction") {
                    client.database.restrictServCmd(this.server, cmd)
                } else {
                    client.database.toggleServCmd(this.server, cmd)
                        .then(msg => {
                            client.database.writeLog(this.server, `${msg}`)
                                .then(async (mes) => {
                                    client.database.writeDevLog(`${mes}`);
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Green")
                                                .setDescription(`${mes}`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                })
                                .catch(err => client.database.writeDevLog(`${err}`));
                        })
                        .catch(err => {
                            client.database.writeLog(this.server, `${err}`)
                                .then(async (mes) => {
                                    client.database.writeDevLog(`${mes}`);
                                    if (String(err).includes("Command")) {
                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor("Red")
                                                    .setTitle(`${err}`)
                                                    .setDescription("Could not find that Server Command in the Database!")
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
                                                    .setDescription("Could not find the Server in the Database!")
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
            return;
            case "add":
                if (option.getString("type")=="user") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                                .setCustomId("usel")
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No User selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a User:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="usel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.User,
                                permission: option.getBoolean("permitted")
                            };
                            client.database.addRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            this.server.commands.permissions.add({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                permissions: [rest]
                                            })
                                                .then(async () => {
                                                    client.database.writeDevLog(`${mesag}`);
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 409")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Restriction already exists for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                } else if (option.getString("type")=="role") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId("rsel")
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No Role selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a Role:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="rsel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.Role,
                                permission: option.getBoolean("permitted")
                            };
                            client.database.addRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            client.database.writeDevLog(`${mesag}`);
                                            this.server.commands.permissions.add({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                permissions: [rest]
                                            })
                                                .then(async () => {
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 409")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Restriction already exists for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                } else if (option.getString("type")=="chan") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId("csel")
                                .setChannelTypes([ChannelType.GuildText, ChannelType.GuildDirectory])
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No Channel selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a Channel:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="csel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.Channel,
                                permission: option.getBoolean("permitted")
                            };
                            client.database.addRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            client.database.writeDevLog(`${mesag}`);
                                            this.server.commands.permissions.add({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                permissions: [rest]
                                            })
                                                .then(async () => {
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 409")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("The Restriction already exists for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                }
            return;
            case "rem":
                if (option.getString("type")=="user") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                                .setCustomId("usel")
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No User selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a User:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="usel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.User
                            };
                            client.database.addRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            client.database.writeDevLog(`${mesag}`);
                                            this.server.commands.permissions.remove({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                users: `${rest.id}`
                                            })
                                                .then(async () => {
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 409")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find the Restriction for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                } else if (option.getString("type")=="role") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId("rsel")
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No Role selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a Role:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="rsel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.Role
                            };
                            client.database.addRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            client.database.writeDevLog(`${mesag}`);
                                            this.server.commands.permissions.remove({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                roles: `${rest.id}`
                                            })
                                                .then(async () => {
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 409")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find the Restriction for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                } else if (option.getString("type")=="chan") {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId("csel")
                                .setChannelTypes([ChannelType.GuildText, ChannelType.GuildDirectory])
                                .setMinValues(1)
                                .setMaxValues(1)
                                .setPlaceholder("No Channel selected...")
                        );
                    const msg = await interaction.reply({
                        content: "Select a Channel:",
                        components: [row],
                        ephemeral: true
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId=="csel") {
                            const rest = {
                                id: Number(i.values[0]),
                                type: ApplicationCommandPermissionType.Channel
                            };
                            client.database.remRestriction(cmd, rest)
                                .then(mes => {
                                    client.database.writeLog(this.server, `${mes}`)
                                        .then(async (mesag) => {
                                            client.database.writeDevLog(`${mesag}`);
                                            this.server.commands.permissions.remove({
                                                command: `${cmd.id}`,
                                                token: `${config.token}`,
                                                channels: `${rest.id}`
                                            })
                                                .then(async () => {
                                                    const m = await i.deferReply();
                                                    await m.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Green")
                                                                .setDescription(`${mes}`)
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                })
                                                .catch(err => {
                                                    client.database.writeLog(this.server, `${err}`)
                                                        .then(m => client.database.writeDevLog(`${m}`))
                                                        .catch(err1 => client.database.writeDevLog(`${err1}`));
                                                });
                                        })
                                        .catch(err => client.database.writeDevLog(`${err}`));
                                })
                                .catch(err => {
                                    client.database.writeLog(this.server, `${err}`)
                                        .then(async (mes) => {
                                            client.database.writeDevLog(`${mes}`);
                                            const m = await i.deferReply();
                                            if (String(err).includes("Error 404")) {
                                                await m.edit({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find the Restriction for the given Command!")
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
                    });
                    collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: "Selection timed out...",
                                ephemeral: true
                            });
                        } else {
                            client.database.writeLog(this.server, `Collected ${collected.size} Interactions`)
                                .then(mes => client.database.writeDevLog(`${mes}`))
                                .catch(err => client.database.writeDevLog(`${err}`));
                        }
                    });
                }
            return;
        }
    }
};
export default new Command();