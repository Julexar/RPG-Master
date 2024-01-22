import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../../custom/errors';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import moment from 'moment';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const gm = await client.database.Server.gms.getOne(server, user);
        const member = interaction.member;
        const filter = (m) => m.user.id == user.id;

        const dmRoleId = await client.database.Server.getOne(server).dm_role;

        if (!member.roles.cache.has(dmRoleId)) {
            const err = new ForbiddenError('Missing Permissions', 'You do not have permission to use this command!');
            client.logServerError(server, err);

            await interaction.reply({
                embeds: [new ErrorEmbed(err, false)],
                ephemeral: true,
            });
        } else {
            let msg, rows, row1, row2, row3, collector, emph, count, num, page, embed;
            const channel = option.getChannel('channel');

            switch (option.getSubcommand()) {
                case 'select':
                    try {
                        row1 = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder().setCustomId('session_select').setPlaceholder('No Session selected...').setMaxValues(1)
                        );

                        row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                        );

                        rows = [];
                        rows.push(row1);

                        const sessions = await client.database.Server.sessions.getAll(server, user);

                        count, num, (page = 0);

                        for (const session of sessions) {
                            if (count === 24) {
                                rows.push(row1);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: session.name,
                                value: `${session.id}`,
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Select a Session:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'session_select':
                                    embed = await this.selectSession(server, user, { id: Number(i.values[0]) });

                                    emph = embed.data.color === '#FF0000';

                                    await i.followUp({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            row2.components[0].setDisabled(true);
                                            row2.components[1].setDisabled(false);
                                        } else {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Session:',
                                            components: [rows[page], row2],
                                        });
                                    }
                                    break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < num) {
                                        page++;

                                        if (page === num) {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(true);
                                        } else {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Session:',
                                            components: [rows[page], row2],
                                        });
                                    }
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Selection has been cancelled...',
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection has timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'create':
                    try {
                        const menu = new ListEmbed('Session Creator', null, [
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
                                value: ' ',
                            },
                        ]);

                        row1 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('title').setStyle(ButtonStyle.Primary).setLabel('Change Title').setEmoji('🔤'),
                            new ButtonBuilder().setCustomId('levels').setStyle(ButtonStyle.Primary).setLabel('Set Levels').setEmoji('💠'),
                            new ButtonBuilder().setCustomId('players').setStyle(ButtonStyle.Primary).setLabel('Set Player Amount').setEmoji('👥'),
                            new ButtonBuilder().setCustomId('length').setStyle(ButtonStyle.Primary).setLabel('Set Length').setEmoji('⏳')
                        );

                        row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('difficulty').setStyle(ButtonStyle.Primary).setLabel('Set Difficulty').setEmoji('📊'),
                            new ButtonBuilder()
                                .setCustomId('description')
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('Change Description')
                                .setEmoji('📝'),
                            new ButtonBuilder().setCustomId('time').setStyle(ButtonStyle.Primary).setLabel('Set Starttime').setEmoji('🕐')
                        );

                        row3 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('finish').setStyle(ButtonStyle.Success).setLabel('Finish'),
                            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                        );

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row2, row3],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            let mes, mescol, mesfilt;
                            switch (i.customId) {
                                case 'title':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a Title for your Session.',
                                    });

                                    mesfilt = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfilt, time: 35000, max: 1 });

                                    mescol.on('collect', (m) => {
                                        menu.data.fields[0].value = m.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You did not reply in time!`,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Messages`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'levels':
                                    const lvlsel = new ActionRowBuilder().addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('lvl_select')
                                            .setPlaceholder('No Level range selected...')
                                            .setMaxValues(1)
                                            .setOptions([
                                                {
                                                    label: 'Level 3-4',
                                                    value: '3-4',
                                                },
                                                {
                                                    label: 'Level 5-7',
                                                    value: '5-7',
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
                                                },
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please select a Level range for your Session:',
                                        components: [lvlsel],
                                        ephemeral: true,
                                    });

                                    mescol = mes.createMessageComponentCollector({ filter, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        await j.deferUpdate();
                                        menu.data.fields[1].value = j.values[0];
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Selection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'players':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with the amount of Players for your Session (x-y).',
                                    });

                                    mesfilt = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfilt, time: 35000, max: 1 });

                                    mescol.on('collect', (m) => {
                                        menu.data.fields[2].value = m.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You did not reply in time!`,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Messages`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'length':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with the Length of your Session (in Hours).',
                                    });

                                    mesfilt = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfilt, time: 35000, max: 1 });

                                    mescol.on('collect', (m) => {
                                        menu.data.fields[3].value = m.content + ' Hour(s)';
                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You did not reply in time!`,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Messages`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'difficulty':
                                    const difsel = new ActionRowBuilder().addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('dif_select')
                                            .setPlaceholder('No Difficulty selected...')
                                            .setMaxValues(1)
                                            .setOptions([
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
                                                },
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please select a Difficulty for your Session:',
                                        components: [difsel],
                                        ephemeral: true,
                                    });

                                    mescol = mes.createMessageComponentCollector({ filter, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        await j.deferUpdate();

                                        switch (Number(j.values[0])) {
                                            case 1:
                                                menu.data.fields[4].value = '1 - Easy';
                                                break;
                                            case 2:
                                                menu.data.fields[4].value = '2 - Medium';
                                                break;
                                            case 3:
                                                menu.data.fields[4].value = '3 - Hard';
                                                break;
                                            case 4:
                                                menu.data.fields[4].value = '4 - Deadly';
                                                break;
                                        }

                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Selection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'description':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a Description for your Session.',
                                    });

                                    mesfilt = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfilt, time: 35000, max: 1 });

                                    mescol.on('collect', (m) => {
                                        menu.data.fields[5].value = m.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You did not reply in time!`,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Messages`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'time':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content:
                                            'Please reply with a timestamp for the Starttime of the Session.\n\nYou can get one here: https://hammertime.cyou/',
                                    });

                                    mesfilt = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfilt, time: 35000, max: 1 });

                                    mescol.on('collect', (m) => {
                                        menu.data.timestamp = new Date(Number(m.content) * 1000).toISOString();
                                        mescol.stop();
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You did not reply in time!`,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Messages`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'finish':
                                    const runtime = menu.data.fields[3].value.replace(' Hour(s)', '').split('-');
                                    const difficulty = menu.data.fields[4].value.split(' - ')[0];
                                    const session = {
                                        name: menu.data.fields[0].value,
                                        description: menu.data.fields[5].value,
                                        levels: menu.data.fields[1].value,
                                        players: menu.data.fields[2].value,
                                        min_runtime: Number(runtime[0]),
                                        max_runtime: Number(runtime[1]),
                                        start_time: menu.data.timestamp,
                                        channel: channel.id,
                                        difficulty: Number(difficulty),
                                    };

                                    embed = await this.createSession(server, user, session);

                                    emph = embed.data.color === '#FF0000';

                                    await i.followUp({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Session Creation has been cancelled...',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    embeds: [],
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof DuplicateError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'delete':
                    try {
                        if (gm.session_id) {
                            row1 = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                                new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                            );

                            const session = await client.database.Server.sessions.getOne(server, user, { id: gm.session_id });

                            msg = await interaction.reply({
                                content: 'Are you sure you want to delete your selected Session?',
                                embeds: [new ListEmbed(session.name, session.description)],
                                components: [row1],
                                ephemeral: true,
                            });

                            collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                            collector.on('collect', async (i) => {
                                switch (i.customId) {
                                    case 'confirm':
                                        embed = await client.database.Server.sessions.remove(server, user, { id: gm.session_id });

                                        emph = embed.data.color === '#FF0000';

                                        await i.followUp({
                                            embeds: [embed],
                                            ephemeral: emph,
                                        });
                                        break;
                                    case 'cancel':
                                        await i.deferUpdate();

                                        await msg.edit({
                                            content: 'Deletion has been cancelled...',
                                            embeds: [],
                                            components: [],
                                            ephemeral: true,
                                        });

                                        collector.stop();
                                        break;
                                }
                            });

                            collector.on('end', async (collected) => {
                                if (collected.size === 0) {
                                    await msg.edit({
                                        content: 'Confirmation timed out...',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });
                                } else {
                                    client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                }

                                setTimeout(async () => {
                                    await msg.delete();
                                }, 5000);
                            });
                        } else {
                            await interaction.reply({
                                content: 'You do not have a Session selected! Please select one first with `/session select`.',
                                ephemeral: true,
                            });
                        }
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'poll':
                    const dbServer = await client.database.Server.getOne(server);

                    try {
                        if (gm.session_id) {
                            const session = await client.database.Server.sessions.getOne(server, user, { id: gm.session_id });

                            if (!session.started && !session.end_time) {
                                const poll = new ListEmbed(session.name, session.description, [
                                    {
                                        name: 'Levels',
                                        value: session.levels,
                                        inline: true,
                                    },
                                    {
                                        name: 'Players',
                                        value: `${session.players}`,
                                        inline: true,
                                    },
                                    {
                                        name: 'Length',
                                        value: `${session.min_runtime}-${session.max_runtime} Hour(s)`,
                                        inline: true,
                                    },
                                    {
                                        name: 'Difficulty',
                                        value:
                                            session.difficulty === 1
                                                ? '1 - Easy'
                                                : session.difficulty === 2
                                                  ? '2 - Medium'
                                                  : session.difficulty === 3
                                                    ? '3 - Hard'
                                                    : '4 - Deadly',
                                    },
                                    {
                                        name: 'Channel',
                                        value: `<#${session.channel}>`,
                                    },
                                ])
                                    .setAuthor({ name: user.username, iconURL: user.avatarURL() })
                                    .setTimestamp(session.date);

                                await channel.send({
                                    content: `<@&${dbServer.sesh_ping}>`,
                                    embeds: [poll],
                                });

                                await interaction.reply({
                                    content: `Poll has been posted to <#${channel.id}>`,
                                    ephemeral: true,
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: 'You do not have a Session selected! Please select one first with `/session select`.',
                                ephemeral: true,
                            });
                        }
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'post':
                    const customReq = option.getString('requirement');

                    try {
                        if (gm.session_id) {
                            let session = await client.database.Server.sessions.getOne(server, user, { id: gm.session_id });

                            if (!session.started && !session.end_time) {
                                row1 = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder().setCustomId('join').setStyle(ButtonStyle.Success).setLabel('Join Game'),
                                    new ButtonBuilder().setCustomId('leave').setStyle(ButtonStyle.Danger).setLabel('Leave Game')
                                );

                                const post = new ListEmbed(session.name, session.description)
                                    .setAuthor({ name: user.username, iconURL: user.avatarURL() })
                                    .setTimestamp(session.date);

                                if (customReq) post.addFields({ name: 'Additonal Requirement', value: customReq });

                                msg = await channel.send({
                                    embeds: [post],
                                    components: [row1],
                                });

                                let filt = (m) => m.user.id != user.id;

                                const gamecol = msg.createMessageComponentCollector({ filt });

                                gamecol.on('collect', async (i) => {
                                    let player;
                                    session = await client.database.Server.sessions.getOne(server, user, { id: session.id });

                                    if (session.start_time) gamecol.stop();

                                    switch (i.customId) {
                                        case 'join':
                                            player = await client.database.User.getOne(i.user);

                                            if (!player.char_id) {
                                                await i.followUp({
                                                    content:
                                                        'You do not have a Character selected! Please select one first with `/character select`.',
                                                    ephemeral: true,
                                                });
                                            } else {
                                                embed = await this.joinSession(session, player);

                                                emph = embed.data.color === '#FF0000';

                                                await i.followUp({
                                                    embeds: [embed],
                                                    ephemeral: emph,
                                                });
                                            }
                                            break;
                                        case 'leave':
                                            player = await client.database.User.getOne(i.user);

                                            embed = await this.leaveSession(session, player);

                                            emph = embed.data.color === '#FF0000';

                                            await i.followUp({
                                                embeds: [embed],
                                                ephemeral: emph,
                                            });
                                            break;
                                    }
                                });

                                gamecol.on('end', async (collected) => {
                                    if (collected.size > 0) client.writeServerLog(server, `Collected ${collected.size} Interactions`);

                                    row1.components[0].setDisabled(true);
                                    row1.components[1].setDisabled(true);

                                    await msg.edit({
                                        content: `<@&${dbServer.sesh_ping}>`,
                                        embeds: [post],
                                        components: [row1],
                                    });
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: 'You do not have a Session selected! Please select one first with `/session select`.',
                                ephemeral: true,
                            });
                        }
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'begin':
                    try {
                        if (gm.session_id) {
                            const session = await client.database.Server.sessions.getOne(server, user, { id: gm.session_id });

                            if (!session.start_time && !session.end_time) {
                                await channel.send({
                                    content: 'The Session has started, please do not post any further applkications!',
                                });

                                session.start_time = moment().format('YYYY-MM-DD HH:mm:ss');

                                embed = await this.beginSession(server, user, session);

                                emph = embed.data.color === '#FF0000';

                                await interaction.reply({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            } else if (session.start_time) {
                                await interaction.reply({
                                    content: 'The Session has already started!',
                                    ephemeral: true,
                                });
                            } else if (session.end_time) {
                                await interaction.reply({
                                    content: 'The Session has already ended!',
                                    ephemeral: true,
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: 'You do not have a Session selected! Please select one first with `/session select`.',
                                ephemeral: true,
                            });
                        }
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
                case 'end':
                    try {
                        if (gm.session_id) {
                            const session = await client.database.Server.sessions.getOne(server, user, { id: gm.session_id });

                            if (session.start_time && !session.end_time) {
                                await channel.send({
                                    content: 'The Session has ended, thank you for playing!',
                                });

                                session.end_time = moment().format('YYYY-MM-DD HH:mm:ss');

                                embed = await this.endSession(server, user, session);

                                emph = embed.data.color === '#FF0000';

                                await interaction.reply({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            } else if (!session.start_time) {
                                await interaction.reply({
                                    content: 'The Session has not started yet!',
                                    ephemeral: true,
                                });
                            } else if (session.end_time) {
                                await interaction.reply({
                                    content: 'The Session has already ended!',
                                    ephemeral: true,
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: 'You do not have a Session selected! Please select one first with `/session select`.',
                                ephemeral: true,
                            });
                        }
                    } catch (err) {
                        client.logServerError(server, err);

                        if (err instanceof NotFoundError)
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, false)],
                                ephemeral: true,
                            });
                        else
                            await interaction.reply({
                                embeds: [new ErrorEmbed(err, true)],
                                ephemeral: true,
                            });
                    }
                    break;
            }
        }
    }

    async selectSession(server, user, session) {
        try {
            const msg = await client.database.Server.gms.setSession(server, user, session);

            return new SuccessEmbed('Success', msg);
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async createSession(server, user, session) {
        try {
            const msg = await client.database.Server.sessions.add(server, user, session);

            return new SuccessEmbed(msg || 'Success', 'Successfully created Session!');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async joinSession(session, player) {
        try {
            const msg = await client.database.Server.sessions.players.add(session, player, { id: player.char_id });

            return new SuccessEmbed(msg || 'Success', 'Successfully joined Session!');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async leaveSession(session, player) {
        try {
            const msg = await client.database.Server.sessions.players.remove(session, player);

            return new SuccessEmbed(msg || 'Success', 'Successfully left Session!');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async beginSession(server, user, session) {
        try {
            const msg = await client.database.Server.sessions.update(server, user, session);

            return new SuccessEmbed(msg || 'Success', 'Successfully started Session!');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async endSession(server, user, session) {
        try {
            const msg = await client.database.Server.sessions.update(server, user, session);

            return new SuccessEmbed(msg || 'Success', 'Successfully ended Session!');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'session',
    description: 'Session specific Commands',
    defaultMemberPermissions: [PermissionFlagsBits.MoveMembers],
    options: [
        {
            name: 'select',
            description: 'Select a Session',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'create',
            description: 'Create a Session',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Channel for the Session',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
            ],
        },
        {
            name: 'delete',
            description: 'Delete a Session',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'poll',
            description: 'Create a Poll for your Session',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'channel',
                    description: 'Channel for the Poll',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
            ],
        },
        {
            name: 'post',
            description: 'Posts Session Application to the Session Channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'requirement',
                    description: 'Custom Requirement for the Session',
                    type: ApplicationCommandOptionType.String,
                },
            ],
        },
        {
            name: 'begin',
            description: 'Begins a Session',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'end',
            description: 'Ends a Session',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
});

export { command };
