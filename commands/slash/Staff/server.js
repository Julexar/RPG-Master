import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, PermissionFlagsBits, StringSelectMenuBuilder } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import { client } from '../../..';
import { DuplicateError, NotFoundError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     *
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const guild = interaction.guild;
        const dbServer = await client.database.Server.getOne(guild);
        const server = {
            name: guild.name,
            id: dbServer.id,
            members: guild.members,
            roles: guild.roles,
            channels: guild.channels,
            dm_role: dbServer.dm_role,
            admin_role: dbServer.admin_role,
            mod_role: dbServer.mod_role,
            dup_sessions: dbServer.dup_sessions,
            sesh_ping: dbServer.sesh_ping,
            gm_edit: dbServer.gm_edit,
            hp_method: dbServer.hp_method,
            log_chan: dbServer.log_chan,
            print_logs: dbServer.print_logs,
        };
        let embed, emph;

        switch (option.getSubcommandGroup()) {
            case 'gm':
                const gmRole = await server.roles.cache.get(server.dm_role);
                const user = option.getUser('user');
                let gms, row1, msg, collector;
                let count,
                    num,
                    page = 0;
                const filter = m => m.user.id === interaction.user.id;

                switch (option.getSubcommand()) {
                    case 'add':
                        embed = await addGM(server, user, gmRole);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                        break;
                    case 'remove':
                        gms = await client.database.Server.gms.getAll(server);

                        const rows = [];

                        row1 = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder().setCustomId('gmsel').setMaxValues(1).setPlaceholder('No GM selected...')
                        );

                        const row2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        );

                        rows.push(row1);

                        for (const gm of gms) {
                            if (count === 24) {
                                rows.push(row1);
                                num++;
                                count = 0;
                            }

                            const dm = await server.members.cache.get(gm.user_id);

                            rows[num].components[0].addOptions({
                                label: `${dm.username}`,
                                value: `${dm.id}`,
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Select a GM:',
                            components: [rows[page], row2],
                            ephemeral: true,
                        });

                        collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'gmsel':
                                    embed = await remGM(server, { id: Number(i.values[0]), gmRole });

                                    const reply = await i.deferReply();

                                    await reply.edit({
                                        embeds: [embed],
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
                                            content: 'Select a GM:',
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
                                            content: 'Select a GM:',
                                            components: [rows[page], row2],
                                            ephemeral: true,
                                        });
                                    }
                                    break;
                                case 'cancel':
                                    await i.deferUpdate();

                                    collector.stop();
                                    break;
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
                                client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                        break;
                    case 'list':
                        try {
                            gms = await client.database.Server.gms.getAll(server);

                            const embeds = [];

                            row1 = new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                                new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                            );

                            count, num, (page = 0);

                            const emb = new ListEmbed('GM List', '', null);

                            embeds.push(emb);

                            for (const gm of gms) {
                                if (count === 24) {
                                    embeds.push(emb);
                                    num++;
                                    count = 0;
                                }

                                embeds[num].data.description += `<@${gm.user_id}>\n`;
                                count++;
                            }

                            msg = await interaction.reply({
                                embeds: [embeds[page]],
                                components: [row1],
                            });

                            collector = msg.createMessageComponentCollector({
                                filter,
                                time: 90000,
                            });

                            collector.on('collect', async i => {
                                await i.deferUpdate();

                                switch (i.customId) {
                                    case 'prev':
                                        if (page > 0) {
                                            page--;

                                            if (page === 0) {
                                                row1.components[0].setDisabled(true);
                                                row1.components[1].setDisabled(false);
                                            } else {
                                                row1.components[0].setDisabled(false);
                                                row1.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [embeds[page]],
                                                components: [row1],
                                            });
                                        }
                                        break;
                                    case 'next':
                                        if (page < embeds.length - 1) {
                                            page++;

                                            if (page === embeds.length - 1) {
                                                row1.components[0].setDisabled(false);
                                                row1.components[1].setDisabled(true);
                                            } else {
                                                row1.components[0].setDisabled(false);
                                                row1.components[1].setDisabled(false);
                                            }

                                            await msg.edit({
                                                embeds: [embeds[page]],
                                                components: [row1],
                                            });
                                        }
                                        break;
                                }
                            });

                            collector.on('end', async collected => {
                                if (collected.size > 0) {
                                    client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                                }

                                row1.components[0].setDisabled(true);
                                row1.components[1].setDisabled(true);

                                await msg.edit({
                                    embeds: [embeds[page]],
                                    components: [row1],
                                });
                            });
                        } catch (err) {
                            client.writeServerLog(server, err);

                            if (err instanceof NotFoundError) {
                                await interaction.reply({
                                    embeds: [new ErrorEmbed(`${err}`, `${err.cause}`)],
                                    ephemeral: true,
                                });
                            } else {
                                await interaction.reply({
                                    embeds: [new ErrorEmbed('An Error occurred...', `${err}\n${err.cause}`)],
                                    ephemeral: true,
                                });
                            }
                        }
                        break;
                    case 'can-edit':
                        const bool = option.getBoolean('bool');

                        embed = await setGMEdit(server, bool);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                        break;
                }
                break;
            case 'setrole':
                let role1, role2;

                switch (option.getSubcommand()) {
                    case 'gm':
                        role1 = option.getRole('role');

                        embed = await setRole(server, 'gm', role1, null);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                    default:
                        role1 = option.getRole('admin');
                        role2 = option.getRole('mod');

                        embed = await setRole(server, 'staff', role1, role2);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                }
                break;
            case 'getrole':
                switch (option.getSubcommand()) {
                    case 'gm':
                        embed = await getRole(server, 'gm');

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                    default:
                        embed = await getRole(server, 'staff');

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                }
                break;
            case 'setchannel':
                const channel = option.getChannel('channel');

                switch (option.getSubcommand()) {
                    case 'summary':
                        embed = await setSumChan(server, channel);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                    case 'log':
                        embed = await setLogChan(server, channel);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            emphemeral: emph,
                        });
                        break;
                }
                break;
        }

        const bool = option.getBoolean('bool');

        switch (option.getSubcommand()) {
            case 'dup-sessions':
                embed = await setDupSessions(server, bool);

                emph = embed.data.color === '#ff0000';

                await interaction.reply({
                    embeds: [embed],
                    emphemeral: emph,
                });
                break;
            case 'print-logs':
                embed = await toggleLogs(server, bool);

                emph = embed.data.color === '#ff0000';

                await interaction.reply({
                    embeds: [embed],
                    emphemeral: emph,
                });
                break;
        }
    }
}

async function addGM(server, user, role) {
    try {
        const msg = await client.database.Server.gms.add(server, user);

        const member = await server.members.cache.get(user.id);

        await member.roles.add(role);

        client.writeServerLog(server, msg);
        return new SuccessEmbed(msg || 'Success', `<@${user.id}> has been registered as a GM!`);
    } catch (err) {
        client.logServerError(server, err);

        if (err instanceof DuplicateError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function remGM(server, user, role) {
    try {
        const msg = await client.database.Server.gms.remove(server, user);

        const member = await server.members.cache.get(user.id);

        await member.roles.remove(role);

        return new SuccessEmbed(msg || 'Success', `<@${user.id}> has been unregistered as a GM!`);
    } catch (err) {
        client.logServerError(server, err);

        if (err instanceof NotFoundError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function setGMEdit(server, bool) {
    try {
        const msg = await client.database.Server.setGMEdit(server, bool);
        const option = bool ? 'enabled' : 'disabled';

        return new SuccessEmbed(msg || 'Success', `The Ability for GMs to edit Rules, create custom Assets etc has been ${option}!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setRole(server, type, role1, role2) {
    try {
        switch (type) {
            case 'gm':
                return await setDMRole(server, role1);
            default:
                return await setStaffRole(server, role1, role2);
        }
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setDMRole(server, role) {
    try {
        const msg = await client.database.Server.setDMRole(server, role);

        return new SuccessEmbed(msg || 'Success', `DM Role has been set to <@&${role.id}>!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setStaffRole(server, role1, role2) {
    try {
        const msg1 = await client.database.Server.setStaffRole(server, 'admin', role1);
        const msg2 = await client.database.Server.setStaffRole(server, 'mod', role2);

        const message =
            msg1 && msg2 ? `Staff Roles have been set to <@&${role1.id}> and <@&${role2.id}>!`
            : msg1 ? msg1
            : msg2;

        return new SuccessEmbed('Success', message);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function getRole(server, type) {
    try {
        switch (type) {
            case 'gm':
                return await getDMRole(server);
            default:
                return await getStaffRole(server);
        }
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function getDMRole(server) {
    try {
        const roleID = client.database.Server.getDMRole(server);
        const role = await server.roles.cache.get(roleID);

        return new ListEmbed('DM Role', `This Server\'s DM Role is: <@&${role.id}>`, null);
    } catch (err) {
        if (err instanceof NotFoundError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function getStaffRole(server) {
    try {
        const adminId = client.database.Server.getStaffRole(server, 'admin').admin_role;
        const modId = client.database.Server.getStaffRole(server, 'mod').mod_role;
        const adminRole = await server.roles.cache.get(adminId);
        const modRole = await server.roles.cache.get(modId);

        return new ListEmbed('Staff Roles', "This Server's Staff Roles are:", [
            {
                name: 'Admin Role',
                value: `<@&${adminRole.id}>`,
            },
            {
                name: 'Moderator Role',
                value: `<@&${modRole.id}>`,
            },
        ]);
    } catch (err) {
        if (err instanceof NotFoundError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function setSumChan(server, channel) {
    try {
        const msg = await client.database.Server.setSumChannel(server, channel);

        return new SuccessEmbed(msg || 'Success', `Summary Channel for Sessions has been set to <#${channel.id}>`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setLogChan(server, channel) {
    try {
        const msg = await client.database.Server.setLogChannel(server, channel);

        return new SuccessEmbed(msg || 'Success', `Log Channel has been set to <#${channel.id}>`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setDupSessions(server, bool) {
    try {
        const msg = await client.database.Server.setDupSessions(server, bool);

        const action = bool ? 'enabled' : 'disabled';

        return new SuccessEmbed(msg || 'Success', `The creation of duplicate Sessions has been ${action}!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function toggleLogs(server, bool) {
    try {
        const msg = await client.database.Server.toggleLogs(server, bool);

        const action = bool ? 'enabled' : 'disabled';

        return new SuccessEmbed(msg || 'Success', `The printing of Logs in the Log Channel has been ${action}!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

const command = new Command({
    name: 'server',
    description: 'Server specific Commands',
    defaultMemberPermissions: [PermissionFlagsBits.ManageGuild],
    options: [
        {
            name: 'gm',
            description: 'GM related Commands',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'add',
                    description: 'Adds a GM',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'Provide a User',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'Removes a GM',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'list',
                    description: 'Shows a List of all GMs',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'can-edit',
                    description: 'Sets whether GMs can edit Game assets',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'bool',
                            description: 'Provide a Boolean',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'setrole',
            description: 'Sets a Server Role',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'gm',
                    description: 'Sets the GM Role',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'role',
                            description: 'Provide a Role',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'staff',
                    description: 'Sets the Staff Roles',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'admin',
                            description: 'Provide the Administrator Role',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                        {
                            name: 'mod',
                            description: 'Provide the Moderator Role',
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'getrole',
            description: 'Gets Server Roles',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'gm',
                    description: 'Gets the GM Role',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'staff',
                    description: 'Gets the Staff Roles',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: 'setchannel',
            description: 'Sets serverwide Channels',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'summary',
                    description: 'Sets Session Summary Channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'Provide a Channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'log',
                    description: 'Sets the Log Channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'Provide a Channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'dup-sessions',
            description: 'Sets whether duplicate Sessions can be created',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'bool',
                    description: 'Provide a Boolean',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true,
                },
            ],
        },
        {
            name: 'print-logs',
            description: 'Sets whether Logs should be posted Daily',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'bool',
                    description: 'Provide a Boolean',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true,
                },
            ],
        },
    ],
});

export { command };
