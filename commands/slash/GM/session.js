import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
class Command {
    constructor() {
        this.name = 'session';
        this.description = 'Session specific Commands';
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.MoveMembers];
        this.options = [
            {
                name: 'select',
                description: 'Selects a created Session',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'create',
                description: 'Creates a new Session',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'channel',
                        description: 'Provide a Channel for your Session',
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                    },
                ],
            },
            {
                name: 'delete',
                description: 'Deletes a Session',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'poll',
                description: 'Creates a Poll for your Session',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'channel',
                        description: 'Select a Channel for the Poll',
                        type: ApplicationCommandOptionType.Channel,
                        required: true,
                    },
                ],
            },
            {
                name: 'post',
                description: 'Posts Session Application in a Channel',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'requirement',
                        description: 'Provide a custom requirement for Players to post',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                name: 'begin',
                description: 'Starts the Session timer',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'end',
                description: 'Ends the Session timer',
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const member = interaction.member;
        const filter = (m) => m.user.id == user.id;
        client.database
            .getDMRole(server.id)
            .then(async (dmr) => {
                console.log(member.roles.cache.has(dmr));
                if (!member.roles.cache.has(dmr)) {
                    await interaction.reply({
                        content: 'You are not allowed to use this Command!',
                        ephemeral: true,
                    });
                } else {
                    switch (option.getSubcommand()) {
                        case 'select':
                            client.database
                                .getSession(server, user)
                                .then(async (sessions) => {
                                    const rows = [];
                                    if (sessions.length <= 24) {
                                        rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('selses0').setPlaceholder('No Session selected...').setMaxValues(1)));
                                        for (const session in sessions) {
                                            rows[0].components[0].addOptions({
                                                label: `${session.name}`,
                                                value: `${session.id}`,
                                            });
                                        }
                                    } else {
                                        let count = 0;
                                        let num = 0;
                                        for (const session in sessions) {
                                            if (count == 24) {
                                                rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`selses${num}`).setPlaceholder('No Session selected...').setMaxValues(1)));
                                                num++;
                                                count = 0;
                                            }
                                            rows[num].components[0].addOptions({
                                                label: `${session.name}`,
                                                value: `${session.id}`,
                                            });
                                            count++;
                                        }
                                        const butrow = new ActionRowBuilder().addComponents(
                                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                                        );
                                        const mes = await interaction.reply({
                                            content: 'Select a Session:',
                                            components: [rows[0], butrow],
                                            ephemeral: true,
                                        });
                                        let page = 0;
                                        const collector2 = await mes.createMessageComponentCollector({
                                            filter,
                                            time: 90000,
                                        });
                                        collector2.on('collect', async (i) => {
                                            if (i.customId.includes('selses')) {
                                                const mes2 = await i.deferReply();
                                                client.database
                                                    .updateUser(user.id, server, {
                                                        name: 'session_id',
                                                        val: Number(i.values[0]),
                                                    })
                                                    .then(async (msg1) => {
                                                        client.database
                                                            .writeLog(server, msg1)
                                                            .then((msg2) => client.database.writeDevLog(msg2))
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                        await mes2.edit({
                                                            content: 'Session selected successfully!',
                                                            ephemeral: true,
                                                        });
                                                    })
                                                    .catch(async (err) => {
                                                        client.database
                                                            .writeLog(server, `${err}`)
                                                            .then((msg1) => client.database.writeDevLog(msg1))
                                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                        if (String(err).includes('Error 404')) {
                                                            await mes2.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find User in Database. Contact the Developer if this issue persists.').setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        } else {
                                                            await mes2.edit({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        }
                                                    });
                                            } else if (i.customId == 'next') {
                                                page++;
                                                if (page <= rows.length - 1) {
                                                    if (page == rows.length - 1) {
                                                        butrow.components[0].setDisabled(false);
                                                        butrow.components[1].setDisabled(true);
                                                    } else {
                                                        butrow.components[0].setDisabled(false);
                                                        butrow.components[1].setDisabled(false);
                                                    }
                                                    await mes.editReply({
                                                        content: 'Select a Session:',
                                                        components: [rows[page], butrow],
                                                        ephemeral: true,
                                                    });
                                                }
                                            } else if (i.customId == 'prev') {
                                                page--;
                                                if (page >= 0) {
                                                    if (page == 0) {
                                                        butrow.components[0].setDisabled(true);
                                                        butrow.components[1].setDisabled(false);
                                                    } else {
                                                        butrow.components[0].setDisabled(false);
                                                        butrow.components[1].setDisabled(false);
                                                    }
                                                    await mes.editReply({
                                                        content: 'Select a Session:',
                                                        components: [rows[page], butrow],
                                                        ephemeral: true,
                                                    });
                                                }
                                            }
                                        });
                                        collector2.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes.editReply({
                                                    content: 'Selection timed out...',
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                            }
                                            setTimeout(async function () {
                                                await mes.delete();
                                            }, 5000);
                                        });
                                    }
                                })
                                .catch(async (err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes('Error 404')) {
                                                await interaction.reply({
                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('You do not have any saved Sessions!').setTimestamp()],
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
                            return;
                        case 'create':
                            const chan = option.getChannel('channel');
                            const menu = new EmbedBuilder()
                                .setColor('#00ffff')
                                .setTitle('Session Creation Menu')
                                .addFields(
                                    {
                                        name: 'Title',
                                        value: ' ',
                                        inline: true,
                                    },
                                    {
                                        name: 'Levels',
                                        value: ' ',
                                        inline: true,
                                    },
                                    {
                                        name: 'Players',
                                        value: ' ',
                                        inline: true,
                                    },
                                    {
                                        name: 'Length',
                                        value: ' ',
                                        inline: true,
                                    },
                                    {
                                        name: 'Difficulty',
                                        value: ' ',
                                        inline: true,
                                    },
                                    {
                                        name: 'Description',
                                        value: ' ',
                                    },
                                    {
                                        name: 'Channel',
                                        value: chan.toString(),
                                    }
                                )
                                .setTimestamp();
                            const row1 = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('title').setLabel('Change Title').setStyle(ButtonStyle.Primary).setEmoji('🔤'),
                                new ButtonBuilder().setCustomId('lvl').setLabel('Set Levels').setStyle(ButtonStyle.Primary).setEmoji('💠'),
                                new ButtonBuilder().setCustomId('players').setLabel('Set Player Amount').setStyle(ButtonStyle.Primary).setEmoji('👤'),
                                new ButtonBuilder().setCustomId('length').setLabel('Set Length').setStyle(ButtonStyle.Primary).setEmoji('⌛')
                            );
                            const row2 = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('dif').setLabel('Set Difficulty').setStyle(ButtonStyle.Primary).setEmoji('🔰'),
                                new ButtonBuilder().setCustomId('desc').setLabel('Set Description').setStyle(ButtonStyle.Primary).setEmoji('📝'),
                                new ButtonBuilder().setCustomId('time').setLabel('Set Starttime').setStyle(ButtonStyle.Primary).setEmoji('⏰')
                            );
                            const row3 = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('finish').setLabel('Finish Setup').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId('cancel').setLabel('Cancel Setup').setStyle(ButtonStyle.Danger)
                            );
                            const msg = await interaction.reply({
                                embeds: [menu],
                                components: [row1, row2, row3],
                                ephemeral: true,
                            });
                            const collector = await msg.createMessageComponentCollector({
                                filter,
                                time: 90000,
                            });
                            collector.on('collect', async (i) => {
                                switch (i.customId) {
                                    case 'title':
                                        const mes = await i.deferReply();
                                        await mes.edit({
                                            content: 'Please reply with a new Title for the Session.',
                                        });
                                        const filt = (m) => m.reference.messageId == mes.id && m.author.id == user.id;
                                        const mescol = await i.channel.createMessageCollector({
                                            filt,
                                            max: 1,
                                            time: 35000,
                                            errors: ['time'],
                                        });
                                        mescol.on('collect', async (j) => {
                                            menu.data.fields[0].value = j.content;
                                            await mescol.stop();
                                        });
                                        mescol.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes.edit({
                                                    content: 'Reply collection timed out...',
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async function () {
                                                await mes.delete();
                                            }, 5000);
                                        });
                                        break;
                                    case 'lvl':
                                        const sel = new ActionRowBuilder().addComponents(
                                            new StringSelectMenuBuilder().setCustomId('sellvl').setPlaceholder('Select a minimum Level').setMaxValues(1).addOptions(
                                                {
                                                    label: 'Level 3-4',
                                                    value: '3-4',
                                                },
                                                {
                                                    label: 'Level 5-7',
                                                    value: '8-7',
                                                },
                                                {
                                                    label: 'Level 8-10',
                                                    value: '8-10',
                                                },
                                                {
                                                    label: 'Level 11-13',
                                                    value: '11-13',
                                                },
                                                {
                                                    label: 'Level 14-16',
                                                    value: '14-16',
                                                },
                                                {
                                                    label: 'Level 17-19',
                                                    value: '17-19',
                                                },
                                                {
                                                    label: 'Level 20+',
                                                    value: '20+',
                                                }
                                            )
                                        );
                                        const mes2 = await i.deferReply();
                                        await mes2.edit({
                                            content: 'Select a Level range:',
                                            components: [sel],
                                            ephemeral: true,
                                        });
                                        const filt2 = (m) => m.reference.messageId == mes2.id && m.author.id == user.id;
                                        const col2 = await mes2.createMessageComponentCollector({
                                            filt2,
                                            time: 35000,
                                            max: 1,
                                        });
                                        col2.on('collect', async (j) => {
                                            await j.deferUpdate();
                                            if (j.customId == 'sellvl') {
                                                menu.data.fields[1].value = `${j.values[0]}`;
                                                await col2.stop();
                                            }
                                        });
                                        col2.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes2.edit({
                                                    content: 'Selection timed out...',
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async function () {
                                                await mes2.delete();
                                            }, 5000);
                                        });
                                        return;
                                    case 'players':
                                        const mes3 = await i.deferReply();
                                        await mes3.edit({
                                            content: 'Please reply with the number of Players (x-y)',
                                        });
                                        const filt3 = (m) => m.reference.messageId == mes3.id && m.author.id == user.id;
                                        const mescol2 = await i.channel.createMessageCollector({
                                            filt3,
                                            time: 35000,
                                            max: 1,
                                        });
                                        mescol2.on('collect', async (j) => {
                                            menu.data.fields[2].value = j.content;
                                            await mescol2.stop();
                                        });
                                        mescol2.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes3.edit({
                                                    content: 'Reply collection timed out...',
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async function () {
                                                await mes3.delete();
                                            }, 5000);
                                        });
                                        return;
                                    case 'length':
                                        const mes4 = i.deferReply();
                                        await mes4.edit({
                                            content: 'Please reply with the estimated Length for the Session (in hours)',
                                        });
                                        const filt4 = (m) => m.reference.messageId == mes4.id && m.author.id == user.id;
                                        const mescol3 = await i.channel.createMessageCollector({
                                            filt4,
                                            time: 35000,
                                            max: 1,
                                        });
                                        mescol3.on('collect', async (j) => {
                                            menu.data.fields[3].value = j.content;
                                            await mescol3.stop();
                                        });
                                        mescol3.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes4.edit({
                                                    content: 'Reply collection timed out...',
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async function () {
                                                await mes4.delete();
                                            }, 5000);
                                        });
                                        return;
                                    case 'dif':
                                        const dif = new ActionRowBuilder().addComponents(
                                            new StringSelectMenuBuilder().setCustomId('difsel').setPlaceholder('No Difficulty selected...').setMaxValues(1).addOptions(
                                                {
                                                    label: 'Easy',
                                                    value: '1',
                                                },
                                                {
                                                    label: 'Medium',
                                                    value: '2',
                                                },
                                                {
                                                    label: 'Hard',
                                                    value: '3',
                                                },
                                                {
                                                    label: 'Deadly',
                                                    value: '4',
                                                }
                                            )
                                        );
                                        const mes5 = await i.deferReply();
                                        await mes5.edit({
                                            content: 'Select a Difficulty:',
                                            components: [dif],
                                            ephemeral: true,
                                        });
                                        const col3 = await mes5.createMessageComponentCollector({
                                            filter,
                                            time: 35000,
                                            max: 1,
                                        });
                                        col3.on('collect', async (j) => {
                                            await j.deferUpdate();
                                            if (j.customId == 'difsel') {
                                                switch (Number(j.values[0])) {
                                                    case 1:
                                                        menu.data.fields[4].value = `1 - Easy`;
                                                        return;
                                                    case 2:
                                                        menu.data.fields[4].value = `2 - Medium`;
                                                        return;
                                                    case 3:
                                                        menu.data.fields[4].value = `3 - Hard`;
                                                        return;
                                                    case 4:
                                                        menu.data.fields[4].value = `4 - Deadly`;
                                                        return;
                                                }
                                                col3.stop();
                                            }
                                        });
                                        col3.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes5.edit({
                                                    content: 'Selection timed out...',
                                                    components: [],
                                                    ephemeral: true,
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async () => {
                                                await mes5.delete();
                                            }, 5000);
                                        });
                                        return;
                                    case 'desc':
                                        const mes6 = await i.deferReply();
                                        await mes6.edit({
                                            content: 'Please reply with a Description for the Session',
                                        });
                                        const filt6 = (m) => m.reference.messageId == mes6.id && m.author.id == user.id;
                                        const mescol4 = await i.channel.createMessageCollector({
                                            filt6,
                                            time: 35000,
                                            max: 1,
                                        });
                                        mescol4.on('collect', async (j) => {
                                            menu.data.fields[5].value = j.content;
                                            await mescol4.stop();
                                        });
                                        mescol4.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes6.edit({
                                                    content: 'Reply collection timed out...',
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                            setTimeout(async function () {
                                                await mes6.delete();
                                            }, 5000);
                                        });
                                        return;
                                    case 'time':
                                        const mes7 = await i.deferReply();
                                        await mes7.edit({
                                            content: 'Please reply with a timestamp for the Starttime of the Session.\n\nYou can get one here: https://hammertime.cyou/',
                                        });
                                        const filt7 = (m) => m.reference.messageId == mes7.id && m.author.id == user.id;
                                        const mescol5 = await i.channel.createMessageCollector({
                                            filt7,
                                            time: 35000,
                                            max: 1,
                                        });
                                        mescol5.on('collect', async (j) => {
                                            menu.data.timestamp = new Date(Number(j.content) * 1000).toISOString();
                                            await mescol5.stop();
                                        });
                                        mescol5.on('end', async (collected) => {
                                            if (collected.size === 0) {
                                                await mes7.edit({
                                                    content: 'Reply collection timed out...',
                                                });
                                            } else {
                                                client.database
                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await interaction.editReply({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3],
                                                    ephemeral: true,
                                                });
                                            }
                                        });
                                        return;
                                    case 'finish':
                                        const runtime = menu.data.fields[3].value.replace(' hours', '').split('-');
                                        const diff = menu.data.fields[4].value.split(' - ');
                                        const session = {
                                            name: menu.data.fields[0].value,
                                            description: menu.data.fields[5].value,
                                            levels: menu.data.fields[1].value,
                                            players: menu.data.fields[2].value,
                                            min_runtime: Number(runtime[0]),
                                            max_runtime: Number(runtime[1]),
                                            start_time: menu.data.timestamp,
                                            channel: Number(menu.data.fields[6].value.replace('<#', '').replace('>', '')),
                                            difficulty: Number(diff[0]),
                                        };
                                        client.database
                                            .addSession(server, user, session)
                                            .then(async (msg1) => {
                                                client.database
                                                    .writeLog(server, msg1)
                                                    .then((msg2) => client.database.writeDevLog(msg2))
                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                await i.deferReply();
                                                await i.editReply({
                                                    content: 'Session has been created successfully',
                                                    ephemeral: true,
                                                });
                                            })
                                            .catch(async (err) => {
                                                const mes = await i.deferReply();
                                                client.database
                                                    .getServer(server)
                                                    .then((serv) => {
                                                        client.database
                                                            .writeLog(server, `${err}`)
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                if (String(err).includes('Error 409') && !serv.dup_sessions) {
                                                                    await mes.edit({
                                                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('A Session with this Name already exists. Please choose a different Name!').setTimestamp()],
                                                                        ephemeral: true,
                                                                    });
                                                                } else {
                                                                    await mes.edit({
                                                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                        ephemeral: true,
                                                                    });
                                                                }
                                                            })
                                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                    })
                                                    .catch(async (err1) => {
                                                        client.database
                                                            .writeLog(server, `${err1}`)
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                if (String(err1).includes('Error 404')) {
                                                                    await mes.edit({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor('Red')
                                                                                .setTitle(`${err1}`)
                                                                                .setDescription('The Server could not be found in the Database! Contact the Developer if this Issue persists.')
                                                                                .setTimestamp(),
                                                                        ],
                                                                        ephemeral: true,
                                                                    });
                                                                } else {
                                                                    await mes.edit({
                                                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                        ephemeral: true,
                                                                    });
                                                                }
                                                            })
                                                            .catch((err2) => client.database.writeDevLog(`${err2}`));
                                                    });
                                            });
                                        return;
                                    case 'cancel':
                                        collector.stop();
                                        return;
                                }
                            });
                            collector.on('end', async (collected) => {
                                if (collected.size === 0) {
                                    await interaction.editReply({
                                        content: 'Selection timed out...',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    client.database
                                        .writeLog(server, `Collected ${collected.size} Interactions`)
                                        .then((msg1) => client.database.writeDevLog(msg1))
                                        .catch((err) => client.database.writeDevLog(`${err}`));
                                }
                                setTimeout(async function () {
                                    await msg.delete();
                                }, 5000);
                            });
                            return;
                        case 'delete':
                            client.database
                                .getUser(user.id, server)
                                .then(async (u) => {
                                    if (u.session_id) {
                                        const crow = new ActionRowBuilder().addComponents(
                                            new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success).setEmoji('✅'),
                                            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger).setEmoji('🛑')
                                        );
                                        client.database
                                            .getSession(server, user, { id: u.session_id })
                                            .then(async (s) => {
                                                s = s[0];
                                                if (!s.finished) {
                                                    const message = await interaction.reply({
                                                        content: `Are you sure you want to delete the Session \"${s.name}\"?`,
                                                        components: [crow],
                                                        ephemeral: true,
                                                    });
                                                    const col4 = await message.createMessageComponentCollector({
                                                        filter,
                                                        time: 90000,
                                                        max: 1,
                                                    });
                                                    col4.on('collect', async (i) => {
                                                        if (i.customId === 'confirm') {
                                                            await i.deferUpdate();
                                                            client.database
                                                                .remSession(server, user, s)
                                                                .then(async () => {
                                                                    await message.edit({
                                                                        content: '',
                                                                        embeds: [new EmbedBuilder().setColor('Green').setTitle('Success').setDescription(`Session \"${s.name}\" has been deleted successfully!`).setTimestamp()],
                                                                        components: [],
                                                                        ephemeral: true,
                                                                    });
                                                                    await col4.stop();
                                                                })
                                                                .catch(async (err) => {
                                                                    const mes = await i.deferReply();
                                                                    client.database
                                                                        .writeLog(server, `${err}`)
                                                                        .then(async (msg1) => {
                                                                            client.database.writeDevLog(msg1);
                                                                            await mes.edit({
                                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                ephemeral: true,
                                                                            });
                                                                        })
                                                                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                    await col4.stop();
                                                                });
                                                        } else if (i.customId === 'cancel') {
                                                            await message.edit({
                                                                content: 'Deletion has been cancelled!',
                                                                components: [],
                                                                ephemeral: true,
                                                            });
                                                            await col4.stop();
                                                        }
                                                    });
                                                    col4.on('end', async (collected) => {
                                                        if (collected.size === 0) {
                                                            await message.edit({
                                                                content: 'Selection timed out...',
                                                                components: [],
                                                                ephemeral: true,
                                                            });
                                                        } else {
                                                            client.database
                                                                .writeLog(server, `Collected ${collected.size} Interactions`)
                                                                .then((msg1) => client.database.writeDevLog(msg1))
                                                                .catch((err) => client.database.writeDevLog(`${err}`));
                                                        }
                                                        setTimeout(async () => {
                                                            await message.delete();
                                                        }, 5000);
                                                    });
                                                } else {
                                                    if (!member.permissions.cache.has(PermissionFlagsBits.Administrator)) {
                                                        client.database
                                                            .writeLog(server, 'Error 401: Unauthorized')
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                await interaction.reply({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor('Red')
                                                                            .setTitle('Error 401: Unauthorized')
                                                                            .setDescription('You are not allowed to delete finished Sessions, please reach out to an Administrator.')
                                                                            .setTimestamp(),
                                                                    ],
                                                                    ephemeral: true,
                                                                });
                                                            })
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                    } else {
                                                        const fil2 = (m) => m.member.permissions.cache.has(PermissionFlagsBits.Administrator);
                                                        const message = await interaction.reply({
                                                            content: `Are you sure you want to delete the Session \"${s[0].name}\"?`,
                                                            components: [crow],
                                                            ephemeral: true,
                                                        });
                                                        const col4 = await message.createMessageComponentCollector({
                                                            fil2,
                                                            time: 90000,
                                                            max: 1,
                                                        });
                                                        col4.on('collect', async (i) => {
                                                            if (i.customId === 'confirm') {
                                                                await i.deferUpdate();
                                                                client.database
                                                                    .remSession(server, user, s[0])
                                                                    .then(async (msg1) => {
                                                                        client.database
                                                                            .writeLog(server, msg1)
                                                                            .then((msg2) => client.database.writeDevLog(msg2))
                                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                                        await message.edit({
                                                                            content: '',
                                                                            embeds: [new EmbedBuilder().setColor('Green').setTitle('Success').setDescription(`Session \"${s[0].name}\" has been deleted successfully!`).setTimestamp()],
                                                                            components: [],
                                                                            ephemeral: true,
                                                                        });
                                                                        await col4.stop();
                                                                    })
                                                                    .catch(async (err) => {
                                                                        const mes = await i.deferReply();
                                                                        client.database
                                                                            .writeLog(server, `${err}`)
                                                                            .then(async () => {
                                                                                await mes.edit({
                                                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                    ephemeral: true,
                                                                                });
                                                                            })
                                                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                        await col4.stop();
                                                                    });
                                                            } else if (i.customId === 'cancel') {
                                                                await message.edit({
                                                                    content: 'Deletion has been cancelled!',
                                                                    components: [],
                                                                    ephemeral: true,
                                                                });
                                                                await col4.stop();
                                                            }
                                                        });
                                                        col4.on('end', async (collected) => {
                                                            if (collected.size === 0) {
                                                                await message.edit({
                                                                    content: 'Selection timed out...',
                                                                    components: [],
                                                                    ephemeral: true,
                                                                });
                                                            } else {
                                                                client.database
                                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                            }
                                                            setTimeout(async function () {
                                                                await message.delete();
                                                            }, 5000);
                                                        });
                                                    }
                                                }
                                            })
                                            .catch((err) => {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                            });
                                    } else {
                                        await interaction.reply({
                                            content: 'You have not selected a Session. Please use `/session select` before you use this command.',
                                            ephemeral: true,
                                        });
                                    }
                                })
                                .catch((err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then((msg1) => client.database.writeDevLog(msg1))
                                        .catch((err1) => client.database.writeDevLog(`${err1}`));
                                });
                            return;
                        case 'poll':
                            const chan1 = option.getChannel('channel');
                            client.database
                                .getUser(user.id, server)
                                .then(async (u) => {
                                    if (!u.session_id) {
                                        await interaction.reply({
                                            content: 'You have not selected a Session. Please use `/session select` before you use this command.',
                                            ephemeral: true,
                                        });
                                    } else {
                                        client.database
                                            .getServer(server.id)
                                            .then(async (serv) => {
                                                client.database
                                                    .getSession(server, user, { id: u.session_id })
                                                    .then(async (s) => {
                                                        s = s[0];
                                                        if (!s.started && !s.finished) {
                                                            const ses = new EmbedBuilder()
                                                                .setColor('Aqua')
                                                                .setAuthor({
                                                                    name: user.tag,
                                                                    iconURL: user.avatarURL(),
                                                                })
                                                                .setTitle(`${s.name}`)
                                                                .setDescription(`${s.description}`)
                                                                .addFields(
                                                                    {
                                                                        name: 'Levels',
                                                                        value: `${s.levels}`,
                                                                        inline: true,
                                                                    },
                                                                    {
                                                                        name: 'Players',
                                                                        value: `${s.players}`,
                                                                        inline: true,
                                                                    },
                                                                    {
                                                                        name: 'Length',
                                                                        value: `${s.min_runtime}-${s.max_runtime} hours`,
                                                                        inline: true,
                                                                    }
                                                                )
                                                                .setTimestamp(s.start_time);
                                                            switch (s.difficulty) {
                                                                case 1:
                                                                    ses.addFields({
                                                                        name: 'Difficulty',
                                                                        value: `${s.difficulty} - Easy`,
                                                                        inline: true,
                                                                    });
                                                                    return;
                                                                case 2:
                                                                    ses.addFields({
                                                                        name: 'Difficulty',
                                                                        value: `${s.difficulty} - Medium`,
                                                                        inline: true,
                                                                    });
                                                                    return;
                                                                case 3:
                                                                    ses.addFields({
                                                                        name: 'Difficulty',
                                                                        value: `${s.difficulty} - Hard`,
                                                                        inline: true,
                                                                    });
                                                                    return;
                                                                case 4:
                                                                    ses.addFields({
                                                                        name: 'Difficulty',
                                                                        value: `${s.difficulty} - Deadly`,
                                                                        inline: true,
                                                                    });
                                                                    return;
                                                            }
                                                            ses.addFields({
                                                                name: 'Channel',
                                                                value: `<#${s.channel}>`,
                                                            });
                                                            await chan1.send({
                                                                content: `<@&${serv.sesh_ping}>`,
                                                                embeds: [ses],
                                                            });
                                                            await interaction.reply({
                                                                content: `Poll has been posted to ${chan1.toString()}`,
                                                                ephemeral: true,
                                                            });
                                                        } else {
                                                            client.database
                                                                .writeLog(server, 'Error 401: Unauthorized')
                                                                .then(async (msg1) => {
                                                                    client.database.writeDevLog(msg1);
                                                                    await interaction.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor('Red')
                                                                                .setTitle('Error 401: Unauthorized')
                                                                                .setDescription('You may not use this Command on a Session that has already begun or ended!')
                                                                                .setTimestamp(),
                                                                        ],
                                                                        ephemeral: true,
                                                                    });
                                                                })
                                                                .catch((err) => client.database.writeDevLog(`${err}`));
                                                        }
                                                    })
                                                    .catch(async (err) => {
                                                        client.database
                                                            .writeLog(server, `${err}`)
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                if (String(err).includes('Error 404')) {
                                                                    await interaction.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setColor('Red')
                                                                                .setTitle(`${err}`)
                                                                                .setDescription('Could not find the selected Session in the Database. Please contact the Developer if this Issue persists.')
                                                                                .setTimestamp(),
                                                                        ],
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
                                            })
                                            .catch(async (err) => {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async (msg1) => {
                                                        client.database.writeDevLog(msg1);
                                                        if (String(err).includes('Error 404')) {
                                                            await interaction.reply({
                                                                emebeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor('Red')
                                                                        .setTitle(`${err}`)
                                                                        .setDescription('Could not find the Server in the Database. Try removing the Bot and reinviting it.\n\nContact the Developer if this Issue persists.')
                                                                        .setTimestamp(),
                                                                ],
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
                                })
                                .catch(async (err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes('Error 404')) {
                                                await interaction.reply({
                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find User in Database. Please contact the Develeoper if this Issue persists.').setTimestamp()],
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
                            return;
                        case 'post':
                            let req = option.getString('requirement');
                            client.database
                                .getUser(user.id, server)
                                .then(async (u) => {
                                    if (!u.session_id) {
                                        await interaction.reply({
                                            content: 'You have not selected a Session. Please use `/session select` before you use this command.',
                                            ephemeral: true,
                                        });
                                    } else {
                                        client.database
                                            .getSession(server, user, { id: u.session_id })
                                            .then(async (s) => {
                                                s = s[0];
                                                if (!s.started && s.finished) {
                                                    const seschan = await server.channels.cache.get(s.channel);
                                                    if (!seschan) {
                                                        await interaction.reply({
                                                            embeds: [
                                                                new EmbedBuilder()
                                                                    .setColor('Red')
                                                                    .setTitle('Error 406: Invalid Channel')
                                                                    .setDescription('Could not find the Channel provided during Session Creation, please update the Session Channel by using `/session update`!')
                                                                    .setTimestamp(),
                                                            ],
                                                            ephemeral: true,
                                                        });
                                                    } else {
                                                        const row = new ActionRowBuilder().addComponents(
                                                            new ButtonBuilder().setCustomId('join').setLabel('Join Game').setStyle(ButtonStyle.Success),
                                                            new ButtonBuilder().setCustomId('leave').setLabel('Leave Game').setStyle(ButtonStyle.Danger)
                                                        );
                                                        const ses1 = new EmbedBuilder()
                                                            .setColor('Aqua')
                                                            .setAuthor({
                                                                name: user.tag,
                                                                iconURL: user.avatarURL(),
                                                            })
                                                            .setTitle(`${s.name}`)
                                                            .setDescription(`${s.description}`)
                                                            .setTimestamp(s.start_time);
                                                        if (req) {
                                                            ses1.addFields({
                                                                label: 'Additional Requirements',
                                                                value: `${req}`,
                                                            });
                                                        }
                                                        const msg = await seschan.send({
                                                            embeds: [ses1],
                                                            components: [row],
                                                        });
                                                        await interaction.reply({
                                                            content: `Session Application has been posted to <#${s.channel}>`,
                                                            ephemeral: true,
                                                        });
                                                        const filter = (m) => m.user.id != user.id;
                                                        gamecol = msg.createMessageComponentCollector({
                                                            filter,
                                                        });
                                                        while (!gamecol.ended) {
                                                            client.database
                                                                .getSession(server, user, s)
                                                                .then(async (ses) => {
                                                                    if (ses.started) {
                                                                        await gamecol.stop();
                                                                        gamecol.ended = true;
                                                                    }
                                                                })
                                                                .catch((err) => {
                                                                    client.database
                                                                        .writeLog(server, `${err}`)
                                                                        .then((msg1) => client.database.writeDevLog(msg1))
                                                                        .catch((err1) => client.datanase.writeDevLog(`${err1}`));
                                                                });
                                                            gamecol.on('collect', async (i) => {
                                                                if (i.customId == 'join') {
                                                                    client.database
                                                                        .getUser(server, i.user)
                                                                        .then(async (u) => {
                                                                            if (!u.char_id) {
                                                                                const mes = await i.deferReply();
                                                                                await mes.edit({
                                                                                    content: 'You have not selected a Character!\n\nPlease user </character select:> before you click this Button again!',
                                                                                    ephemeral: true,
                                                                                });
                                                                            } else {
                                                                                client.database
                                                                                    .joinSession(server, u, { id: u.char_id }, user, s)
                                                                                    .then(async function () {
                                                                                        client.database
                                                                                            .getChar(u, {
                                                                                                id: u.char_id,
                                                                                            })
                                                                                            .then(async (c) => {
                                                                                                const mes = await i.deferReply();
                                                                                                await mes.edit({
                                                                                                    content: `Successfully joined Game with Character \"${c.name}\"!`,
                                                                                                    ephemeral: true,
                                                                                                });
                                                                                            })
                                                                                            .catch(async (err) => {
                                                                                                const mes = await i.deferReply();
                                                                                                client.database
                                                                                                    .writeLog(server, `${err}`)
                                                                                                    .then(async (msg1) => {
                                                                                                        client.database.writeDevLog(msg1);
                                                                                                        await mes.edit({
                                                                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                                            ephemeral: true,
                                                                                                        });
                                                                                                    })
                                                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                                            });
                                                                                    })
                                                                                    .catch(async (err) => {
                                                                                        const mes = await i.deferReply();
                                                                                        client.database
                                                                                            .writeLog(server, `${err}`)
                                                                                            .then(async (msg1) => {
                                                                                                client.database.writeDevLog(msg1);
                                                                                                await mes.edit({
                                                                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                                    ephemeral: true,
                                                                                                });
                                                                                            })
                                                                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(async (err) => {
                                                                            const mes = await i.deferReply();
                                                                            client.database
                                                                                .writeLog(server, `${err}`)
                                                                                .then(async (msg1) => {
                                                                                    client.database.writeDevLog(msg1);
                                                                                    await mes.edit({
                                                                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                        ephemeral: true,
                                                                                    });
                                                                                })
                                                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                        });
                                                                } else if (i.customId == 'leave') {
                                                                    client.database
                                                                        .getUser(server, i.user)
                                                                        .then(async (u) => {
                                                                            if (!u.char_id) {
                                                                                const mes = await i.deferReply();
                                                                                await mes.edit({
                                                                                    content: 'You have not selected a Character!\n\nPlease user </character select:> before you click this Button again!',
                                                                                    ephemeral: true,
                                                                                });
                                                                            } else {
                                                                                client.database
                                                                                    .leaveSession(server, u, { id: u.char_id }, user, s)
                                                                                    .then(async function () {
                                                                                        client.database
                                                                                            .getChar(u, {
                                                                                                id: u.char_id,
                                                                                            })
                                                                                            .then(async () => {
                                                                                                const mes = await i.deferReply();
                                                                                                await mes.edit({
                                                                                                    content: `Successfully left the Game!`,
                                                                                                    ephemeral: true,
                                                                                                });
                                                                                            })
                                                                                            .catch(async (err) => {
                                                                                                const mes = await i.deferReply();
                                                                                                client.database
                                                                                                    .writeLog(server, `${err}`)
                                                                                                    .then(async (msg1) => {
                                                                                                        client.database.writeDevLog(msg1);
                                                                                                        await mes.edit({
                                                                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                                            ephemeral: true,
                                                                                                        });
                                                                                                    })
                                                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                                            });
                                                                                    })
                                                                                    .catch(async (err) => {
                                                                                        const mes = await i.deferReply();
                                                                                        client.database
                                                                                            .writeLog(server, `${err}`)
                                                                                            .then(async (msg1) => {
                                                                                                client.database.writeDevLog(msg1);
                                                                                                await mes.edit({
                                                                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                                    ephemeral: true,
                                                                                                });
                                                                                            })
                                                                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                                    });
                                                                            }
                                                                        })
                                                                        .catch(async (err) => {
                                                                            const mes = await i.deferReply();
                                                                            client.database
                                                                                .writeLog(server, `${err}`)
                                                                                .then(async (msg1) => {
                                                                                    client.database.writeDevLog(msg1);
                                                                                    await mes.edit({
                                                                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                                        ephemeral: true,
                                                                                    });
                                                                                })
                                                                                .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                                        });
                                                                }
                                                            });
                                                        }
                                                        gamecol.on('end', async (collected) => {
                                                            if (collected.size >= 1) {
                                                                client.database
                                                                    .writeLog(server, `Collected ${collected.size} Interactions`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                            }
                                                            row.components[0].setDisabled(true);
                                                            await msg.edit({
                                                                embeds: [ses1],
                                                                components: [row],
                                                            });
                                                        });
                                                    }
                                                } else {
                                                    client.database
                                                        .writeLog(server, 'Error 401: Unauthorized')
                                                        .then(async (msg1) => {
                                                            client.database.writeDevLog(msg1);
                                                            await interaction.reply({
                                                                embeds: [
                                                                    new EmbedBuilder().setColor('Red').setTitle('Error 401: Unauthorized').setDescription('You may not use this Command on a Session that has already begun or ended!').setTimestamp(),
                                                                ],
                                                                ephemeral: true,
                                                            });
                                                        })
                                                        .catch((err) => client.database.writeDevLog(`${err}`));
                                                }
                                            })
                                            .catch(async (err) => {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async (msg1) => {
                                                        client.database.writeDevLog(msg1);
                                                        if (String(err).includes('Error 404')) {
                                                            await interaction.reply({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor('Red')
                                                                        .setTitle(`${err}`)
                                                                        .setDescription('Could not find the selected Session in the Database. Please contact the Developer if this Issue persists.')
                                                                        .setTimestamp(),
                                                                ],
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
                                })
                                .catch((err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes('Error 404')) {
                                                await interaction.reply({
                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find User in Database. Please contact the Develeoper if this Issue persists.').setTimestamp()],
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
                            return;
                        case 'begin':
                            client.database
                                .getUser(user.id, server)
                                .then(async (u) => {
                                    if (!u.session_id) {
                                        await interaction.reply({
                                            content: 'You have not selected a Session. Please use `/session select` before you use this command.',
                                            ephemeral: true,
                                        });
                                    } else {
                                        client.database
                                            .getSession(server, user, { id: u.session_id })
                                            .then(async (s) => {
                                                s = s[0];
                                                if (!s.started && !s.finished) {
                                                    const sesschan = await server.channels.cache.get(s.channel);
                                                    if (!sesschan) {
                                                        client.database
                                                            .writeLog(server, 'Error 406: Invalid Channel')
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                await interaction.reply({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor('Red')
                                                                            .setTitle('Error 406: Invalid Channel')
                                                                            .setDescription('Could not find the Channel provided during Session Creation, please update the Session Channel by using `/session update`!')
                                                                            .setTimestamp(),
                                                                    ],
                                                                    ephemeral: true,
                                                                });
                                                            })
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                    } else {
                                                        await sesschan.send({
                                                            content: 'The Session has started, please do not post any further applications!',
                                                        });
                                                        await interaction.reply({
                                                            content: 'Session started successfully!',
                                                            ephemeral: true,
                                                        });
                                                        s.started = true;
                                                        s.date = new Date(Date.now() * 1000).toISOString();
                                                        client.database
                                                            .updateSession(server, user, s)
                                                            .then((msg1) => {
                                                                client.database
                                                                    .writeLog(server, msg1)
                                                                    .then((msg2) => client.database.writeDevLog(msg2))
                                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                            })
                                                            .catch((err) => {
                                                                client.database
                                                                    .writeLog(server, `${err}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                            });
                                                    }
                                                } else if (s.started) {
                                                    await interaction.reply({
                                                        content: 'This Session has already started!',
                                                        ephemeral: true,
                                                    });
                                                } else if (s.finished) {
                                                    client.database
                                                        .writeLog(server, 'Error 401: Unauthorized')
                                                        .then(async (msg1) => {
                                                            client.database.writeDevLog(msg1);
                                                            await interaction.reply({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('Error 401: Unauthorized').setDescription('You may not use this Command on a Session that has ended!').setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        })
                                                        .catch((err) => client.database.writeDevLog(`${err}`));
                                                }
                                            })
                                            .catch(async (err) => {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async (msg1) => {
                                                        client.database.writeDevLog(msg1);
                                                        if (String(err).includes('Error 404')) {
                                                            await interaction.reply({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor('Red')
                                                                        .setTitle(`${err}`)
                                                                        .setDescription('Could not find the selected Session in the Database. Please contact the Developer if this Issue persists.')
                                                                        .setTimestamp(),
                                                                ],
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
                                })
                                .catch(async (err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes('Error 404')) {
                                                await interaction.reply({
                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find User in Database. Please contact the Develeoper if this Issue persists.').setTimestamp()],
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
                            return;
                        case 'end':
                            client.database
                                .getUser(user.id, server)
                                .then(async (u) => {
                                    if (!u.session_id) {
                                        await interaction.reply({
                                            content: 'You have not selected a Session. Please use `/session select` before you use this command.',
                                            ephemeral: true,
                                        });
                                    } else {
                                        client.database
                                            .getSession(server, user, { id: u.session_id })
                                            .then(async (s) => {
                                                s = s[0];
                                                if (s.started && !s.finished) {
                                                    const sesschann = await server.channels.cache.get(s.channel);
                                                    if (!sesschann) {
                                                        client.database
                                                            .writeLog(server, 'Error 406: Invalid Channel')
                                                            .then(async (msg1) => {
                                                                client.database.writeDevLog(msg1);
                                                                await interaction.reply({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor('Red')
                                                                            .setTitle('Error 406: Invalid Channel')
                                                                            .setDescription('Could not find the Channel provided during Session Creation, please update the Session Channel by using `/session update`!')
                                                                            .setTimestamp(),
                                                                    ],
                                                                    ephemeral: true,
                                                                });
                                                            })
                                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                                    } else {
                                                        await sesschann.send({
                                                            content: 'This Session has ended!',
                                                        });
                                                        await sesschann.send({
                                                            content: '```\n ```',
                                                        });
                                                        s.finished = true;
                                                        s.end_time = new Date(Date.now() * 1000).toISOString();
                                                        client.database
                                                            .updateSession(server, user, s)
                                                            .then((mes) => {
                                                                client.database
                                                                    .writeLog(server, mes)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err) => client.database.writeDevLog(`${err}`));
                                                            })
                                                            .catch((err) => {
                                                                client.database
                                                                    .writeLog(server, `${err}`)
                                                                    .then((msg1) => client.database.writeDevLog(msg1))
                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                            });
                                                        let start = new Date(s.date);
                                                        let end = new Date(s.end_time);
                                                        let time = end.getHours() - start.getHours();
                                                        client.database
                                                            .addGMXP(server, user, time)
                                                            .then(async () => {
                                                                client.database
                                                                    .getGM(server, user)
                                                                    .then(async (gm) => {
                                                                        await interaction.reply({
                                                                            content: `Session has been ended successfully!\n\nNew GMXP: ${gm.xp}`,
                                                                            ephemeral: true,
                                                                        });
                                                                    })
                                                                    .catch(async (err) => {
                                                                        client.database
                                                                            .writeLog(server, `${err}`)
                                                                            .then(async (msg1) => {
                                                                                client.database.writeDevLog(msg1);
                                                                                if (String(err).includes('Error 404')) {
                                                                                    await interaction.reply({
                                                                                        embeds: [
                                                                                            new EmbedBuilder()
                                                                                                .setColor('Red')
                                                                                                .setTitle(`${err}`)
                                                                                                .setDescription('Could not find GM in the Database! Contact the Developer if this Issue persists.')
                                                                                                .setTimestamp(),
                                                                                        ],
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
                                                            })
                                                            .catch(async (err) => {
                                                                client.database
                                                                    .writeLog(server, `${err}`)
                                                                    .then(async (msg1) => {
                                                                        client.database.writeDevLog(msg1);
                                                                        await interaction.reply({
                                                                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                                            ephemeral: true,
                                                                        });
                                                                    })
                                                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                                            });
                                                    }
                                                } else if (!s.started) {
                                                    client.database
                                                        .writeLog(server, 'Error 401: Unauthorized')
                                                        .then(async (msg1) => {
                                                            client.database.writeDevLog(msg1);
                                                            await interaction.reply({
                                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('Error 401: Unauthorized').setDescription('You may not use this Command on a Session that has not stated yet!').setTimestamp()],
                                                                ephemeral: true,
                                                            });
                                                        })
                                                        .catch((err) => client.database.writeDevLog(`${err}`));
                                                } else if (s.finished) {
                                                    await interaction.reply({
                                                        content: 'This Session has already ended!',
                                                        ephemeral: true,
                                                    });
                                                }
                                            })
                                            .catch(async (err) => {
                                                client.database
                                                    .writeLog(server, `${err}`)
                                                    .then(async (msg1) => {
                                                        client.database.writeDevLog(msg1);
                                                        if (String(err).includes('Error 404')) {
                                                            await interaction.reply({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setColor('Red')
                                                                        .setTitle(`${err}`)
                                                                        .setDescription('Could not find the selected Session in the Database. Please contact the Developer if this Issue persists.')
                                                                        .setTimestamp(),
                                                                ],
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
                                })
                                .catch(async (err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async (msg1) => {
                                            client.database.writeDevLog(msg1);
                                            if (String(err).includes('Error 404')) {
                                                await interaction.reply({
                                                    embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('Could not find User in Database. Please contact the Develeoper if this Issue persists.').setTimestamp()],
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
                            return;
                    }
                }
            })
            .catch(async (err) => {
                client.database
                    .writeLog(server, `${err}`)
                    .then(async (msg1) => {
                        client.database.writeDevLog(msg1);
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                            ephemeral: true,
                        });
                    })
                    .catch((err1) => client.database.writeDevLog(`${err1}`));
            });
    }
}
export default new Command();
