import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ApplicationCommandPermissionType,
    ChannelSelectMenuBuilder,
    ChannelType,
    RoleSelectMenuBuilder,
    UserSelectMenuBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import { NotFoundError } from '../../../custom/errors';
const cmds = [];

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
        this.server = null;
    }

    /**
     *
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const filter = m => m.user.id === user.id;
        let embed, emph, row, msg, collector;

        const cmd = {
            id: Number(option.getString('command')),
        };

        switch (option.getSubcommand()) {
            case 'toggle':
                if (option.getSubcommandGroup() === 'restriction') {
                    embed = await this.toggleRestriction(this.server, cmd);

                    emph = embed.data.color === '#FF0000';

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: emph,
                    });
                } else {
                    embed = await this.toggleCommand(this.server, cmd);

                    emph = embed.data.color === '#FF0000';

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: emph,
                    });
                }
                break;
            case 'add':
                switch (option.getString('type')) {
                    case 'user':
                        row = new ActionRowBuilder().addComponents(
                            new UserSelectMenuBuilder().setCustomId('usersel').setPlaceholder('No User selected...').setMinValues(1).setMaxValues(1)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a User:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'usersel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.User,
                                    permission: option.getBoolean('permitted'),
                                };

                                embed = await this.addRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                    case 'role':
                        row = new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder().setCustomId('rolesel').setPlaceholder('No Role selected...').setMinValues(1).setMaxValues(1)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a Role:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'rolesel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.Role,
                                    permission: option.getBoolean('permitted'),
                                };

                                embed = await this.addRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                    case 'channel':
                        row = new ActionRowBuilder().addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId('channelsel')
                                .setPlaceholder('No Channel selected...')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildDirectory)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a Channel:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'channelsel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.Role,
                                    permission: option.getBoolean('permitted'),
                                };

                                embed = await this.addRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                }
                break;
            case 'remove':
                switch (option.getString('type')) {
                    case 'user':
                        row = new ActionRowBuilder().addComponents(
                            new UserSelectMenuBuilder().setCustomId('usersel').setPlaceholder('No User selected...').setMinValues(1).setMaxValues(1)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a User:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'usersel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.User,
                                };

                                embed = await this.removeRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                    case 'role':
                        row = new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder().setCustomId('rolesel').setPlaceholder('No Role selected...').setMinValues(1).setMaxValues(1)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a Role:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'rolesel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.Role,
                                };

                                embed = await this.removeRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                    case 'channel':
                        row = new ActionRowBuilder().addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId('channelsel')
                                .setPlaceholder('No Channel selected...')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildDirectory)
                        );

                        msg = await interaction.reply({
                            content: 'Please select a Channel:',
                            components: [row],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            if (i.customId === 'channelsel') {
                                const rest = {
                                    id: Number(i.values[0]),
                                    type: ApplicationCommandPermissionType.Channel,
                                };

                                embed = await this.removeRestriction(this.server, cmd, rest);

                                emph = embed.data.color === '#FF0000';

                                let mes = await i.deferReply();
                                await mes.edit({
                                    embeds: [embed],
                                    ephemeral: emph,
                                });
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    components: [],
                                    ephemeral: true,
                                });
                            } else {
                                client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                }
                break;
            case 'list':
                embed = new ListEmbed('Command Restrictions', 'Here is a list of all Restrictions of the Command:', []);
                const embeds = [];
                embeds.push(row);

                const restrictions = await client.database.Server.commands.restrictions.getAll(cmd);

                let count,
                    num,
                    page = 0;

                for (const restriction of restrictions) {
                    if (count === 24) {
                        embeds.push(row);
                        count = 0;
                        num++;
                    }

                    let perm = restriction.permission ? 'permitted' : 'denied';
                    let rest =
                        restriction.type === ApplicationCommandPermissionType.User ? `<@${restriction.id}>`
                        : restriction.type === ApplicationCommandPermissionType.Role ? `<@&${restriction.id}>`
                        : `<#${restriction.id}>`;

                    embeds[num].components[0].addFields({
                        name: `${rest}`,
                        value: `${perm}`,
                    });

                    count++;
                }

                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                );

                msg = await interaction.reply({
                    embeds: [embeds[page]],
                    components: [row2],
                });

                collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                collector.on('collect', async i => {
                    if (i.customId === 'next') {
                        await i.deferUpdate();
                        if (page < embeds.length - 1) {
                            page++;

                            if (page === embeds.length - 1) {
                                row2.components[1].setDisabled(true);
                                row2.components[0].setDisabled(false);
                            } else {
                                row2.components[0].setDisabled(false);
                                row2.components[1].setDisabled(false);
                            }

                            await msg.edit({
                                embeds: [embeds[page]],
                                components: [row2],
                            });
                        }
                    } else if (i.customId === 'prev') {
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
                                embeds: [embeds[page]],
                                components: [row2],
                            });
                        }
                    }
                });

                collector.on('end', async collected => {
                    if (collected.size > 0) {
                        client.writeServerLog(this.server, `Collected ${collected.size} Interactions`);
                    }

                    row2.components[0].setDisabled(true);
                    row2.components[1].setDisabled(true);

                    await msg.edit({
                        embeds: [embeds[page]],
                        components: [row2],
                    });
                });
                break;
        }
    }

    /**
     *
     * @param {import('discord.js').Guild} guild
     */
    setServer(guild) {
        this.server = guild;
        this.setChoices();
    }

    setChoices() {
        this.server.commands.cache.forEach(cmd => {
            cmds.push(cmd);
        });
    }

    async toggleCommand(server, command) {
        try {
            const msg = await client.database.Server.commands.toggle(server, command);
            client.writeServerLog(server, msg);

            const action = command.enabled ? 'disabled' : 'enabled';

            return new SuccessEmbed(msg || 'Success', `Successfully ${action} the Command \`/${command.name}\``);
        } catch (err) {
            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async toggleRestriction(server, command) {
        try {
            const msg = await client.database.Server.commands.restrictions.toggle(command);
            client.writeServerLog(server, msg);

            const action = command.enabled ? 'disabled' : 'enabled';

            return new SuccessEmbed(msg || 'Success', `Successfully ${action} the Restrictions of the Command \`/${command.name}\``);
        } catch (err) {
            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async addRestriction(server, command, restriction) {
        try {
            const msg = await client.database.Server.commands.restrictions.add(command, restriction);
            client.writeServerLog(server, msg);

            await this.server.commands.permissions.add({
                command: command.id,
                token: client.config.token,
                permissions: [restriction],
            });

            return new SuccessEmbed(msg || 'Success', `Successfully added the Restriction to the Command \`/${command.name}\``);
        } catch (err) {
            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }

    async removeRestriction(server, command, restriction) {
        try {
            const msg = await client.database.Server.commands.restrictions.remove(command, restriction);
            client.writeServerLog(server, msg);

            switch (restriction.type) {
                case ApplicationCommandPermissionType.User:
                    await this.server.commands.permissions.remove({
                        command: command.id,
                        token: client.config.token,
                        users: restriction.id,
                    });
                    break;
                case ApplicationCommandPermissionType.Role:
                    await this.server.commands.permissions.remove({
                        command: command.id,
                        token: client.config.token,
                        roles: restriction.id,
                    });
                    break;
                case ApplicationCommandPermissionType.Channel:
                    await this.server.commands.permissions.remove({
                        command: command.id,
                        token: client.config.token,
                        channels: restriction.id,
                    });
                    break;
            }

            return new SuccessEmbed(msg || 'Success', `Successfully removed the Restriction from the Command \`/${command.name}\``);
        } catch (err) {
            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'command',
    description: 'Command Settings',
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'toggle',
            description: 'Toggles a Command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'Choose a Command',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: cmds.map(cmd => ({ name: cmd.name, value: `${cmd.id}` })),
                },
            ],
        },
        {
            name: 'restriction',
            descriuption: 'Restriction Settings',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'toggle',
                    description: 'Toggles the Restriction of a Command',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'command',
                            description: 'Choose a Command',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: cmds.map(cmd => ({ name: cmd.name, value: `${cmd.id}` })),
                        },
                    ],
                },
                {
                    name: 'add',
                    description: 'Adds a Restriction to a Command',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'command',
                            description: 'Choose a Command',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: cmds.map(cmd => ({ name: cmd.name, value: `${cmd.id}` })),
                        },
                        {
                            name: 'type',
                            description: 'Choose a Type',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                { name: 'Role', value: 'role' },
                                { name: 'User', value: 'user' },
                                { name: 'Channel', value: 'channel' },
                            ],
                        },
                        {
                            name: 'permitted',
                            description: 'Provide a Boolean',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'Removes a Restriction from a Command',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'command',
                            description: 'Choose a Command',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: cmds.map(cmd => ({ name: cmd.name, value: `${cmd.id}` })),
                        },
                        {
                            name: 'type',
                            description: 'Choose a Type',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                { name: 'Role', value: 'role' },
                                { name: 'User', value: 'user' },
                                { name: 'Channel', value: 'channel' },
                            ],
                        },
                    ],
                },
                {
                    name: 'list',
                    description: 'Lists all Restrictions of a Command',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'command',
                            description: 'Choose a Command',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: cmds.map(cmd => ({ name: cmd.name, value: `${cmd.id}` })),
                        },
                    ],
                },
            ],
        },
    ],
});

export { command };
