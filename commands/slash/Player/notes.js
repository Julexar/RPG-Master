import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder } from 'discord.js';
class Command {
    constructor() {
        this.name = 'notes';
        this.description = 'Note related Commands';
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.SendMessages];
        this.options = [
            {
                name: 'view',
                description: 'Shows a List of your Notes',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'server',
                        description: 'Shows server specific Notes',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'private',
                                description: 'When true, shows private Notes',
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                            {
                                name: 'id',
                                description: 'Provide the ID of a Note',
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                    {
                        name: 'global',
                        description: 'Shows global Notes',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'private',
                                description: 'When true, shows private Notes',
                                type: ApplicationCommandOptionType.Boolean,
                                required: true,
                            },
                            {
                                name: 'id',
                                description: 'Provide the ID of a Note',
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                ],
            },
            {
                name: 'add',
                description: 'Adds a Note',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'server',
                        description: 'Adds a server specific Note',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'global',
                        description: 'Adds a global Note',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
            {
                name: 'remove',
                description: 'Removes a Note',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'server',
                        description: 'Removes a server specific Note',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'id',
                                description: 'Provide the ID of the Note',
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                    {
                        name: 'global',
                        description: 'Removes a global Note',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'id',
                                description: 'Provide the ID of the Note',
                                type: ApplicationCommandOptionType.Number,
                                required: false,
                                minValue: 1,
                            },
                        ],
                    },
                ],
            },
            {
                name: 'edit',
                description: 'Edits a Note',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'server',
                        description: 'Edits a server specific Note',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'id',
                                description: 'Provide the ID of the Note',
                                type: ApplicationCommandOptionType.Number,
                                required: true,
                                minValue: 1,
                            },
                        ],
                    },
                    {
                        name: 'global',
                        description: 'Edits a global Note',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'id',
                                description: 'Provide the ID of the Note',
                                type: ApplicationCommandOptionType.Number,
                                required: true,
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
        const noteId = option.getNumber('id');
        switch (option.getSubcommandGroup()) {
            case 'view':
                switch (option.getSubcommand()) {
                    case 'server':
                        this.viewNote(client, interaction, 'server', member, noteId);
                        return;
                    case 'global':
                        this.viewNote(client, interaction, 'global', member, noteId);
                        return;
                }
                return;
            case 'add':
                switch (option.getSubcommand()) {
                    case 'server':
                        this.noteCreator(client, interaction, 'server', member);
                        return;
                    case 'global':
                        this.noteCreator(client, interaction, 'global', member);
                        return;
                }
                return;
            case 'remove':
                switch (option.getSubcommand()) {
                    case 'server':
                        this.noteRemover(client, interaction, 'server', member, noteId);
                        return;
                    case 'global':
                        this.noteRemover(client, interaction, 'global', member, noteId);
                        return;
                }
                return;
            case 'edit':
                switch (option.getSubcommand()) {
                    case 'server':
                        this.noteEditor(client, interaction, 'server', member, noteId);
                        return;
                    case 'global':
                        this.noteEditor(client, interaction, 'global', member, noteId);
                        return;
                }
                return;
        }
    }

    viewNote(client, interaction, type, member, noteId) {
        const filter = (m) => m.user.id == member.user.id;
        const menu = new EmbedBuilder().setColor('Yellow').setAuthor({ name: member.user.username, iconURL: member.user.avatarURL() });
        if (!noteId) {
            if (type == 'server') {
                menu.setTitle('Server Notes List');
                const menus = [];
                menus.push(menu);
                client.database
                    .getServerNote(member.guild, member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        const priv = option.getBoolean('private');
                        if (priv) {
                            for (const note of notes) {
                                if (count == 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }
                                if (note.private) {
                                    if (note.title) {
                                        menus[num].addFields({
                                            name: `${note.title} (#${note.id})`,
                                            value: note.content,
                                        });
                                    } else {
                                        menus[num].addFields({
                                            name: `Note #${note.id}`,
                                            value: note.content,
                                        });
                                    }
                                }
                            }
                        } else {
                            for (const note of notes) {
                                if (count == 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }
                                if (note.title) {
                                    menus[num].addFields({
                                        name: `${note.title} (#${note.id})`,
                                        value: note.content,
                                    });
                                } else {
                                    menus[num].addFields({
                                        name: `Note #${note.id}`,
                                        value: note.content,
                                    });
                                }
                            }
                        }
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                        );
                        let page = 0;
                        const msg = await interaction.reply({
                            embeds: [menus[page]],
                            components: [row],
                            ephemeral: priv,
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });
                        collector.on('collect', async (i) => {
                            await i.deferUpdate();
                            if (i.customId == 'prev') {
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row.components[0].setDisabled(true);
                                        row.components[1].setDisabled(false);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv,
                                    });
                                }
                            } else if (i.customId == 'next') {
                                if (page < menus.length - 1) {
                                    page++;
                                    if (page == menus.length - 1) {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(true);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv,
                                    });
                                }
                            }
                        });
                        collector.on('end', async (collected) => {
                            if (collected.size === 0) {
                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true);
                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: priv,
                                });
                            } else {
                                client.database
                                    .writeLog(member.guild, `Collected ${collected.size} Interactions`)
                                    .then((mes) => client.database.writeDevLog(`${mes}`))
                                    .catch((err) => client.database.writeDevLog(`${err}`));
                            }
                        });
                    })
                    .catch((err) => {
                        client.database
                            .writeLog(member.guild, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(`${msg}`);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find any Server Notes in the Database!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
            } else if (type == 'global') {
                menu.setTitle('Global Notes List');
                const menus = [];
                menus.push(menu);
                client.database
                    .getGlobalNote(member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        const priv = option.getBoolean('private');
                        if (priv) {
                            for (const note of notes) {
                                if (count == 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }
                                if (note.private) {
                                    if (note.title) {
                                        menus[num].addFields({
                                            name: `${note.title} (#${note.id})`,
                                            value: note.content,
                                        });
                                    } else {
                                        menus[num].addFields({
                                            name: `Note #${note.id}`,
                                            value: note.content,
                                        });
                                    }
                                }
                            }
                        } else {
                            for (const note of notes) {
                                if (count == 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }
                                if (note.title) {
                                    menus[num].addFields({
                                        name: `${note.title} (#${note.id})`,
                                        value: note.content,
                                    });
                                } else {
                                    menus[num].addFields({
                                        name: `Note #${note.id}`,
                                        value: note.content,
                                    });
                                }
                            }
                        }
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                        );
                        let page = 0;
                        const msg = await interaction.reply({
                            embeds: [menus[page]],
                            components: [row],
                            ephemeral: priv,
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });
                        collector.on('collect', async (i) => {
                            await i.deferUpdate();
                            if (i.customId == 'prev') {
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row.components[0].setDisabled(true);
                                        row.components[1].setDisabled(false);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv,
                                    });
                                }
                            } else if (i.customId == 'next') {
                                if (page < menus.length - 1) {
                                    page++;
                                    if (page == menus.length - 1) {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(true);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row],
                                        emphemeral: priv,
                                    });
                                }
                            }
                        });
                        collector.on('end', async (collected) => {
                            if (collected.size === 0) {
                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true);
                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: priv,
                                });
                            } else {
                                client.database
                                    .writeLog(member.guild, `Collected ${collected.size} Interactions`)
                                    .then((mes) => client.database.writeDevLog(`${mes}`))
                                    .catch((err) => client.database.writeDevLog(`${err}`));
                            }
                        });
                    })
                    .catch((err) => {
                        client.database
                            .writeLog(member.guild, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(`${msg}`);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find any Global Notes in the Database!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
            }
        } else {
            if (type == 'server') {
                client.database
                    .getServerNote(member.guild, member.user, { id: noteId })
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
                                ephemeral: true,
                            });
                        } else {
                            await interaction.reply({
                                embeds: [menu],
                            });
                        }
                    })
                    .catch((err) => {
                        client.database
                            .writeLog(member.guild, `${err}`)
                            .then(async (mes) => {
                                client.database.writeDevLog(`${mes}`);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
            } else if (type == 'global') {
                client.database
                    .getGlobalNote(member.user, { id: noteId })
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
                                ephemeral: true,
                            });
                        } else {
                            await interaction.reply({
                                embeds: [menu],
                            });
                        }
                    })
                    .catch((err) => {
                        client.database
                            .writeLog(member.guild, `${err}`)
                            .then(async (mes) => {
                                client.database.writeDevLog(`${mes}`);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
            }
        }
    }

    async noteCreator(client, interaction, type, member) {
        const filter = (m) => m.user.id == member.user.id;
        const menu = new EmbedBuilder().setColor('Yellow').setTitle('Note Creator').setAuthor({ name: member.user.username, iconURL: member.user.avatarURL() }).setFields(
            {
                name: 'Title',
                value: ' ',
                inline: true,
            },
            {
                name: 'Private?',
                value: 'false',
                inline: true,
            },
            {
                name: 'Content',
                value: ' ',
            }
        );
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('title').setLabel('Change Title').setStyle(ButtonStyle.Primary).setEmoji('🔤'),
            new ButtonBuilder().setCustomId('content').setLabel('Change Content').setStyle(ButtonStyle.Primary).setEmoji('📝'),
            new ButtonBuilder().setCustomId('priv').setLabel('Toggle Private').setStyle(ButtonStyle.Primary).setEmoji('🔁')
        );
        const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('finish').setLabel('Finish').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger));
        const msg = await interaction.reply({
            embeds: [menu],
            components: [row1, row2],
            ephemeral: Boolean(menu.data.fields[1].value),
        });
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 90000,
        });
        collector.on('collect', async (i) => {
            if (i.customId == 'title') {
                const mes = await i.deferReply();
                await mes.edit({
                    content: 'Reply with a new Title.',
                });
                const mesfil = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                const mescol = i.channel.createMessageCollector({
                    mesfil,
                    time: 35000,
                    max: 1,
                });
                mescol.on('collect', (j) => {
                    menu.data.fields[0].value = j.content;
                });
                mescol.on('end', async (collected) => {
                    if (collected.size === 0) {
                        await mes.edit({
                            content: 'Reply collection timed out...',
                        });
                    } else {
                        client.database
                            .writeLog(member.guild, `Collected ${collected.size} Replies`)
                            .then(async (mes1) => {
                                client.database.writeDevLog(`${mes1}`);
                                await msg.edit({
                                    embeds: [menu],
                                    components: [row1, row2],
                                    ephemeral: Boolean(menu.data.fields[1].value),
                                });
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            })
                            .catch((err) => client.database.writeDevLog(`${err}`));
                    }
                });
            } else if (i.customId == 'content') {
                const mes = await i.deferReply();
                await mes.edit({
                    content: 'Reply with the Content of the Note!',
                });
                const mesfil = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                const mescol = i.channel.createMessageCollector({
                    mesfil,
                    time: 35000,
                    max: 1,
                });
                mescol.on('collect', (j) => {
                    menu.data.fields[2].value = j.content;
                });
                mescol.on('end', async (collected) => {
                    if (collected.size === 0) {
                        await mes.edit({
                            content: 'Reply collection timed out...',
                        });
                    } else {
                        client.database
                            .writeLog(member.guild, `Collected ${collected.size} Replies`)
                            .then(async (mes1) => {
                                client.database.writeDevLog(`${mes1}`);
                                await msg.edit({
                                    embeds: [menu],
                                    components: [row1, row2],
                                    ephemeral: Boolean(menu.data.fields[1].value),
                                });
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            })
                            .catch((err) => client.database.writeDevLog(`${err}`));
                    }
                });
            } else if (i.customId == 'priv') {
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
                    ephemeral: bool,
                });
            } else if (i.customId == 'finish') {
                const note = {
                    title: menu.data.fields[0].value,
                    content: menu.data.fields[2].value,
                    private: Boolean(menu.data.fields[1].value),
                };
                const m = i.deferReply();
                if (type == 'server') {
                    client.database
                        .addServerNote(member.guild, member.user, note)
                        .then((mes) => {
                            client.database
                                .writeLog(member.guild, `${mes}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    await m.edit({
                                        content: 'Note has been created successfully!',
                                    });
                                })
                                .catch((err) => client.database.writeDevLog(`${err}`));
                        })
                        .catch((err) => {
                            client.database
                                .writeLog(member.guild, `${err}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    if (String(err).includes('Error 409')) {
                                        await m.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('A Note with this Content/Title already exists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await m.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                })
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                        });
                } else if (type == 'global') {
                    client.database
                        .addGlobalNote(member.user, note)
                        .then((mes) => {
                            client.database
                                .writeLog(member.guild, `${mes}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    await m.edit({
                                        content: 'Note has been created successfully!',
                                    });
                                })
                                .catch((err) => client.database.writeDevLog(`${err}`));
                        })
                        .catch((err) => {
                            client.database
                                .writeLog(member.guild, `${err}`)
                                .then(async (mes1) => {
                                    client.database.writeDevLog(`${mes1}`);
                                    if (String(err).includes('Error 409')) {
                                        await m.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('A Note with this Content/Title already exists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await m.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                })
                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                        });
                }
            } else if (i.customId == 'cancel') {
                const mes = await i.deferReply();
                await mes.edit({
                    content: 'Note Creation has been cancelled...',
                    ephemeral: true,
                });
                collector.stop();
            }
        });
        collector.on('end', async (collected) => {
            if (collected.size > 0) {
                client.database
                    .writeLog(member.guild, `Collected ${collected.size} Interactions`)
                    .then((mes) => client.database.writeDevLog(`${mes}`))
                    .catch((err) => client.database.writeDevLog(`${err}`));
            }
            await msg.edit({
                embeds: [menu],
                components: [],
                ephemeral: Boolean(menu.data.fields[1].value),
            });
        });
    }

    async noteRemover(client, interaction, type, member, noteId) {
        const filter = (m) => m.user.id == member.user.id;
        if (!noteId) {
            const rows = [];
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('selnote').setMinValues(1).setMaxValues(1).setPlaceholder('No Note selected...'));
            rows.push(row);
            if (type == 'server') {
                client.database
                    .getServerNote(interaction.guild, member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        for (const note of notes) {
                            if (count == 24) {
                                rows.push(row);
                                count = 0;
                                num++;
                            }
                            if (note.title) {
                                rows[num].components[0].addOptions({
                                    label: `${note.title} (#${note.id})`,
                                    value: `${note.id}`,
                                });
                            } else {
                                rows[num].components[0].addOptions({
                                    label: `Note #${note.id}`,
                                    value: `${note.id}`,
                                });
                            }
                            count++;
                        }
                        const row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        );
                        let page = 0;
                        const msg = await interaction.reply({
                            content: 'Select a Note:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });
                        collector.on('collect', async (i) => {
                            if (i.customId == 'selnote') {
                                const mes = await i.deferReply();
                                client.database
                                    .getServerNote(interaction.guild, member.user, {
                                        id: Number(i.values[0]),
                                    })
                                    .then(async (note) => {
                                        const embed = new EmbedBuilder()
                                            .setColor('Yellow')
                                            .setDescription(note.content)
                                            .setAuthor({
                                                name: member.user.displayName,
                                                iconURL: member.user.avatarURL(),
                                            })
                                            .setTimestamp();
                                        if (note.title) {
                                            embed.setTitle(`${note.title} (#${note.id})`);
                                        } else {
                                            embed.setTitle(`Note #${note.id}`);
                                        }
                                        const row3 = new ActionRowBuilder().addComponents(
                                            new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                                            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                                        );
                                        await mes.edit({
                                            content: 'Are you sure you want to delete the following Note?',
                                            embeds: [embed],
                                            components: [row3],
                                            ephemeral: true,
                                        });
                                        const col = mes.createMessageComponentCollector({
                                            filter,
                                            time: 35000,
                                            max: 1,
                                        });
                                        col.on('collect', async (j) => {
                                            const messag = await j.deferReply();
                                            if (j.customId == 'confirm') {
                                                await client.database
                                                    .remServerNote(interaction.guild, member.user, {
                                                        id: note.id,
                                                    })
                                                    .then(async (m) => {
                                                        await client.database
                                                            .writeLog(interaction.guild, m)
                                                            .then((message) => client.database.writeDevLog(message))
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                        await messag.edit({
                                                            content: 'Note has been successfully deleted!',
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch(async (err) => {
                                                        await client.database
                                                            .writeLog(interaction.guild, `${err}`)
                                                            .then((m) => client.database.writeDevLog(m))
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                        if (String(err).includes('Error 404')) {
                                                            await messag.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        } else {
                                                            await messag.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        }
                                                    });
                                            } else if (j.customId == 'cancel') {
                                                await messag.edit({
                                                    content: 'Removal of Note has been cancelled.',
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async () => {
                                                await messag.delete();
                                            }, 5000);
                                        });
                                        col.on('end', async (collected) => {
                                            if (collected.size == 0) {
                                                await mes.edit({
                                                    content: 'Selection timed out...',
                                                    embeds: [],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(interaction.guild, `Collected ${collected.size} Interactions`)
                                                    .then((m) => client.database.writeDevLog(m))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                            }
                                            setTimeout(async () => {
                                                await mes.delete();
                                            }, 5000);
                                        });
                                    })
                                    .catch(async (err) => {
                                        await client.database
                                            .writeLog(interaction.guild, `${err}`)
                                            .then((m) => client.database.writeDevLog(m))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        if (String(err).includes('Error 404')) {
                                            await mes.edit({
                                                content: '',
                                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        } else {
                                            await mes.edit({
                                                content: '',
                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        }
                                    });
                            } else if (i.customId == 'prev') {
                                await i.deferUpdate();
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row2.components[0].setDisabled(true);
                                        row2.components[1].setDisabled(false);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: 'Select a Note:',
                                        components: [rows[page], row2],
                                        ephemeral: true,
                                    });
                                }
                            } else if (i.customId == 'next') {
                                await i.deferUpdate();
                                if (page < rows.length - 1) {
                                    page++;
                                    if (page == rows.length - 1) {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(true);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: 'Select a Note:',
                                        compoennts: [rows[page], row2],
                                        ephemeral: true,
                                    });
                                }
                            } else if (i.customId == 'cancel') {
                                await i.deferUpdate();
                                collector.stop();
                            }
                        });
                        collector.on('end', async (collected) => {
                            if (collected.size == 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    compoennts: [],
                                    ephemeral: true,
                                });
                            } else {
                                await client.database
                                    .writeLog(interaction.guild, `Collected ${collected.size} Interactions`)
                                    .then((m) => client.database.writeDevLog(m))
                                    .catch((err) => client.database.writeDevLog(`${err}`));
                            }
                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    })
                    .catch(async (err) => {
                        await client.database
                            .writeLog(interaction.guild, `${err}`)
                            .then((m) => client.database.writeDevLog(m))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        if (String(err).includes('Error 404')) {
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('This Character does not have any Notes!').setTimestamp()],
                                ephemeral: true,
                            });
                        } else {
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                ephemeral: true,
                            });
                        }
                    });
            } else if (type == 'global') {
                client.database
                    .getGlobalNote(member.user)
                    .then(async (notes) => {
                        let count = 0;
                        let num = 0;
                        for (const note of notes) {
                            if (count == 24) {
                                rows.push(row);
                                count = 0;
                                num++;
                            }
                            if (note.title) {
                                rows[num].components[0].addOptions({
                                    label: `${note.title} (#${note.id})`,
                                    value: `${note.id}`,
                                });
                            } else {
                                rows[num].components[0].addOptions({
                                    label: `Note #${note.id}`,
                                    value: `${note.id}`,
                                });
                            }
                            count++;
                        }
                        const row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        );
                        let page = 0;
                        const msg = await interaction.reply({
                            content: 'Select a Note:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });
                        collector.on('collect', async (i) => {
                            if (i.customId == 'selnote') {
                                const mes = await i.deferReply();
                                client.database
                                    .getGlobalNote(member.user, { id: Number(i.values[0]) })
                                    .then(async (note) => {
                                        const embed = new EmbedBuilder()
                                            .setColor('Yellow')
                                            .setDescription(note.content)
                                            .setAuthor({
                                                name: member.user.displayName,
                                                iconURL: member.user.avatarURL(),
                                            })
                                            .setTimestamp();
                                        if (note.title) {
                                            embed.setTitle(`${note.title} (#${note.id})`);
                                        } else {
                                            embed.setTitle(`Note #${note.id}`);
                                        }
                                        const row3 = new ActionRowBuilder().addComponents(
                                            new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                                            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                                        );
                                        await mes.edit({
                                            content: 'Are you sure you want to delete the following Note?',
                                            embeds: [embed],
                                            components: [row3],
                                            ephemeral: true,
                                        });
                                        const col = mes.createMessageComponentCollector({
                                            filter,
                                            time: 35000,
                                            max: 1,
                                        });
                                        col.on('collect', async (j) => {
                                            const messag = await j.deferReply();
                                            if (j.customId == 'confirm') {
                                                await client.database
                                                    .remGlobalNote(member.user, { id: note.id })
                                                    .then(async (m) => {
                                                        await client.database
                                                            .writeLog(interaction.guild, m)
                                                            .then((message) => client.database.writeDevLog(message))
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                        await messag.edit({
                                                            content: 'Note has been successfully deleted!',
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch(async (err) => {
                                                        await client.database
                                                            .writeLog(interaction.guild, `${err}`)
                                                            .then((m) => client.database.writeDevLog(m))
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                        if (String(err).includes('Error 404')) {
                                                            await messag.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        } else {
                                                            await messag.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        }
                                                    });
                                            } else if (j.customId == 'cancel') {
                                                await messag.edit({
                                                    content: 'Removal of Note has been cancelled.',
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async () => {
                                                await messag.delete();
                                            }, 5000);
                                        });
                                        col.on('end', async (collected) => {
                                            if (collected.size == 0) {
                                                await mes.edit({
                                                    content: 'Selection timed out...',
                                                    embeds: [],
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(interaction.guild, `Collected ${collected.size} Interactions`)
                                                    .then((m) => client.database.writeDevLog(m))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                            }
                                            setTimeout(async () => {
                                                await mes.delete();
                                            }, 5000);
                                        });
                                    })
                                    .catch(async (err) => {
                                        await client.database
                                            .writeLog(interaction.guild, `${err}`)
                                            .then((m) => client.database.writeDevLog(m))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        if (String(err).includes('Error 404')) {
                                            await mes.edit({
                                                content: '',
                                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        } else {
                                            await mes.edit({
                                                content: '',
                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        }
                                    });
                            } else if (i.customId == 'prev') {
                                await i.deferUpdate();
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row2.components[0].setDisabled(true);
                                        row2.components[1].setDisabled(false);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: 'Select a Note:',
                                        components: [rows[page], row2],
                                        ephemeral: true,
                                    });
                                }
                            } else if (i.customId == 'next') {
                                await i.deferUpdate();
                                if (page < rows.length - 1) {
                                    page++;
                                    if (page == rows.length - 1) {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(true);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: 'Select a Note:',
                                        compoennts: [rows[page], row2],
                                        ephemeral: true,
                                    });
                                }
                            } else if (i.customId == 'cancel') {
                                await i.deferUpdate();
                                collector.stop();
                            }
                        });
                        collector.on('end', async (collected) => {
                            if (collected.size == 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    compoennts: [],
                                    ephemeral: true,
                                });
                            } else {
                                await client.database
                                    .writeLog(interaction.guild, `Collected ${collected.size} Interactions`)
                                    .then((m) => client.database.writeDevLog(m))
                                    .catch((err) => client.database.writeDevLog(`${err}`));
                            }
                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    })
                    .catch(async (err) => {
                        await client.database
                            .writeLog(interaction.guild, `${err}`)
                            .then((m) => client.database.writeDevLog(m))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        if (String(err).includes('Error 404')) {
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('This Character does not have any Notes!').setTimestamp()],
                                ephemeral: true,
                            });
                        } else {
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                ephemeral: true,
                            });
                        }
                    });
            }
        } else {
            let note;
            if (type == 'server') {
                note = await client.database.getServerNote(interaction.guild, member.user, { id: noteId }).catch(async (err) => {
                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                    if (String(err).includes('Error 404')) {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                            ephemeral: true,
                        });
                    }
                });
                if (note) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                        new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                    );
                    const embed = new EmbedBuilder().setColor('Yellow').setAuthor({ name: member.user.displayName, iconURL: member.user.avatarURL() }).setDescription(note.content).setTimestamp();
                    if (note.title) {
                        embed.setTitle(`${note.title} (#${note.id})`);
                    } else {
                        embed.setTitle(`Note #${note.id}`);
                    }
                    const msg = await interaction.reply({
                        content: 'Are you sure you want to delete the following Note?',
                        embeds: [embed],
                        components: [row],
                        ephemeral: true,
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000,
                        max: 1,
                    });
                    collector.on('collect', async (i) => {
                        const mes = await i.deferReply();
                        if (i.customId == 'confirm') {
                            client.database
                                .remServerNote(interaction.guild, member.user, note)
                                .then(async (m) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, m).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await mes.edit({
                                        content: `${m}`,
                                        ephemeral: true,
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                                    if (String(err).includes('Error 404')) {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                });
                        } else if (i.customId == 'cancel') {
                            await mes.edit({
                                content: 'Removal of Note has been cancelled!',
                                ephemeral: true,
                            });
                            collector.stop();
                        }
                    });
                    collector.on('end', async (collected) => {
                        if (collected.size == 0) {
                            await msg.edit({
                                content: 'Response selection timed out...',
                                embeds: [],
                                compoennts: [],
                                ephemeral: true,
                            });
                        } else {
                            client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                        }
                        setTimeout(async () => {
                            await msg.delete();
                        }, 5000);
                    });
                }
            } else if (type == 'global') {
                note = await client.database.getGlobalNote(member.user, { id: noteId }).catch(async (err) => {
                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                    if (String(err).includes('Error 404')) {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                            ephemeral: true,
                        });
                    }
                });
                if (note) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                        new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                    );
                    const embed = new EmbedBuilder().setColor('Yellow').setAuthor({ name: member.user.displayName, iconURL: member.user.avatarURL() }).setDescription(note.content).setTimestamp();
                    if (note.title) {
                        embed.setTitle(`${note.title} (#${note.id})`);
                    } else {
                        embed.setTitle(`Note #${note.id}`);
                    }
                    const msg = await interaction.reply({
                        content: 'Are you sure you want to delete the following Note?',
                        embeds: [embed],
                        components: [row],
                        ephemeral: true,
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000,
                        max: 1,
                    });
                    collector.on('collect', async (i) => {
                        const mes = await i.deferReply();
                        if (i.customId == 'confirm') {
                            client.database
                                .remGlobalNote(member.user, note)
                                .then(async (m) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, m).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await mes.edit({
                                        content: `${m}`,
                                        ephemeral: true,
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                                    if (String(err).includes('Error 404')) {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Contact the Developer if this Issue persists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                });
                        } else if (i.customId == 'cancel') {
                            await mes.edit({
                                content: 'Removal of Note has been cancelled!',
                                ephemeral: true,
                            });
                            collector.stop();
                        }
                    });
                    collector.on('end', async (collected) => {
                        if (collected.size == 0) {
                            await msg.edit({
                                content: 'Response selection timed out...',
                                embeds: [],
                                compoennts: [],
                                ephemeral: true,
                            });
                        } else {
                            client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                        }
                        setTimeout(async () => {
                            await msg.delete();
                        }, 5000);
                    });
                }
            }
        }
    }

    noteEditor(client, interaction, type, member, noteId) {
        const filter = (m) => m.user.id == member.user.id;
        const menu = new EmbedBuilder()
            .setColor('Yellow')
            .setAuthor({ name: member.user.displayName, iconURL: member.user.avatarURL() })
            .setDescription(' ')
            .setFields(
                {
                    name: 'Title',
                    value: ' ',
                    inline: true,
                },
                {
                    name: 'Private?',
                    value: ' ',
                    inline: true,
                },
                {
                    name: 'Content',
                    value: ' ',
                }
            )
            .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('title').setStyle(ButtonStyle.Primary).setEmoji('🔤').setLabel('Change Title'),
            new ButtonBuilder().setCustomId('content').setStyle(ButtonStyle.Primary).setEmoji('📝').setLabel('Change Content'),
            new ButtonBuilder().setCustomId('priv').setStyle(ButtonStyle.Primary).setEmoji('🎚️').setLabel('Change Visibility')
        );
        const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('finish').setStyle(ButtonStyle.Success).setLabel('Finish'), new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel'));
        if (type == 'server') {
            client.database
                .getServerNote(interaction.guild, member.user, { id: noteId })
                .then(async (note) => {
                    if (note.title) {
                        menu.data.fields[0].value = `${note.title} (#${note.id})`;
                    } else {
                        menu.data.fields[0].value = `Note #${note.id}`;
                    }
                    menu.data.fields[1].value = String(note.private);
                    menu.data.fields[2].value = note.content;
                    const msg = await interaction.reply({
                        embeds: [menu],
                        components: [row, row2],
                        ephemeral: note.private,
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000,
                    });
                    collector.on('collect', async (i) => {
                        let filt;
                        if (i.customId == 'title') {
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Reply with a new Title!',
                            });
                            filt = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                            const mescol = i.channel.createMessageCollector({
                                filt,
                                time: 35000,
                                max: 1,
                            });
                            mescol.on('collect', (j) => {
                                menu.data.fields[0] = j.content;
                                mescol.stop();
                            });
                            mescol.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Reply collection timed out...',
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'content') {
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Reply with the new Content!',
                            });
                            filt = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                            const mescol = i.channel.createMessageCollector({
                                filt,
                                time: 35000,
                                max: 1,
                            });
                            mescol.on('collect', (j) => {
                                menu.data.fields[2] = j.content;
                                mescol.stop();
                            });
                            mescol.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Reply collection timed out...',
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'priv') {
                            const privsel = new ActionRowBuilder().addComponents(
                                new StringSelectMenuBuilder().setCustomId('privsel').setMinValues(1).setMaxValues(1).setPlaceholder('No Option selected...').addOptions(
                                    {
                                        label: 'True',
                                        value: 'true',
                                    },
                                    {
                                        label: 'False',
                                        value: 'false',
                                    }
                                )
                            );
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Select an Option:',
                                components: [privsel],
                                ephemeral: true,
                            });
                            const col = mes.createMessageComponentCollector({
                                filter,
                                time: 35000,
                                max: 1,
                            });
                            col.on('collect', (j) => {
                                if (j.customId == 'privsel') {
                                    menu.data.fields[1].value = Boolean(j.values[0]);
                                }
                                col.stop();
                            });
                            col.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Selection timed out...',
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: true,
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'finish') {
                            const mes = await i.deferReply();
                            note.title = menu.data.fields[0].value;
                            note.content = menu.data.fields[2].value;
                            note.private = Boolean(menu.data.fields[1].value);
                            client.database
                                .updateServerNote(interaction.guild, member.user, note)
                                .then(async (m) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, m).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await mes.edit({
                                        embeds: [new EmbedBuilder().setColor('Green').setDescription(m).setTimestamp()],
                                        ephemeral: true,
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                                    if (String(err).includes('Error 404')) {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Please contact the Developer if this Issue persists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                });
                        } else if (i.customId == 'cancel') {
                            await msg.edit({
                                content: 'Note Edition has been cancelled!',
                                components: [],
                                ephemeral: true,
                            });
                            collector.stop();
                        }
                    });
                })
                .catch(async (err) => {
                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                    if (String(err).includes('Error 404')) {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Please contact the Developer if the Issue persists!').setTimestamp()],
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                            ephemeral: true,
                        });
                    }
                });
        } else if (type == 'global') {
            client.database
                .getGlobalNote(member.user, { id: noteId })
                .then(async (note) => {
                    if (note.title) {
                        menu.data.fields[0].value = `${note.title} (#${note.id})`;
                    } else {
                        menu.data.fields[0].value = `Note #${note.id}`;
                    }
                    menu.data.fields[1].value = String(note.private);
                    menu.data.fields[2].value = note.content;
                    const msg = await interaction.reply({
                        embeds: [menu],
                        components: [row, row2],
                        ephemeral: note.private,
                    });
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000,
                    });
                    collector.on('collect', async (i) => {
                        let filt;
                        if (i.customId == 'title') {
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Reply with a new Title!',
                            });
                            filt = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                            const mescol = i.channel.createMessageCollector({
                                filt,
                                time: 35000,
                                max: 1,
                            });
                            mescol.on('collect', (j) => {
                                menu.data.fields[0] = j.content;
                                mescol.stop();
                            });
                            mescol.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Reply collection timed out...',
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'content') {
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Reply with the new Content!',
                            });
                            filt = (m) => m.reference.messageId == mes.id && m.author.id == member.user.id;
                            const mescol = i.channel.createMessageCollector({
                                filt,
                                time: 35000,
                                max: 1,
                            });
                            mescol.on('collect', (j) => {
                                menu.data.fields[2] = j.content;
                                mescol.stop();
                            });
                            mescol.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Reply collection timed out...',
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'priv') {
                            const privsel = new ActionRowBuilder().addComponents(
                                new StringSelectMenuBuilder().setCustomId('privsel').setMinValues(1).setMaxValues(1).setPlaceholder('No Option selected...').addOptions(
                                    {
                                        label: 'True',
                                        value: 'true',
                                    },
                                    {
                                        label: 'False',
                                        value: 'false',
                                    }
                                )
                            );
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: 'Select an Option:',
                                components: [privsel],
                                ephemeral: true,
                            });
                            const col = mes.createMessageComponentCollector({
                                filter,
                                time: 35000,
                                max: 1,
                            });
                            col.on('collect', (j) => {
                                if (j.customId == 'privsel') {
                                    menu.data.fields[1].value = Boolean(j.values[0]);
                                }
                                col.stop();
                            });
                            col.on('end', async (collected) => {
                                if (collected.size == 0) {
                                    await mes.edit({
                                        content: 'Selection timed out...',
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `Collected ${collected.size} Interactions`).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: true,
                                    });
                                }
                                setTimeout(async () => {
                                    await mes.delete();
                                }, 5000);
                            });
                        } else if (i.customId == 'finish') {
                            const mes = await i.deferReply();
                            note.title = menu.data.fields[0].value;
                            note.content = menu.data.fields[2].value;
                            note.private = Boolean(menu.data.fields[1].value);
                            client.database
                                .updateGlobalNote(member.user, note)
                                .then(async (m) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, m).catch((err) => client.database.writeDevLog(`${err}`)));
                                    await mes.edit({
                                        embeds: [new EmbedBuilder().setColor('Green').setDescription(m).setTimestamp()],
                                        ephemeral: true,
                                    });
                                })
                                .catch(async (err) => {
                                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                                    if (String(err).includes('Error 404')) {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Please contact the Developer if this Issue persists!').setTimestamp()],
                                            ephemeral: true,
                                        });
                                    } else {
                                        await mes.edit({
                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                            ephemeral: true,
                                        });
                                    }
                                });
                        } else if (i.customId == 'cancel') {
                            await msg.edit({
                                content: 'Note Edition has been cancelled!',
                                components: [],
                                ephemeral: true,
                            });
                            collector.stop();
                        }
                    });
                })
                .catch(async (err) => {
                    client.database.writeDevLog(await client.database.writeLog(interaction.guild, `${err}`).catch((err1) => client.database.writeDevLog(`${err1}`)));
                    if (String(err).includes('Error 404')) {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find that Note in the Database. Please contact the Developer if the Issue persists!').setTimestamp()],
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                            ephemeral: true,
                        });
                    }
                });
        }
    }
}
export default new Command();
