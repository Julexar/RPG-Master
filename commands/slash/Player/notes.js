import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { SuccessEmbed, ErrorEmbed, NoteEmbed } from '../../../custom/embeds';
import { NotFoundError, DuplicateError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        const server = interaction.guild;
        const option = interaction.options;
        const member = interaction.member;
        const user = member.user;
        const filter = (m) => m.user.id === user.id;
        let msg, menu, menus, rows, row, row1, row2, collector, count, num, page, emph, notes, embed;

        const private = option.getBoolean('private');

        switch (option.getSubcommandGroup()) {
            case 'view':
                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                );

                switch (option.getSubcommand()) {
                    case 'server':
                        try {
                            menu = new NoteEmbed('Server Notes List', 'Here is a List of your Server Notes:');
                            menus = [];
                            menus.push(menu);

                            count, num, (page = 0);

                            notes = await client.database.Server.notes.getAll(server, user);

                            for (const note of notes) {
                                if (count === 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }

                                const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                                menus[num].addFields({
                                    name: title,
                                    value: note.content,
                                });

                                count++;
                            }

                            msg = await interaction.reply({
                                embeds: [menus[page]],
                                components: [row],
                                ephemeral: private,
                            });

                            collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                            collector.on('collect', async (i) => {
                                await i.deferUpdate();

                                switch (i.customId) {
                                    case 'prev':
                                        if (page > 0) {
                                            page--;

                                            if (page === 0) {
                                                row.components[0].setDisabled(true);
                                                row.components[1].setDisabled(false);
                                            } else {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [menus[page]],
                                                components: [row],
                                                ephemeral: private,
                                            });
                                        }
                                        break;
                                    case 'next':
                                        if (page < menus.length - 1) {
                                            page++;

                                            if (page === menus.length - 1) {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(true);
                                            } else {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [menus[page]],
                                                components: [row],
                                                ephemeral: private,
                                            });
                                        }
                                        break;
                                }
                            });

                            collector.on('end', async (collected) => {
                                if (collected.size > 0) {
                                    client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                }

                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true);

                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: private,
                                });
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
                    case 'global':
                        try {
                            menu = new NoteEmbed('Global Notes List', 'Here is a List of your Global Notes:');
                            menus = [];
                            menus.push(menu);

                            count, num, (page = 0);

                            notes = await client.database.User.notes.getAll(user);

                            for (const note of notes) {
                                if (count === 9) {
                                    menus.push(menu);
                                    count = 0;
                                    num++;
                                }

                                const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                                menus[num].addFields({
                                    name: title,
                                    value: note.content,
                                });

                                count++;
                            }

                            msg = await interaction.reply({
                                embeds: [menus[page]],
                                components: [row],
                                ephemeral: private,
                            });

                            collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                            collector.on('collect', async (i) => {
                                await i.deferUpdate();

                                switch (i.customId) {
                                    case 'prev':
                                        if (page > 0) {
                                            page--;

                                            if (page === 0) {
                                                row.components[0].setDisabled(true);
                                                row.components[1].setDisabled(false);
                                            } else {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [menus[page]],
                                                components: [row],
                                                ephemeral: private,
                                            });
                                        }
                                        break;
                                    case 'next':
                                        if (page < menus.length - 1) {
                                            page++;

                                            if (page === menus.length - 1) {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(true);
                                            } else {
                                                row.components[0].setDisabled(false);
                                                row.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [menus[page]],
                                                components: [row],
                                                ephemeral: private,
                                            });
                                        }
                                        break;
                                }
                            });

                            collector.on('end', async (collected) => {
                                if (collected.size > 0) {
                                    client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                }

                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(true);

                                await msg.edit({
                                    embeds: [menus[page]],
                                    components: [row],
                                    ephemeral: private,
                                });
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
                }
                break;
            case 'add':
                let mes, mescol, mesfil;

                row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('title').setStyle(ButtonStyle.Primary).setLabel('Change Title').setEmoji('🔤'),
                    new ButtonBuilder().setCustomId('content').setStyle(ButtonStyle.Primary).setLabel('Change Content').setEmoji('📝'),
                    new ButtonBuilder().setCustomId('private').setStyle(ButtonStyle.Primary).setLabel('Toggle Privacy').setEmoji('🔁')
                );

                row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('finish').setStyle(ButtonStyle.Success).setLabel('Finish'),
                    new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                );

                switch (option.getSubcommand()) {
                    case 'server':
                        menu = new NoteEmbed('Note Creator', null, [
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
                            },
                        ]);

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row2],
                            ephemeral: Boolean(menu.data.fields[1].value),
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'title':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a new Title.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[0].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

                                            await msg.edit({
                                                embeds: [menu],
                                                components: [row1, row2],
                                                ephemeral: Boolean(menu.data.fields[1].value),
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'content':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with new Content.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[2].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

                                            await msg.edit({
                                                embeds: [menu],
                                                components: [row1, row2],
                                                ephemeral: Boolean(menu.data.fields[1].value),
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'private':
                                    await i.deferUpdate();

                                    menu.data.fields[1].value = !Boolean(menu.data.fields[1].value);

                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row1, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                    break;
                                case 'finish':
                                    const note = {
                                        title: menu.data.fields[0].value === ' ' ? null : menu.data.fields[0].value,
                                        content: menu.data.fields[2].value,
                                        private: Boolean(menu.data.fields[1].value),
                                    };

                                    embed = await this.addServerNote(server, note);

                                    emph = embed.data.color === '#FF0000';

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note creation has been cancelled.',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size > 0) {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            await msg.edit({
                                embeds: [menu],
                                components: [],
                                ephemeral: Boolean(menu.data.fields[1].value),
                            });
                        });
                        break;
                    case 'global':
                        menu = new NoteEmbed('Note Creator', null, [
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
                            },
                        ]);

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row2],
                            ephemeral: Boolean(menu.data.fields[1].value),
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'title':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a new Title.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[0].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

                                            await msg.edit({
                                                embeds: [menu],
                                                components: [row1, row2],
                                                ephemeral: Boolean(menu.data.fields[1].value),
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'content':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with new Content.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[2].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

                                            await msg.edit({
                                                embeds: [menu],
                                                components: [row1, row2],
                                                ephemeral: Boolean(menu.data.fields[1].value),
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                    break;
                                case 'private':
                                    await i.deferUpdate();

                                    menu.data.fields[1].value = !Boolean(menu.data.fields[1].value);

                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row1, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                    break;
                                case 'finish':
                                    const note = {
                                        title: menu.data.fields[0].value === ' ' ? null : menu.data.fields[0].value,
                                        content: menu.data.fields[2].value,
                                        private: Boolean(menu.data.fields[1].value),
                                    };

                                    embed = await this.addGlobalNote(user, note);

                                    emph = embed.data.color === '#FF0000';

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note creation has been cancelled.',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size > 0) {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            await msg.edit({
                                embeds: [menu],
                                components: [],
                                ephemeral: Boolean(menu.data.fields[1].value),
                            });
                        });
                        break;
                }
                break;
            case 'remove':
                row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('selnote').setPlaceholder('No Note selected...').setMinValues(1).setMaxValues(1)
                );

                row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                    new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                );

                rows.push(row);

                count, num, (page = 0);

                let notes;

                switch (option.getSubcommand()) {
                    case 'server':
                        notes = await client.database.Server.notes.getAll(server, user);

                        for (const note of notes) {
                            if (count === 24) {
                                rows.push(row);
                                count = 0;
                                num++;
                            }

                            const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                            rows[num].components[0].addOptions({
                                label: title,
                                value: `${note.id}`,
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Please select a Note to remove:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'selnote':
                                    mes = await i.deferReply();

                                    const note = await client.database.Server.notes.getOne(server, user, { id: Number(i.values[0]) });

                                    const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                                    embed = new EmbedBuilder()
                                        .setColor('#FFFF00')
                                        .setTitle(title)
                                        .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                        .setDescription(note.content)
                                        .setTimestamp();

                                    const row3 = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                                        new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                                    );

                                    await mes.edit({
                                        content: 'Are you sure you want to remove this Note?',
                                        embeds: [embed],
                                        components: [row3],
                                        ephemeral: note.private,
                                    });

                                    const col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1 });

                                    col.on('collect', async (j) => {
                                        const mes2 = await j.deferReply();
                                        switch (j.customId) {
                                            case 'confirm':
                                                let embed2 = await this.removeServerNote(server, user, note);

                                                emph = embed2.data.color === '#FF0000';

                                                await mes2.edit({
                                                    embeds: [embed2],
                                                    ephemeral: emph,
                                                });
                                                break;
                                            case 'cancel':
                                                await mes2.edit({
                                                    content: 'Note removal has been cancelled.',
                                                    embeds: [],
                                                    components: [],
                                                    ephemeral: true,
                                                });

                                                col.stop();
                                                break;
                                        }
                                    });

                                    col.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Confirmation collection timed out...',
                                                embeds: [],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
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
                                            content: 'Please select a Note to remove:',
                                            components: [rows[page], row2],
                                            ephemeral: true,
                                        });
                                    }
                                    break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(true);
                                        } else {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Please select a Note to remove:',
                                            components: [rows[page], row2],
                                            ephemeral: true,
                                        });
                                    }
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note removal has been cancelled.',
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
                                    content: 'Note selection timed out...',
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
                        break;
                    case 'global':
                        notes = await client.database.User.notes.getAll(user);

                        count, num, (page = 0);

                        for (const note of notes) {
                            if (count === 24) {
                                rows.push(row);
                                count = 0;
                                num++;
                            }

                            const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                            rows[num].components[0].addOptions({
                                label: title,
                                value: `${note.id}`,
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Please select a Note to remove:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'selnote':
                                    mes = await i.deferReply();

                                    const note = await client.database.User.notes.getOne(user, { id: Number(i.values[0]) });

                                    const title = note.title ? `${note.title} (#${note.id})` : `Note #${note.id}`;

                                    embed = new EmbedBuilder()
                                        .setColor('#FFFF00')
                                        .setTitle(title)
                                        .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                        .setDescription(note.content)
                                        .setTimestamp();

                                    const row3 = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder().setCustomId('confirm').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                                        new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                                    );

                                    await mes.edit({
                                        content: 'Are you sure you want to remove this Note?',
                                        embeds: [embed],
                                        components: [row3],
                                        ephemeral: note.private,
                                    });

                                    const col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1 });

                                    col.on('collect', async (j) => {
                                        const mes2 = await j.deferReply();
                                        switch (j.customId) {
                                            case 'confirm':
                                                let embed2 = await this.removeGlobalNote(user, note);

                                                emph = embed2.data.color === '#FF0000';

                                                await mes2.edit({
                                                    embeds: [embed2],
                                                    ephemeral: emph,
                                                });
                                                break;
                                            case 'cancel':
                                                await mes2.edit({
                                                    content: 'Note removal has been cancelled.',
                                                    embeds: [],
                                                    components: [],
                                                    ephemeral: true,
                                                });

                                                col.stop();
                                                break;
                                        }
                                    });

                                    col.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Confirmation collection timed out...',
                                                embeds: [],
                                                components: [],
                                                ephemeral: true,
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
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
                                            content: 'Please select a Note to remove:',
                                            components: [rows[page], row2],
                                            ephemeral: true,
                                        });
                                    }
                                    break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(true);
                                        } else {
                                            row2.components[0].setDisabled(false);
                                            row2.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Please select a Note to remove:',
                                            components: [rows[page], row2],
                                            ephemeral: true,
                                        });
                                    }
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note removal has been cancelled.',
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
                                    content: 'Note selection timed out...',
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
                        break;
                }
                break;
            case 'edit':
                const noteID = option.getNumber('id');

                menu = new NoteEmbed('Note Editor');

                let note;

                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('title').setStyle(ButtonStyle.Primary).setLabel('Change Title').setEmoji('🔤'),
                    new ButtonBuilder().setCustomId('content').setStyle(ButtonStyle.Primary).setLabel('Change Content').setEmoji('📝'),
                    new ButtonBuilder().setCustomId('private').setStyle(ButtonStyle.Primary).setLabel('Toggle Privacy').setEmoji('🔁')
                );

                row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('finish').setStyle(ButtonStyle.Success).setLabel('Finish'),
                    new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                );

                switch (option.getSubcommand()) {
                    case 'server':
                        note = await client.database.Server.notes.getOne(server, user, { id: noteID });

                        menu.addFields(
                            {
                                name: 'Title',
                                value: note.title || ' ',
                                inline: true,
                            },
                            {
                                name: 'Private?',
                                value: `${note.private}`,
                                inline: true,
                            },
                            {
                                name: 'Content',
                                value: note.content,
                            }
                        );

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row, row2],
                            ephemeral: Boolean(menu.data.fields[1].value),
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'title':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a new Title.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[0].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

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
                                    break;
                                case 'content':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with new Content.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[2].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

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
                                    break;
                                case 'private':
                                    await i.deferUpdate();

                                    menu.data.fields[1].value = !Boolean(menu.data.fields[1].value);

                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                    break;
                                case 'finish':
                                    const note = {
                                        title: menu.data.fields[0].value === ' ' ? null : menu.data.fields[0].value,
                                        content: menu.data.fields[2].value,
                                        private: Boolean(menu.data.fields[1].value),
                                    };

                                    embed = await this.editServerNote(server, note);

                                    emph = embed.data.color === '#FF0000';

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note editing has been cancelled.',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size > 0) {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            await msg.edit({
                                embeds: [menu],
                                components: [],
                                ephemeral: Boolean(menu.data.fields[1].value),
                            });
                        });
                        break;
                    case 'global':
                        note = await client.database.User.notes.getOne(user, { id: noteID });

                        menu.addFields(
                            {
                                name: 'Title',
                                value: note.title || ' ',
                                inline: true,
                            },
                            {
                                name: 'Private?',
                                value: `${note.private}`,
                                inline: true,
                            },
                            {
                                name: 'Content',
                                value: note.content,
                            }
                        );

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row, row2],
                            ephemeral: Boolean(menu.data.fields[1].value),
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async (i) => {
                            switch (i.customId) {
                                case 'title':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with a new Title.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[0].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

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
                                    break;
                                case 'content':
                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: 'Please reply with new Content.',
                                    });

                                    mesfil = (m) => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ mesfil, time: 35000, max: 1 });

                                    mescol.on('collect', async (j) => {
                                        menu.data.fields[2].value = j.content;
                                    });

                                    mescol.on('end', async (collected) => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Reply collection timed out...',
                                            });
                                        } else {
                                            client.writeServerLog(server, `Collected ${collected.size} reply`);

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
                                    break;
                                case 'private':
                                    await i.deferUpdate();

                                    menu.data.fields[1].value = !Boolean(menu.data.fields[1].value);

                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row, row2],
                                        ephemeral: Boolean(menu.data.fields[1].value),
                                    });
                                    break;
                                case 'finish':
                                    const note = {
                                        title: menu.data.fields[0].value === ' ' ? null : menu.data.fields[0].value,
                                        content: menu.data.fields[2].value,
                                        private: Boolean(menu.data.fields[1].value),
                                    };

                                    embed = await this.editGlobalNote(user, note);

                                    emph = embed.data.color === '#FF0000';

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph,
                                    });
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    await msg.edit({
                                        content: 'Note editing has been cancelled.',
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                    collector.stop();
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size > 0) {
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            await msg.edit({
                                embeds: [menu],
                                components: [],
                                ephemeral: Boolean(menu.data.fields[1].value),
                            });
                        });
                        break;
                }
                break;
        }
    }

    async addServerNote(server, user, note) {
        try {
            const msg = await client.database.Server.notes.add(server, user, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully added Server Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async addGlobalNote(user, note) {
        try {
            const msg = await client.database.User.notes.add(user, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully added Global Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async removeServerNote(server, user, note) {
        try {
            const msg = await client.database.Server.notes.remove(server, user, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully removed Server Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async removeGlobalNote(user, note) {
        try {
            const msg = await client.database.User.notes.remove(user, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully removed Global Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async editServerNote(server, note) {
        try {
            const msg = await client.database.Server.notes.update(server, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully edited Server Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async editGlobalNote(user, note) {
        try {
            const msg = await client.database.User.notes.update(user, note);

            return new SuccessEmbed(msg || 'Success', 'Successfully edited Global Note');
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'notes',
    description: 'Note related Commands',
    defaultMemberPermissions: [PermissionFlagsBits.SendMessages],
    options: [
        {
            name: 'view',
            description: 'Shows a List of your Notes',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'server',
                    description: 'Shows a List of your Server Notes',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'private',
                            description: 'When true, shows your private Notes',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: 'id',
                            description: 'The ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            required: false,
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: 'global',
                    description: 'Shows a List of your Global Notes',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'private',
                            description: 'When true, shows your private Notes',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: 'id',
                            description: 'The ID of the Note',
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
                    description: 'Adds a Server Note',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'global',
                    description: 'Adds a Global Note',
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
                    description: 'Removes a Server Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'The ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: 'global',
                    description: 'Removes a Global Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'The ID of the Note',
                            type: ApplicationCommandOptionType.Number,
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
                    description: 'Edits a Server Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'The ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                            required: true,
                        },
                        {
                            name: 'title',
                            description: 'The Title of the Note',
                            type: ApplicationCommandOptionType.String,
                        },
                        {
                            name: 'content',
                            description: 'The Content of the Note',
                            type: ApplicationCommandOptionType.String,
                        },
                    ],
                },
                {
                    name: 'global',
                    description: 'Edits a Global Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'The ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                            required: true,
                        },
                        {
                            name: 'title',
                            description: 'The Title of the Note',
                            type: ApplicationCommandOptionType.String,
                        },
                        {
                            name: 'content',
                            description: 'The Content of the Note',
                            type: ApplicationCommandOptionType.String,
                        },
                    ],
                },
            ],
        },
    ],
});

export { command };
