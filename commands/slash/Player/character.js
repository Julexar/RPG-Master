import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
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
            case 'view':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO
                }
                return;
            case 'add':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO
                }
                return;
            case 'remove':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO
                }
                return;
            case 'edit':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO
                }
                return;
        }
    }
}
export default new Command();
