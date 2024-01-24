import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { ListEmbed, ErrorEmbed } from '../../../custom/embeds';
import { ForbiddenError } from '../../../custom/errors';
let cmds;

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
        this.choices = true;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const cmd = option.getString('command');
        const member = interaction.member;
        const user = member.user;
        const server = interaction.guild;
        const filter = (m) => m.user.id === user.id;

        if (cmd) {
            const slashCmd = await server.commands.fetch(cmd);
            const embed = new ListEmbed();

            if (slashCmd.defaultMemberPermissions) {
                if (member.permissions.has(slashCmd.defaultMemberPermissions)) {
                    if (!slashCmd.options) {
                        embed.setTitle(`</${slashCmd.name}:${slashCmd.id}>`).setDescription(slashCmd.description);

                        await interaction.reply({ embeds: [embed] });
                    } else {
                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                        );

                        embed.setTitle(`</${slashCmd.name}:${slashCmd.id}>`).setDescription(slashCmd.description);

                        const menus = [];
                        let num,
                            count,
                            page = 0;

                        menus.push(embed);

                        for (const option of slashCmd.options) {
                            if (count === 9) {
                                menus.push(embed);
                                count = 0;
                                num++;
                            }

                            if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                                for (const option2 of option.options) {
                                    if (option2.type === ApplicationCommandOptionType.Subcommand) {
                                        menus[num].addFields({
                                            name: `</${slashCmd.name} ${option.name} ${option2.name}:${slashCmd.id}>`,
                                            value: option2.description,
                                        });
                                        count++;
                                    }
                                }
                            } else if (option.type === ApplicationCommandOptionType.Subcommand) {
                                menus[num].addFields({
                                    name: `</${slashCmd.name} ${option.name}:${slashCmd.id}>`,
                                    value: option.description,
                                });
                                count++;
                            } else {
                                menus[num].addFields({
                                    name: `</${slashCmd.name}:${slashCmd.id}>`,
                                    value: slashCmd.description,
                                });
                                count++;
                            }
                        }

                        const msg = await interaction.reply({
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
                    const perms = member.permissions.missing(slashCmd.defaultMemberPermissions);

                    const err = new ForbiddenError(`You are missing the following Permissions to view this Command:\n ${perms.join(', ')}`);

                    client.logServerError(server, err);

                    await interaction.reply({
                        embeds: [new ErrorEmbed(err, false)],
                        ephemeral: true,
                    });
                }
            } else {
                embed.setTitle(`</${slashCmd.name}:${slashCmd.id}>`).setDescription(slashCmd.description);

                if (!slashCmd.options) {
                    await interaction.reply({ embeds: [embed] });
                } else {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                        new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                    );

                    const menus = [];
                    let num,
                        count,
                        page = 0;

                    menus.push(embed);

                    for (const option of slashCmd.options) {
                        if (count === 9) {
                            menus.push(embed);
                            count = 0;
                            num++;
                        }

                        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                            for (const option2 of option.options) {
                                if (option2.type === ApplicationCommandOptionType.Subcommand) {
                                    menus[num].addFields({
                                        name: `</${slashCmd.name} ${option.name} ${option2.name}:${slashCmd.id}>`,
                                        value: option2.description,
                                    });
                                    count++;
                                }
                            }
                        } else if (option.type === ApplicationCommandOptionType.Subcommand) {
                            menus[num].addFields({
                                name: `</${slashCmd.name} ${option.name}:${slashCmd.id}>`,
                                value: option.description,
                            });
                            count++;
                        } else {
                            menus[num].addFields({
                                name: `</${slashCmd.name}:${slashCmd.id}>`,
                                value: slashCmd.description,
                            });
                            count++;
                        }
                    }

                    const msg = await interaction.reply({
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
        } else {
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

            const msg = await interaction.reply({
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
        }
    }

    /**
     * @param {import('discord.js').Guild} guild
     */
    setChoices(guild) {
        cmds = guild.commands.cache.map((cmd) => ({ name: cmd.name, value: `${cmd.id}` }));
    }
}

const command = new Command({
    name: 'help',
    description: 'Displays Info about Commands',
    options: [
        {
            name: 'command',
            description: 'Select a Command',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: cmds,
        },
    ],
});

export { command };
