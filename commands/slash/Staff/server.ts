import { ActionRow, ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, CommandInteractionOptionResolver, Embed, EmbedBuilder, Guild, GuildMember, PermissionFlagsBits, Role, StringSelectMenuBuilder, TextChannel, User } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import { client } from '../../..';
import { DuplicateError, NotFoundError } from '../../../custom/errors';

class Command extends CommandBuilder {
    enabled: boolean;
    constructor(data: any) {
        super(data);

        this.enabled = true;
    }

    async run(interaction: CommandInteraction) {
        const option = interaction.options as CommandInteractionOptionResolver;
        const guild = interaction.guild as Guild;
        const dbServer = await client.database.Server.getOne(guild);
        const server = {
            name: guild.name,
            id: dbServer.id,
            members: guild.members,
            roles: guild.roles,
            channels: guild.channels,
            gm_roleid: dbServer.gm_roleid,
            admin_roleid: dbServer.admin_roleid,
            mod_roleid: dbServer.mod_roleid,
            dup_sessions: dbServer.duplicate_sessions,
            sesh_ping: dbServer.ping_roleid,
            gm_edit: dbServer.gm_edit,
            hp_method: dbServer.hp_method,
            log_chan: dbServer.log_channelid,
            print_logs: dbServer.print_logs
        };

        let embed: any, emph: boolean;

        switch (option.getSubcommandGroup()) {
            case 'gm':
                const gmRole = server.roles.cache.get(String(server.gm_roleid)) as Role;
                const user = option.getUser('user') as User;
                let gms, row1, msg, collector;
                let count, num, page = 0;
                const filter = m => m.user.id === interaction.user.id;

                switch (option.getSubcommand()) {
                    case 'add':
                        embed = await addGM(guild, user, gmRole);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                        break;
                    case 'remove':
                        gms = await client.database.Server.gms.getAll(guild);

                        const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

                        row1 = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder().setCustomId('gmsel').setMaxValues(1).setPlaceholder('No GM selected...')
                        );

                        const row2: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
                        ) as ActionRowBuilder<ButtonBuilder>;

                        rows.push(row1);

                        for (const gm of gms) {
                            if (count === 24) {
                                rows.push(row1);
                                num++;
                                count = 0;
                            }

                            const dm = server.members.cache.get(gm.user_id) as GuildMember;

                            rows[num].components[0].addOptions({
                                label: `${dm.user.username}`,
                                value: `${dm.user.id}`,
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
                                    const user = client.users.cache.get(i.values[0]) as User;
                                    embed = await remGM(guild, user, gmRole);

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
                                await client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    break;
                    case 'list':
                        try {
                            gms = await client.database.Server.gms.getAll(guild);

                            const embeds: EmbedBuilder[] = [];

                            row1 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                                new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩')
                            ) as ActionRowBuilder<ButtonBuilder>;

                            count = 0;
                            num = 0;
                            page = 0;

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
                                    await client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                }

                                row1.components[0].setDisabled(true);
                                row1.components[1].setDisabled(true);

                                await msg.edit({
                                    embeds: [embeds[page]],
                                    components: [row1],
                                });
                            });
                        } catch (err) {
                            await client.logServerError(guild, err);

                            if (err instanceof NotFoundError) {
                                await interaction.reply({
                                    embeds: [new ErrorEmbed(err, false)],
                                    ephemeral: true,
                                });
                            } else {
                                await interaction.reply({
                                    embeds: [new ErrorEmbed(err, true)],
                                    ephemeral: true,
                                });
                            }
                        }
                    break;
                    case 'can-edit':
                        const bool = option.getBoolean('bool') as boolean;

                        embed = await setGMEdit(guild, bool);

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

                        embed = await setRole(guild, 'gm', role1);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                    default:
                        role1 = option.getRole('admin');
                        role2 = option.getRole('mod');

                        embed = await setRole(guild, 'staff', role1, role2);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                }
            break;
            case 'getrole':
                switch (option.getSubcommand()) {
                    case 'gm':
                        embed = await getRole(guild, 'gm');

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                    default:
                        embed = await getRole(guild, 'staff');

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                }
                break;
            case 'setchannel':
                const channel = option.getChannel('channel') as TextChannel;

                switch (option.getSubcommand()) {
                    case 'summary':
                        embed = await setSumChan(guild, channel);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                    case 'log':
                        embed = await setLogChan(guild, channel);

                        emph = embed.data.color === '#ff0000';

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: emph,
                        });
                    break;
                }
            break;
        }

        const bool = option.getBoolean('bool') as boolean;

        switch (option.getSubcommand()) {
            case 'dup-sessions':
                embed = await setDupSessions(guild, bool);

                emph = embed.data.color === '#ff0000';

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: emph,
                });
            break;
            case 'print-logs':
                embed = await toggleLogs(guild, bool);

                emph = embed.data.color === '#ff0000';

                await interaction.reply({
                    embeds: [embed],
                    ephemeral: emph,
                });
            break;
        }
    }
}

async function addGM(server: Guild, user: User, role: Role) {
    try {
        const msg = await client.database.Server.gms.add(server, user);

        const member = server.members.cache.get(user.id) as GuildMember;

        await member.roles.add(role);

        await client.writeServerLog(server, msg);

        return new SuccessEmbed(msg || 'Success', `<@${user.id}> has been registered as a GM!`);
    } catch (err) {
        client.logServerError(server, err);

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);
        else return new ErrorEmbed(err, true);
    }
}

async function remGM(server: Guild, user: User, role: Role) {
    try {
        const msg = await client.database.Server.gms.remove(server, user);

        const member = server.members.cache.get(user.id) as GuildMember;

        await member.roles.remove(role);

        return new SuccessEmbed(msg || 'Success', `<@${user.id}> has been unregistered as a GM!`);
    } catch (err) {
        client.logServerError(server, err);

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);
        else return new ErrorEmbed(err, true);
    }
}

async function setGMEdit(server: Guild, bool: boolean) {
    try {
        const msg = await client.database.Server.setGMEdit(server, bool);
        const option = bool ? 'enabled' : 'disabled';

        return new SuccessEmbed(msg || 'Success', `The Ability for GMs to edit Rules, create custom Assets etc has been ${option}!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setRole(server: Guild, type: string, role1: Role, role2: Role | undefined = undefined) {
    try {
        switch (type) {
            case 'gm':
                return await setDMRole(server, role1);
            default:
                if (role2) return await setStaffRole(server, role1, role2);
        }
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setDMRole(server: Guild, role: Role) {
    try {
        const msg = await client.database.Server.setDMRole(server, BigInt(role.id));

        return new SuccessEmbed(msg || 'Success', `DM Role has been set to <@&${role.id}>!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setStaffRole(server: Guild, role1: Role, role2: Role) {
    try {
        const msg1 = await client.database.Server.setStaffRole(server, 'admin', BigInt(role1.id));
        const msg2 = await client.database.Server.setStaffRole(server, 'mod', BigInt(role2.id));

        const message = msg1 && msg2 ? `Staff Roles have been set to <@&${role1.id}> and <@&${role2.id}>!` : msg1 ? msg1 : msg2;

        return new SuccessEmbed('Success', message);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function getRole(server: Guild, type: string) {
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

async function getDMRole(server: Guild) {
    try {
        const roleID = client.database.Server.getDMRole(server);
        const role = server.roles.cache.get(String(roleID)) as Role;

        return new ListEmbed('DM Role', `This Server\'s DM Role is: <@&${role.id}>`, null);
    } catch (err) {
        if (err instanceof NotFoundError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function getStaffRole(server: Guild) {
    try {
        const adminId = (await client.database.Server.getStaffRole(server, 'admin'));
        const modId = (await client.database.Server.getStaffRole(server, 'mod'));
        const adminRole = server.roles.cache.get(String(adminId)) as Role;
        const modRole = server.roles.cache.get(String(modId)) as Role;

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
        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);
        else return new ErrorEmbed(err, true);
    }
}

async function setSumChan(server: Guild, channel: TextChannel) {
    try {
        const msg = await client.database.Server.setSumChannel(server, BigInt(channel.id));

        return new SuccessEmbed(msg || 'Success', `Summary Channel for Sessions has been set to <#${channel.id}>`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setLogChan(server: Guild, channel: TextChannel) {
    try {
        const msg = await client.database.Server.setLogChannel(server, BigInt(channel.id));

        return new SuccessEmbed(msg || 'Success', `Log Channel has been set to <#${channel.id}>`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function setDupSessions(server: Guild, bool: boolean) {
    try {
        const msg = await client.database.Server.setDupSessions(server, bool);

        const action = bool ? 'enabled' : 'disabled';

        return new SuccessEmbed(msg || 'Success', `The creation of duplicate Sessions has been ${action}!`);
    } catch (err) {
        return new ErrorEmbed(err, true);
    }
}

async function toggleLogs(server: Guild, bool: boolean) {
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
