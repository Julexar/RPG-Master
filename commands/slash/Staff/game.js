import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder } from "discord.js";
class Command {
    constructor() {
        this.name = "game";
        this.nick = "g";
        this.description = "Game related Commands";
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.MuteMembers];
        this.options = [
            {
                name: "add",
                description: "Adds a Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Adds a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Adds a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Adds a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Adds a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Adds a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Adds a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Adds a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Adds a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "remove",
                description: "Removes a Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Removes a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Removes a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Removes a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Removes a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Removes a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Removes a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Removes a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Removes a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: "edit",
                description: "Edits an existing Game Asset",
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: "armor",
                        description: "Edits a custom Armor",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "class",
                        description: "Edits a custom Class",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "condition",
                        description: "Edits a custom Condition",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "dmgtype",
                        description: "Edits a custom Damagetype",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "feat",
                        description: "Edits a custom Feat",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "race",
                        description: "Edits a custom Race",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subclass",
                        description: "Edits a custom Subclass",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: "subrace",
                        description: "Edits a custom Subrace",
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
        ];
    };

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const member = interaction.member;
        const server = interaction.guild;
        client.database.getServer(server)
            .then(async (s) => {
                let allowed;
                if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                    allowed = true;
                } else if (!s.gm_edit) {
                    if (!member.roles.cache.has(s.admin_role) && !member.roles.cache.has(s.mod_role)) {
                        allowed = false;
                    } else {
                        allowed = true;
                    }
                } else if (s.gm_edit) {
                    if (!member.roles.cache.has(s.admin_role) && !member.roles.cache.has(s.mod_role)) {
                        if (!member.roles.cache.has(s.dm_role)) {
                            allowed = false;
                        } else {
                            client.database.getGM(server, user)
                                .then(allowed = true)
                                .catch(allowed = false);
                        }
                    } else {
                        allowed = true;
                    }
                }
                if (!allowed) {
                    client.database.writeLog(server, `Error 403: Missing Permission`)
                        .then(async (msg) => {
                            client.database.writeDevLog(msg);
                            await interaction.reply({
                                emebds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle("Error 403: Missing Permission")
                                        .setDescription(`You do not have Permission to use this Command!\n\nOnly People with the following Roles may use this Command: <@&${s.admin_role}>, <@&${s.mod_role}>, <@&${s.dm_role}>\n\nIf you believe this is an Error, contact the Server Staff!`)
                                        .setTimestamp()
                                ],
                                ephemeral: true
                            });
                        })
                        .catch(err => client.database.writeDevLog(`${err}`));
                } else {
                    const menu = new EmbedBuilder()
                        .setColor("#00ffff")
                    const row1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("name")
                                .setLabel("Set Name")
                                .setEmoji("🔤")
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId("desc")
                                .setLabel("Set Description")
                                .setEmoji("📝")
                                .setStyle(ButtonStyle.Primary)
                        )
                    const row2 = new ActionRowBuilder();
                    const row3 = new ActionRowBuilder();
                    const row4 = new ActionRowBuilder()
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
                    let msg;
                    const filter = m => m.user.id == user.id;
                    let collector;
                    switch (option.getSubcommand()) {
                        case "armor":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    let armor = {
                                        name: "",
                                        description: "",
                                        type: "",
                                        rarity: "",
                                        dex_bonus: null,
                                        ac: 10,
                                        str_req: null,
                                        magical: false,
                                        magic_bonus: 0,
                                        attune: false,
                                        attune_req: ""
                                    }
                                    row1.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("type")
                                            .setLabel("Set Type")
                                            .setEmoji("🏷️")
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId("rarity")
                                            .setLabel("Set Rarity")
                                            .setEmoji("💠")
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId("dex")
                                            .setLabel("Set Dex-Bonus")
                                            .setEmoji("🔢")
                                            .setStyle(ButtonStyle.Primary)
                                    );
                                    row2.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("ac")
                                            .setLabel("Set AC")
                                            .setEmoji("🛡️")
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId("str")
                                            .setLabel("Set Str-Requirement")
                                            .setEmoji("💪")
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId("magical")
                                            .setLabel("Make magical")
                                            .setEmoji("🪄")
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId("attune")
                                            .setLabel("Toggle Attunement")
                                            .setEmoji("✴️")
                                            .setStyle(ButtonStyle.Primary)
                                    );
                                    menu.setTitle("Armor Creator");
                                    menu.setFields(
                                        {
                                            name: "Name",
                                            value: "\ ",
                                            inline: true,
                                        },
                                        {
                                            name: "Type",
                                            value: "\ ",
                                            inline: true,
                                        },
                                        {
                                            name: "Rarity",
                                            value: "\ ",
                                            inline: true,
                                        },
                                        {
                                            name: "Requires Attunement?",
                                            value: `${armor.attune}`,
                                            inline: true
                                        },
                                        {
                                            name: "Magical",
                                            value: "false",
                                            inline: true,
                                        },
                                        {
                                            name: "\u200B",
                                            value: "\u200B",
                                            inline: false,
                                        },
                                        {
                                            name: "AC",
                                            value: `${armor.ac}`,
                                            inline: true
                                        },
                                        {
                                            name: "Dex Bonus",
                                            value: "\ ",
                                            inline: true,
                                        },
                                        {
                                            name: "Strength Requirement",
                                            value: "\ ",
                                            inline: true,
                                        },
                                        {
                                            name: "Description",
                                            value: "\ ",
                                            inline: false
                                        }
                                    );
                                    menu.setTimestamp();
                                    msg = await interaction.reply({
                                        embeds: [menu],
                                        components: [row1, row2, row4],
                                        ephemeral: true
                                    });
                                    collector = msg.createMessageComponentCollector({
                                        filter,
                                        time: 90000
                                    });
                                    collector.on("collect", async (i) => {
                                        let mes;
                                        let filt;
                                        let mescol;
                                        let col;
                                        switch (i.customId) {
                                            case "name":
                                                mes = await i.deferReply();
                                                mes.edit({
                                                    content: `<@${user.id}> Reply with a Name for the Armor.`
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000,
                                                    max: 1
                                                });
                                                mescol.on("collect", j => {
                                                    menu.data.fields[0].value = j.content;
                                                    mescol.stop();
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                                break;
                                            case "type":
                                                const tsel = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder()
                                                            .setCustomId("tsel")
                                                            .setMaxValues(1)
                                                            .setPlaceholder("No Type selected...")
                                                            .setOptions(
                                                                {
                                                                    label: "Light Armor",
                                                                    value: "Light"
                                                                },
                                                                {
                                                                    label: "Medium Armor",
                                                                    value: "Medium"
                                                                },
                                                                {
                                                                    label: "Heavy Armor",
                                                                    value: "Heavy"
                                                                }
                                                            )
                                                    );
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Select a Type:",
                                                    components: [tsel]
                                                });
                                                col = mes.createMessageComponentCollector({
                                                    filter,
                                                    time: 35000,
                                                    max: 1
                                                });
                                                col.on("collect", j => {
                                                    if (j.customId == "tsel") {
                                                        menu.data.fields[1].value = `${j.values[0]} Armor`;
                                                        armor.type = j.values[0];
                                                        col.stop();
                                                    }
                                                });
                                                col.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Selection timed out...",
                                                            components: []
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                                break;
                                            case "rarity":
                                                const rsel = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder()
                                                        .setCustomId("rsel")
                                                        .setMaxValues(1)
                                                        .setPlaceholder("No Rarity selected...")
                                                        .setOptions(
                                                            {
                                                                label: "Common",
                                                                value: "Common"
                                                            },
                                                            {
                                                                label: "Uncommon",
                                                                value: "Uncommon"
                                                            },
                                                            {
                                                                label: "Rare",
                                                                value: "Rare"
                                                            },
                                                            {
                                                                label: "Very Rare",
                                                                value: "Very Rare"
                                                            },
                                                            {
                                                                label: "Legendary",
                                                                value: "Legendary"
                                                            }
                                                        )
                                                    );
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Select a Rarity:",
                                                    components: [rsel]
                                                });
                                                col = mes.createMessageComponentCollector({
                                                    filter,
                                                    time: 35000,
                                                    max: 1
                                                });
                                                col.on("collect", j => {
                                                    menu.data.fields[2].value = j.values[0];
                                                    armor.rarity = j.values[0];
                                                    col.stop();
                                                });
                                                col.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Selection timed out...",
                                                            components: []
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "attune":
                                                const asel = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder()
                                                            .setCustomId("asel")
                                                            .setMaxValues(1)
                                                            .setPlaceholder("No Option selected...")
                                                            .setOptions(
                                                                {
                                                                    label: "True",
                                                                    value: "true"
                                                                },
                                                                {
                                                                    label: "False",
                                                                    value: "false"
                                                                }
                                                            )
                                                    );
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Select an Option:",
                                                    components: [asel]
                                                });
                                                col = mes.createMessageComponentCollector({
                                                    filter,
                                                    time: 35000,
                                                    max: 1
                                                });
                                                col.on("collect", j => {
                                                    if (j.customId == "asel") {
                                                        menu.data.fields[3].value = j.values[0];
                                                        armor.description = "_Requires Attunement_\n\n" + armor.description;
                                                        menu.data.fields[9].value = armor.description;
                                                        armor.attune = Boolean(j.values[0]);
                                                        row3.addComponents(
                                                            new ButtonBuilder()
                                                                .setCustomId("attreq")
                                                                .setLabel("Set Attune Requirement")
                                                                .setStyle(ButtonStyle.Primary)
                                                                .setEmoji("📝")
                                                        );
                                                        col.stop();
                                                    }
                                                });
                                                col.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Selection timed out...",
                                                            components: []
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "magical":
                                                const msel = new ActionRowBuilder()
                                                    .addComponents(
                                                        new StringSelectMenuBuilder()
                                                            .setCustomId("msel")
                                                            .setMaxValues(1)
                                                            .setPlaceholder("No Option selected...")
                                                            .setOptions(
                                                                {
                                                                    label: "True",
                                                                    value: "true"
                                                                },
                                                                {
                                                                    label: "False",
                                                                    value: "false"
                                                                }
                                                            )
                                                    );
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Select an Option:",
                                                    components: [msel]
                                                });
                                                col = mes.createMessageComponentCollector({
                                                    filter,
                                                    time: 35000,
                                                    max: 1
                                                });
                                                col.on("collect", j => {
                                                    if (j.customId == "msel") {
                                                        menu.data.fields[4].value = j.values[0];
                                                        armor.magical = Boolean(j.values[0]);
                                                        row3.addComponents(
                                                            new ButtonBuilder()
                                                                .setCustomId("mb")
                                                                .setLabel("Set Magic Bonus")
                                                                .setStyle(ButtonStyle.Primary)
                                                                .setEmoji("✨")
                                                        );
                                                        if (j.values[0] == "true") {
                                                            menu.setFields(
                                                                {
                                                                    name: "Name",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Type",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Rarity",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Requires Attunement?",
                                                                    value: `${armor.attune}`,
                                                                    inline: true
                                                                },
                                                                {
                                                                    name: "Magical",
                                                                    value: `${armor.magical}`,
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Magic Bonus",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "AC",
                                                                    value: `${armor.ac}`,
                                                                    inline: true
                                                                },
                                                                {
                                                                    name: "Dex Bonus",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Strength Requirement",
                                                                    value: "\ ",
                                                                    inline: true,
                                                                },
                                                                {
                                                                    name: "Description",
                                                                    value: "\ ",
                                                                    inline: false
                                                                }
                                                            );
                                                        }
                                                        col.stop();
                                                    }
                                                });
                                                col.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Selection timed out...",
                                                            components: []
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "ac":
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Reply with a Number!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    if (!Number(j.content)) {
                                                        let mesag = await j.deferReply();
                                                        await mesag.edit({
                                                            content: "Please provide a valid Number!"
                                                        });
                                                        setTimeout(async () => {
                                                            await mesag.delete();
                                                        }, 5000);
                                                    } else if (Number(j.content)) {
                                                        armor.ac = Number(j.content);
                                                        menu.data.fields[6].value = String(armor.ac);
                                                        mescol.stop();
                                                    }
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "dex":
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Reply with a Number!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    if (!Number(j.content)) {
                                                        let mesag = await j.deferReply();
                                                        await mesag.edit({
                                                            content: "Please provide a valid Number!"
                                                        });
                                                        setTimeout(async () => {
                                                            await mesag.delete();
                                                        }, 5000);
                                                    } else if (Number(j.content)) {
                                                        armor.dex_bonus = Number(j.content);
                                                        menu.data.fields[7].value = String(armor.dex_bonus);
                                                        mescol.stop();
                                                    }
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "str":
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Reply with a Number!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    if (!Number(j.content)) {
                                                        let mesag = await j.deferReply();
                                                        await mesag.edit({
                                                            content: "Please provide a valid Number!"
                                                        });
                                                        setTimeout(async () => {
                                                            await mesag.delete();
                                                        }, 5000);
                                                    } else if (Number(j.content)) {
                                                        armor.str_req = Number(j.content);
                                                        menu.data.fields[8].value = String(armor.str_req);
                                                        mescol.stop();
                                                    }
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "desc":
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Reply with the Description!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    if (armor.attune) {
                                                        if (armor.attune_req) {
                                                            armor.description = `_Requires Attunement by (a) ${armor.attune_req}_\n\n` + j.content;
                                                        } else {
                                                            armor.description = "_Requires Attunement_\n\n" + j.content;
                                                        }
                                                    } else {
                                                        armor.description = j.content;
                                                    }
                                                    menu.data.fields[9].value = String(armor.description);
                                                    mescol.stop();
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "attreq":
                                                mes = await i.deferReply();
                                                await mes.edit({
                                                    content: "Reply with the Attunement Requirement!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    armor.attune_req = j.content;
                                                    armor.description = `_Requires Attunement by (a) ${armor.attune_req}_\n\n` + armor.description;
                                                    menu.data.fields[9].value = String(armor.description);
                                                    mescol.stop();
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "mb":
                                                mes = await i.deferReply();
                                                    await mes.edit({
                                                    content: "Reply with a Number!"
                                                });
                                                filt = m => m.reference.messageId == mes.id && m.author.id == user.id;
                                                mescol = i.channel.createMessageCollector({
                                                    filt,
                                                    time: 35000
                                                });
                                                mescol.on("collect", async (j) => {
                                                    if (!Number(j.content)) {
                                                        let mesag = await j.deferReply();
                                                        await mesag.edit({
                                                            content: "Please provide a valid Number!"
                                                        });
                                                        setTimeout(async () => {
                                                            await mesag.delete();
                                                        }, 5000);
                                                    } else if (Number(j.content)) {
                                                        armor.magic_bonus = Number(j.content);
                                                        menu.data.fields[5].value = "+" + String(armor.magic_bonus);
                                                        mescol.stop();
                                                    }
                                                });
                                                mescol.on("end", async (collected) => {
                                                    if (collected.size === 0) {
                                                        await mes.edit({
                                                            content: "Reply collection timed out..."
                                                        });
                                                    } else {
                                                        client.database.writeLog(server, `Collected ${collected.size} Interactions`)
                                                            .then(msg1 => client.database.writeDevLog(msg1))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        if (armor.magical || armor.attune) {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row3, row4],
                                                                ephemeral: true
                                                            });
                                                        } else {
                                                            await msg.edit({
                                                                embeds: [menu],
                                                                components: [row1, row2, row4],
                                                                ephemeral: true
                                                            });
                                                        }
                                                    }
                                                    setTimeout(async () => {
                                                        await mes.delete();
                                                    }, 5000);
                                                });
                                            break;
                                            case "finish":
                                                mes = await i.deferReply();
                                                client.database.addArmor(server, armor)
                                                    .then(async (msg1) => {
                                                        client.database.writeLog(server, msg1)
                                                            .then(msg2 => client.database.writeDevLog(msg2))
                                                            .catch(err => client.database.writeDevLog(`${err}`));
                                                        await mes.edit({
                                                            content: "Armor has been added!",
                                                            ephemeral: true
                                                        });
                                                    })
                                                    .catch(async (err) => {
                                                        client.database.writeLog(server, `${err}`)
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                if (String(err).includes("Error 409")) {
                                                                    await mes.edit({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor("Red")
                                                                                .setTitle(`${err}`)
                                                                                .setDescription("An Armor with that Name already exists in the Database!")
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
                                                collector.stop();
                                            break;
                                            case "cancel":
                                                await i.deferUpdate();
                                                collector.stop();
                                            break;
                                        }
                                    });
                                    collector.on("end", async (collected) => {
                                        if (collected.size === 0) {
                                            await msg.edit({
                                                content: "Selection timed out...",
                                                embeds: [],
                                                components: [],
                                                ephemeral: false
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
                                break;
                                case "remove":
                                    const rows = [];
                                    const selrow = new ActionRowBuilder()
                                        .addComponents(
                                            new StringSelectMenuBuilder()
                                                .setCustomId("armsel")
                                                .setMaxValues(1)
                                                .setPlaceholder("No Armor selected...")
                                        );
                                    rows.push(selrow);
                                    let num = 0;
                                    const prow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId("prev")
                                                .setEmoji("⏪")
                                                .setStyle(ButtonStyle.Secondary)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId("next")
                                                .setEmoji("⏩")
                                                .setStyle(ButtonStyle.Secondary),
                                            new ButtonBuilder()
                                                .setCustomId("cancel")
                                                .setLabel("Cancel")
                                                .setStyle(ButtonStyle.Danger)
                                        );
                                    client.database.getArmor(server)
                                        .then(async (armors) => {
                                            let count = 0;
                                            for (const armor of armors) {
                                                if (count == 24) {
                                                    rows.push(selrow);
                                                    num++;
                                                    count = 0;
                                                }
                                                rows[num].components[0].addOptions({
                                                    label: armor.name,
                                                    value: `${armor.id}`
                                                });
                                                count++;
                                            }
                                            let page = 0;
                                            if (rows.length < 2) {
                                                prow.components[1].setDisabled(true);
                                            }
                                            msg = await interaction.reply({
                                                content: "Select an Armor:",
                                                components: [rows[page], prow],
                                                ephemeral: true
                                            });
                                            collector = msg.createMessageComponentCollector({
                                                filter,
                                                time: 90000
                                            });
                                            collector.on("collect", async (i) => {
                                                if (i.customId == "armsel") {
                                                    let id = Number(i.values[0]);
                                                    const mes = await i.deferReply();
                                                    client.database.remArmor(server, { id: id })
                                                        .then(async (msg1) => {
                                                            client.database.writeLog(server, msg1)
                                                                .then(msg2 => client.database.writeDevLog(msg2))
                                                                .catch(err => client.database.writeDevLog(`${err}`));
                                                            await mes.edit({
                                                                content: "Armor has been removed!",
                                                                ephemeral: true
                                                            });
                                                        })
                                                        .catch(async (err) => {
                                                            client.database.writeLog(server, `${err}`)
                                                                .then(async (msg1) => {
                                                                    client.database.writeDevLog(msg1);
                                                                    if (String(err).includes("Error 404")) {
                                                                        await mes.edit({
                                                                            embeds: [
                                                                                new EmbedBuilder()
                                                                                    .setColor("Red")
                                                                                    .setTitle(`${err}`)
                                                                                    .setDescription("Could not find that Armor in the Database. Contact the Developer if this Issue persists.")
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
                                                    collector.stop();
                                                } else if (i.customId == "prev") {
                                                    await i.deferUpdate();
                                                    if (page > 0) {
                                                        page--;
                                                        if (page == 0) {
                                                            prow.components[0].setDisabled(true);
                                                            prow.components[1].setDisabled(false);
                                                        } else {
                                                            prow.components[0].setDisabled(false);
                                                            prow.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select an Armor:",
                                                            components: [rows[page], prow],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId == "next") {
                                                    await i.deferUpdate();
                                                    if (page < rows.length - 1) {
                                                        page++;
                                                        if (page == rows.length - 1) {
                                                            prow.components[0].setDisabled(false);
                                                            prow.components[1].setDisabled(true);
                                                        } else {
                                                            prow.components[0].setDisabled(false);
                                                            prow.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select an Armor:",
                                                            components: [rows[page], prow],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId == "cancel") {
                                                    await i.deferUpdate();
                                                    collector.stop();
                                                }
                                            });
                                            collector.on("end", async (collected) => {
                                                if (collected.size == 0) {
                                                    await msg.edit({
                                                        content: "Selection timed out...",
                                                        components: [],
                                                        ephemeral: false
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
                                                                    .setDescription("Could not find any Armor in the Database. Make sure to add some Armor before you try again.")
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
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "class":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "condition":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "dmgtype":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "feat":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "race":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "subclass":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                        case "subrace":
                            switch (option.getSubcommandGroup()) {
                                case "add":
                                    //TODO
                                break;
                                case "remove":
                                    //TODO
                                break;
                                case "edit":
                                    //TODO
                                break;
                            }
                        return;
                    }
                }
            })
            .catch(async (err) => {
                client.database.writeLog(server, `${err}`)
                    .then(async (msg) => {
                        client.database.writeDevLog(msg);
                        if (String(err).includes("Error 404")) {
                            await interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`${err}`)
                                        .setDescription("Could not find the Server in the Database. Contact the Developer if this Issue persists.")
                                        .setTimestamp()
                                ],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle(`An Error occurred...`)
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