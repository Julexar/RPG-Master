import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../../custom/errors';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
        this.nick = "g"
    };

    /**
     * 
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const member = interaction.member;
        const user = member.user;
        const guild = interaction.guild;

        const server = await client.database.Server.getOne(guild)

        let allowed = false;

        if (member.permissions.has(PermissionFlagsBits.Administrator)) allowed = true
        if (member.roles.cache.has(server.admin_role) || member.roles.cache.has(server.mod_role)) allowed = true
        if (server.gm_edit) {
            if (member.roles.cache.has(server.dm_role)) allowed = true
            else if (await client.database.Server.gms.getOne(server, user)) allowed = true
        }

        if (!allowed) {
            const roles = server.gm_edit ? `<@&${server.admin_role}>, <@&${server.mod_role}>, <@&${server.dm_role}>` : `<@&${server.admin_role}>, <@&${server.mod_role}>`

            const err = new ForbiddenError("Missing Permission", `You do not have Permission to use this Command!`)

            client.writeServerLog(guild, err)

            return await interaction.reply({
                embeds: [
                    new ErrorEmbed(err, false)
                    .setDescription(`You do not have Permission to use this Command!\n\nOnly People with the following Roles may use this Command: ${roles}`)
                ],
                ephemeral: true
            });
        }

        const menu = new EmbedBuilder()
        .setColor('#00ffff');
        
        const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('name')
                .setLabel('Set Name')
                .setEmoji('🔤')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('desc')
                .setLabel('Set Description')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary)
        );
        const row2 = new ActionRowBuilder();
        const row3 = new ActionRowBuilder();
        const row4 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('finish')
                .setLabel('Finish')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        let msg, collector;
        const filter = m => m.user.id === user.id;

        switch (option.getSubcommand()) {
            case 'armor':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let armor = {
                            name: null,
                            description: null,
                            type: null,
                            rarity: null,
                            dex_bonus: null,
                            ac: 10,
                            str_req: null,
                            magical: false,
                            magic_bonus: 0,
                            attune: false,
                            attune_req: null
                        };

                        row1.addComponents(
                            new ButtonBuilder()
                                .setCustomId('type')
                                .setLabel('Set Type')
                                .setEmoji('🏷️')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('rarity')
                                .setLabel('Set Rarity')
                                .setEmoji('🌟')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('dex_bonus')
                                .setLabel('Set Dex Bonus')
                                .setEmoji('🏹')
                                .setStyle(ButtonStyle.Primary)
                        );

                        row2.addComponents(
                            new ButtonBuilder()
                                .setCustomId('ac')
                                .setLabel('Set AC')
                                .setEmoji('🛡️')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('str_req')
                                .setLabel('Set Strength Requirement')
                                .setEmoji('💪')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('magical')
                                .setLabel('Make Magical')
                                .setEmoji('✨')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('attune')
                                .setLabel('Toggle Attunement')
                                .setEmoji('🔮')
                                .setStyle(ButtonStyle.Primary)
                        );

                        menu.setTitle('Armor Creator')
                        .setFields([
                            {
                                name: 'Name',
                                value: armor.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Type',
                                value: armor.type || '\ ',
                                inline: true
                            },
                            {
                                name: 'Rarity',
                                value: armor.rarity || '\ ',
                                inline: true
                            },
                            {
                                name: 'Requires Attunement',
                                value: armor.attune ? `Yes (${armor.attune_req})` : 'No',
                                inline: true
                            },
                            {
                                name: 'Magical',
                                value: armor.magical ? 'Yes' : 'No',
                                inline: true
                            },
                            {
                                name: '\u200b',
                                value: '\u200b',
                                inline: false
                            },
                            {
                                name: 'AC',
                                value: armor.ac || '\ ',
                                inline: true
                            },
                            {
                                name: 'Dex Bonus',
                                value: armor.dex_bonus || '\ ',
                                inline: true
                            },
                            {
                                name: 'Strength Requirement',
                                value: armor.str_req || '\ ',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: armor.description || '\ ',
                                inline: false
                            }
                        ])
                        .setTimestamp();

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row2, row4],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            let mes, filt, mescol, col;

                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Armor!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageComponentCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        armor.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            if (armor.magical || armor.attune) {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row3, row4],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row4],
                                                    ephemeral: true
                                                });
                                            }
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'type':
                                    //TODO: Add Type Selection
                                break;
                                case 'rarity':
                                    //TODO: Add Rarity Selection
                                break;
                                case 'attune':
                                    //TODO: Add Attunement Selection
                                break;
                                case 'magical':
                                    //TODO: Add Magical Selection
                                break;
                                case 'ac':
                                    //TODO: Add AC Selection
                                break;
                                case 'dex_bonus':
                                    //TODO: Add Dex Bonus Selection
                                break;
                                case 'str_req':
                                    //TODO: Add Strength Requirement Selection
                                break;
                                case 'desc':
                                    //TODO: Add Description Selection
                                break;
                                case 'attune_req':
                                    //TODO: Add Attunement Requirement Selection
                                break;
                                case 'magic_bonus':
                                    //TODO: Add Magic Bonus Selection
                                break;
                                case 'finish':
                                    //TODO: Add Finish Function
                                break;
                                case 'cancel':
                                    //TODO: Add Cancel Function
                                break;
                            }
                        });

                        collector.on('end', async collected => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out...',
                                    embeds: [],
                                    components: [],
                                    ephemeral: true
                                });
                            } else {
                                client.writeServerLog(guild, `Collected ${collected.size} Interactions`)
                            }

                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'class':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'condition':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'dmgtype':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'feat':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'race':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'subclass':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
            case 'subrace':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
                    break;
                    case 'edit':
                        //TODO: Add Edit Options
                    break;
                }
            break;
        }
    }
}

async function addAsset(server, type, asset) {
    //TODO: Create addAsset Function
}

async function removeAsset(server, type, asset) {
    //TODO: Create removeAsset Function
}

async function editAsset(server, type, asset) {
    //TODO: Create editAsset Function
}

const command = new Command({
    name: 'game',
    description: 'Game related Commands',
    defaultMemberPermissions: [PermissionFlagsBits.MuteMembers],
    options: [
        {
            name: 'add',
            description: 'Adds a Game Asset',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'armor',
                    description: 'Adds a custom Armor',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'class',
                    description: 'Adds a custom Class',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'condition',
                    description: 'Adds a custom Condition',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'dmgtype',
                    description: 'Adds a custom Damagetype',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'feat',
                    description: 'Adds a custom Feat',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'race',
                    description: 'Adds a custom Race',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subclass',
                    description: 'Adds a custom Subclass',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subrace',
                    description: 'Adds a custom Subrace',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Removes a Game Asset',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'armor',
                    description: 'Removes a custom Armor',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'class',
                    description: 'Removes a custom Class',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'condition',
                    description: 'Removes a custom Condition',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'dmgtype',
                    description: 'Removes a custom Damagetype',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'feat',
                    description: 'Removes a custom Feat',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'race',
                    description: 'Removes a custom Race',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subclass',
                    description: 'Removes a custom Subclass',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subrace',
                    description: 'Removes a custom Subrace',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: 'edit',
            description: 'Edits an existing Game Asset',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'armor',
                    description: 'Edits a custom Armor',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'class',
                    description: 'Edits a custom Class',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'condition',
                    description: 'Edits a custom Condition',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'dmgtype',
                    description: 'Edits a custom Damagetype',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'feat',
                    description: 'Edits a custom Feat',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'race',
                    description: 'Edits a custom Race',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subclass',
                    description: 'Edits a custom Subclass',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'subrace',
                    description: 'Edits a custom Subrace',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
    ]
});

export { command };