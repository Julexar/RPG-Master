import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import { ForbiddenError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.args = true;
        this.optional = true;
        this.usage = ['--<command>'];
    }

    /**
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     */
    async run(message, args) {
        const server = message.guild;
        const member = message.member;
        const filter = (m) => m.user.id === message.author.id;

        if (!args[0]) {
            const embeds = [];
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
            );

            const menu = new ListEmbed('Slash Command List');

            let count,
                num,
                page = 0;

            embeds.push(menu);

            server.commands.cache.forEach((cmd) => {
                if (cmd.defaultMemberPermissions && member.permissions.has(cmd.defaultMemberPermissions)) {
                    if (count === 9) {
                        embeds.push(menu);
                        count = 0;
                        num++;
                    }

                    embeds[num].addFields({
                        name: `</${cmd.name}:${cmd.id}>`,
                        value: cmd.description,
                    });

                    count++;
                } else if (!cmd.defaultMemberPermissions) {
                    if (count === 9) {
                        embeds.push(menu);
                        count = 0;
                        num++;
                    }

                    embeds[num].addFields({
                        name: `</${cmd.name}:${cmd.id}>`,
                        value: cmd.description,
                    });

                    count++;
                }
            });

            const msg = await message.reply({
                embeds: [embeds[page]],
                components: [row],
            });

            const collector = msg.createMessageComponentCollector({ filter, time: 90000 });

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
                                embeds: [embeds[page]],
                                components: [row],
                            });
                        }
                        break;
                    case 'next':
                        if (page < embeds.length - 1) {
                            page++;

                            if (page === embeds.length - 1) {
                                row.components[0].setDisabled(false);
                                row.components[1].setDisabled(true);
                            } else {
                                row.components[0].setDisabled(false);
                                row.components[1].setDisabled(false);
                            }

                            await msg.edit({
                                embeds: [embeds[page]],
                                components: [row],
                            });
                        }
                        break;
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size > 0) client.writeServerLog(server, `Collected ${collected.size} Interactions`);

                row.components[0].setDisabled(true);
                row.components[1].setDisabled(true);

                await msg.edit({
                    embeds: [embeds[page]],
                    components: [row],
                });
            });
        } else {
            const command = await server.commands.cache.get((c) => c.name === args[0]);

            const embed = new ListEmbed();

            if (command.defaultMemberPermissions) {
                if (member.permissions.has(command.defaultMemberPermissions)) {
                    if (!command.options) {
                        embed.setTitle(`</${command.name}:${command.id}>`).setDescription(command.description);

                        await message.reply({
                            embeds: [embed],
                        });
                    } else {
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                        );

                        embed.setTitle(`</${command.name}:${command.id}>`).setDescription(command.description);

                        const menus = [];
                        let count,
                            num,
                            page = 0;

                        menus.push(embed);

                        for (const option of command.options) {
                            if (count === 9) {
                                menus.push(embed);
                                count = 0;
                                num++;
                            }

                            switch (option.type) {
                                case ApplicationCommandOptionType.SubcommandGroup:
                                    for (const option2 of option.options) {
                                        menus[num].addFields({
                                            name: `</${command.name} ${option.name} ${option2.name}:${command.id}>`,
                                            value: option2.description,
                                        });

                                        count++;
                                    }
                                    break;
                                case ApplicationCommandOptionType.Subcommand:
                                    menus[num].addFields({
                                        name: `</${command.name} ${option.name}:${command.id}>`,
                                        value: option.description,
                                    });

                                    count++;
                                    break;
                            }
                        }

                        const msg = await message.reply({
                            embeds: [menus[page]],
                            components: [row],
                        });

                        const collector = msg.createMessageComponentCollector({ filter, time: 90000 });

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
                                        });
                                    }
                                    break;
                            }
                        });

                        collector.on('end', async (collected) => {
                            if (collected.size > 0) client.writeServerLog(server, `Collected ${collected.size} Interactions`);

                            row.components[0].setDisabled(true);
                            row.components[1].setDisabled(true);

                            await msg.edit({
                                embeds: [menus[page]],
                                components: [row],
                            });
                        });
                    }
                } else {
                    const perms = member.permissions.missing(command.defaultMemberPermissions);

                    const err = new ForbiddenError('Missing Permissions', `You are missing the following Permissions: ${perms.join(', ')}`);
                    client.logServerError(server, err);

                    await message.reply({
                        embeds: [new ErrorEmbed(err, false)],
                        ephemeral: true,
                    });
                }
            } else {
                embed.setTitle(`</${command.name}:${command.id}>`).setDescription(command.description);

                if (!command.options) {
                    await message.reply({
                        embeds: [embed],
                    });
                } else {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                        new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                    );

                    const menus = [];

                    let count,
                        num,
                        page = 0;

                    menus.push(embed);

                    for (const option of command.options) {
                        if (count === 9) {
                            menus.push(embed);
                            count = 0;
                            num++;
                        }

                        switch (option.type) {
                            case ApplicationCommandOptionType.SubcommandGroup:
                                for (const option2 of option.options) {
                                    menus[num].addFields({
                                        name: `</${command.name} ${option.name} ${option2.name}:${command.id}>`,
                                        value: option2.description,
                                    });

                                    count++;
                                }
                                break;
                            case ApplicationCommandOptionType.Subcommand:
                                menus[num].addFields({
                                    name: `</${command.name} ${option.name}:${command.id}>`,
                                    value: option.description,
                                });

                                count++;
                                break;
                        }
                    }

                    const msg = await message.reply({
                        embeds: [menus[page]],
                        components: [row],
                    });

                    const collector = msg.createMessageComponentCollector({ filter, time: 90000 });

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
                                    });
                                }
                                break;
                        }
                    });

                    collector.on('end', async (collected) => {
                        if (collected.size > 0) client.writeServerLog(server, `Collected ${collected.size} Interactions`);

                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(true);

                        await msg.edit({
                            embeds: [menus[page]],
                            components: [row],
                        });
                    });
                }
            }
        }
    }
}

const command = new Command({
    name: 'help',
    description: 'Displays Info about Commands',
});

export default new Command();
