import { 
    ActionRowBuilder, 
    ApplicationCommandOptionType, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    StringSelectMenuBuilder 
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { NotFoundError, DuplicateError, ForbiddenError } from '../../../custom/errors';
import { SuccessEmbed, ErrorEmbed } from '../../../custom/embeds';

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

        let msg, collector, embed, emph;
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

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

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
                                    const tsel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('type')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Light',
                                                    value: 'Light'
                                                },
                                                {
                                                    label: 'Medium',
                                                    value: 'Medium'
                                                },
                                                {
                                                    label: 'Heavy',
                                                    value: 'Heavy'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: "Select a Type:",
                                        components: [tsel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'type') {
                                            menu.data.fields[1].value = `${j.values[0]} Armor`;
                                            armor.type = j.values[0];
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'rarity':
                                    const rsel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('rarity')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Common',
                                                    value: 'Common'
                                                },
                                                {
                                                    label: 'Uncommon',
                                                    value: 'Uncommon'
                                                },
                                                {
                                                    label: 'Rare',
                                                    value: 'Rare'
                                                },
                                                {
                                                    label: 'Very Rare',
                                                    value: 'Very Rare'
                                                },
                                                {
                                                    label: 'Legendary',
                                                    value: 'Legendary'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: "Select a Rarity:",
                                        components: [rsel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'rarity') {
                                            menu.data.fields[2].value = j.values[0];
                                            armor.rarity = j.values[0];
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'attune':
                                    const asel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('attune')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'Yes'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'No'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: "Select an Option:",
                                        components: [asel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'attune') {
                                            if (j.values[0] === 'Yes') {
                                                armor.attune = true;
                                                if (armor.attune_req) menu.data.fields[3].value = `Yes (${armor.attune_req})`;
                                                else menu.data.fields[3].value = 'Yes';

                                                row3.addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('attune_req')
                                                        .setLabel('Set Attunement Requirement')
                                                        .setEmoji('🔮')
                                                        .setStyle(ButtonStyle.Primary)
                                                );
                                            } else {
                                                armor.attune = false;
                                                menu.data.fields[3].value = 'No';
                                            }
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'magical':
                                    const msel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('magical')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'Yes'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'No'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: "Select an Option:",
                                        components: [msel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'magical') {
                                            if (j.values[0] === 'Yes') {
                                                armor.magical = true;
                                                menu.data.fields[3].value = 'Yes';
                                            } else {
                                                armor.magical = false;
                                                menu.data.fields[3].value = 'No';
                                            }

                                            if (armor.magical) {
                                                row3.addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('magic_bonus')
                                                        .setLabel('Set Magic Bonus')
                                                        .setEmoji('✨')
                                                        .setStyle(ButtonStyle.Primary)
                                                );

                                                menu.setFields([
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
                                                        name: 'Magic Bonus',
                                                        value: armor.magic_bonus || '\ ',
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
                                                ]);
                                            }

                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'ac':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Number!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            armor.ac = Number(j.content);
                                            menu.data.fields[6].value = j.content;
                                            mescol.stop();
                                        }
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'dex_bonus':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Number!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            armor.dex_bonus = Number(j.content);
                                            menu.data.fields[7].value = j.content;
                                            mescol.stop();
                                        }
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'str_req':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Number!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            armor.str_req = Number(j.content);
                                            menu.data.fields[8].value = j.content;
                                            mescol.stop();
                                        }
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'desc':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Description!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        armor.description = j.content;

                                        menu.data.fields[9].value = armor.description;

                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'attune_req':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with the Attunement Requirement!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        armor.attune_req = j.content;
                                        menu.data.fields[3].value = `Yes (${armor.attune_req})`;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
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
                                case 'magic_bonus':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Number!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            armor.magic_bonus = Number(j.content);
                                            menu.data.fields[5].value = j.content;
                                            mescol.stop();
                                        }
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'armor', armor);

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('armor')
                                .setPlaceholder('No Armor selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        )

                        rows.push(selrow);
                        let num, count, page = 0;

                        const armors = await client.database.Server.armors.getAll(server);

                        for (const armor of armors) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: armor.name,
                                value: `${armor.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: `Select an Armor:`,
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'armor':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'armor', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select an Armor:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select an Armor:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'class':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let clas = {
                            name: null,
                            description: null,
                            hitdice: null,
                            hitdice_size: null,
                            caster: false,
                            cast_lvl: 0,
                            cast_stat: null,
                            sub: false
                        }

                        row1.addComponents(
                            new ButtonBuilder()
                                .setCustomId('name')
                                .setLabel('Set Name')
                                .setEmoji('🔤')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('desc')
                                .setLabel('Set Description')
                                .setEmoji('📝')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('hitdice')
                                .setLabel('Set Hit Dice')
                                .setEmoji('🎲')
                                .setStyle(ButtonStyle.Primary)
                        );

                        row2.addComponents(
                            new ButtonBuilder()
                                .setCustomId('caster')
                                .setLabel('Toggle Caster')
                                .setEmoji('🧙')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('sub')
                                .setLabel('Toggle Subclass')
                                .setEmoji('📚')
                                .setStyle(ButtonStyle.Primary)
                        );

                        menu.setTitle('Class Creator')
                        .setFields([
                            {
                                name: 'Name',
                                value: clas.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Hit Dice',
                                value: clas.hitdice_size || '\ ',
                                inline: true
                            },
                            {
                                name: 'Caster',
                                value: clas.caster ? `Yes (${clas.cast_stat})` : 'No',
                                inline: true
                            },
                            {
                                name: 'Subclass',
                                value: clas.sub ? 'Yes' : 'No',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: clas.description || '\ ',
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
                                        content: `<@${user.id}> Please enter the Name of the Class!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        clas.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            if (clas.caster) {
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
                                case 'hitdice':
                                    const hsel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('hitdice')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'd6',
                                                    value: 'd6'
                                                },
                                                {
                                                    label: 'd8',
                                                    value: 'd8'
                                                },
                                                {
                                                    label: 'd10',
                                                    value: 'd10'
                                                },
                                                {
                                                    label: 'd12',
                                                    value: 'd12'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();
                                    await mes.edit({
                                        content: "Select a Hit Dice:",
                                        components: [hsel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'hitdice') {
                                            menu.data.fields[1].value = `${j.values[0]}`;
                                            clas.hitdice_size = j.values[0];
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                            
                                            if (clas.caster) {
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
                                case 'caster':
                                    const csel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('caster')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'Yes'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'No'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Select an Option:",
                                        components: [csel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'caster') {
                                            if (j.values[0] === 'Yes') {
                                                clas.caster = true;
                                                menu.data.fields[2].value = `Yes (${clas.cast_stat})`;
                                                row3.addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('cast_stat')
                                                        .setLabel('Set Casting Stat')
                                                        .setEmoji('📊')
                                                        .setStyle(ButtonStyle.Primary),
                                                    new ButtonBuilder()
                                                        .setCustomId('cast_lvl')
                                                        .setLabel('Set Casting Level')
                                                        .setEmoji('📈')
                                                        .setStyle(ButtonStyle.Primary)
                                                );
                                            } else {
                                                clas.caster = false;
                                                menu.data.fields[2].value = 'No';
                                            }
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                            
                                            if (clas.caster) {
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
                                case 'cast_stat':
                                    const cstsel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('cast_stat')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Strength',
                                                    value: 'str'
                                                },
                                                {
                                                    label: 'Dexterity',
                                                    value: 'dex'
                                                },
                                                {
                                                    label: 'Constitution',
                                                    value: 'con'
                                                },
                                                {
                                                    label: 'Intelligence',
                                                    value: 'int'
                                                },
                                                {
                                                    label: 'Wisdom',
                                                    value: 'wis'
                                                },
                                                {
                                                    label: 'Charisma',
                                                    value: 'cha'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Select a Casting Stat:",
                                        components: [cstsel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'cast_stat') {
                                            const lvl = clas.cast_lvl === 1 ? 'Full Caster' : (clas.cast_lvl === 0 ? 'Special Caster' : 'Half Caster')
                                            menu.data.fields[2].value = `Yes, ${lvl} (${j.values[0]})`;
                                            clas.cast_stat = j.values[0];
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                            
                                            if (clas.caster) {
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
                                case 'cast_lvl':
                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Reply with a Number!"
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000 });

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            clas.cast_lvl = Number(j.content);
                                            const lvl = clas.cast_lvl === 1 ? 'Full Caster' : (clas.cast_lvl === 0 ? 'Special Caster' : 'Half Caster')
                                            menu.data.fields[2].value = `Yes, ${lvl} (${clas.cast_stat})`;
                                            mescol.stop();
                                        }
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Reply collection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                            
                                            if (clas.caster) {
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
                                case 'sub':
                                    const ssel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('subsel')
                                            .setPlaceholder('No Option selected...')
                                            .addOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'Yes'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'No'
                                                }
                                            ])
                                    );

                                    mes = await i.deferReply();

                                    await mes.edit({
                                        content: "Select an Option:",
                                        components: [ssel],
                                        ephemeral: true
                                    });

                                    col = mes.createMessageComponentCollector({ filter, time: 35000, max: 1});

                                    col.on('collect', async j => {
                                        if (j.customId === 'subsel') {
                                            if (j.values[0] === 'Yes') {
                                                clas.sub = true;
                                                menu.data.fields[3].value = 'Yes';
                                            } else {
                                                clas.sub = false;
                                                menu.data.fields[3].value = 'No';
                                            }
                                            col.stop();
                                        }
                                    });

                                    col.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: "Selection timed out...",
                                                components: [],
                                                ephemeral: true
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);
                                            
                                            if (clas.caster) {
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
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'class', clas);

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('class')
                                .setPlaceholder('No Class selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);
                        num, count, page = 0;

                        const classes = await client.database.Server.classes.getAll(server);

                        for (const clas of classes) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: clas.name,
                                value: `${clas.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: `Select a Class:`,
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'class':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'class', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Class:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Class:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'condition':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let condition = {
                            name: null,
                            description: null
                        };

                        row1.addComponents(
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

                        menu.setTitle('Condition Creator')
                        .setFields([
                            {
                                name: 'Name',
                                value: condition.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: condition.description || '\ ',
                                inline: false
                            }
                        ])
                        .setTimestamp();

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row4],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            let mes, filt, mescol;

                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Condition!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        condition.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Condition!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[1].value = j.content;
                                        condition.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'condition', condition);

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('condsel')
                                .setPlaceholder('No Condition selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const conditions = await client.database.Server.conditions.getAll(server);

                        for (const condition of conditions) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: condition.name,
                                value: `${condition.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: `Select a Condition:`,
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'condsel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'condition', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Condition:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Condition:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'dmgtype':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let dmgtype = {
                            name: null,
                            description: null
                        };

                        row1.addComponents(
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

                        menu.setTitle('Damage Type Creator')
                        .setFields([
                            {
                                name: 'Name',
                                value: dmgtype.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: dmgtype.description || '\ ',
                                inline: false
                            }
                        ])
                        .setTimestamp();

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row4],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            let mes, filt, mescol;

                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Damage Type!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        dmgtype.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Damage Type!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[1].value = j.content;
                                        dmgtype.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'dmgtype', dmgtype);

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('dmgtypesel')
                                .setPlaceholder('No Damage Type selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const dmgtypes = await client.database.Server.dmgtypes.getAll(server);

                        for (const dmgtype of dmgtypes) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: dmgtype.name,
                                value: `${dmgtype.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: `Select a Damagetype:`,
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'dmgtypesel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'dmgtype', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Damage Type:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Damage Type:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'feat':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let feat = {
                            name: null,
                            description: null,
                            prerequisites: [],
                            options: []
                        }

                        row1.addComponents(
                            new ButtonBuilder()
                                .setCustomId('name')
                                .setLabel('Set Name')
                                .setEmoji('🔤')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('desc')
                                .setLabel('Set Description')
                                .setEmoji('📝')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('type')
                                .setLabel('Set Type')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
                        );

                        row2.addComponents(
                            new ButtonBuilder()
                                .setCustomId('prereq')
                                .setLabel('Set Prerequisites')
                                .setEmoji('📖')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('options')
                                .setLabel('Set Options')
                                .setEmoji('📑')
                                .setStyle(ButtonStyle.Primary)
                        );

                        menu.setTitle('Feat Creator')
                        .setFields([
                            {
                                name: 'Name',
                                value: feat.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Prerequisites',
                                value: feat.prerequisites.length > 0 ? feat.prerequisites.join('\n') : '\ ',
                                inline: false
                            },
                            {
                                name: 'Description',
                                value: feat.description || '\ ',
                                inline: false
                            },
                            {
                                name: 'Options',
                                value: feat.options.length > 0 ? feat.options.join('\n') : '\ ',
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
                            let mes, filt, mescol;

                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        feat.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[3].value = j.content;
                                        feat.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'prereq':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Prerequisites of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[1].value = j.content;
                                        feat.prerequisites = j.content.split(',');
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'options':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Options of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[3].value = j.content;
                                        feat.options = j.content.split(',');
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'feat', feat);

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('featsel')
                                .setPlaceholder('No Feat selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const feats = await client.database.Server.feats.getAll(server);

                        for (const feat of feats) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: feat.name,
                                value: `${feat.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: `Select a Feat:`,
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'featsel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'feat', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Feat:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: `Select a Feat:`,
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'race':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let race = {
                            name: null,
                            description: null,
                            speed: null,
                            sub: false,
                            feat: false
                        };

                        row1.addComponents(
                            new ButtonBuilder()
                                .setCustomId('name')
                                .setLabel('Set Name')
                                .setEmoji('🔤')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('desc')
                                .setLabel('Set Description')
                                .setEmoji('📝')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('speed')
                                .setLabel('Set Speed')
                                .setEmoji('🏃')
                                .setStyle(ButtonStyle.Primary),
                        );

                        row2.addComponents(
                            new ButtonBuilder()
                                .setCustomId('sub')
                                .setLabel('Toggle Subrace')
                                .setEmoji('👪')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('feat')
                                .setLabel('Toggle Feat')
                                .setEmoji('📖')
                                .setStyle(ButtonStyle.Primary)
                        );

                        menu.setTitle("Race Creator")
                        .setFields([
                            {
                                name: 'Name',
                                value: race.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Speed',
                                value: String(race.speed) || '\ ',
                                inline: true
                            },
                            {
                                name: 'Has Subraces?',
                                value: race.sub ? 'Yes' : 'No',
                                inline: true
                            },
                            {
                                name: 'Lvl 1 Feat?',
                                value: race.feat ? 'Yes' : 'No',
                            },
                            {
                                name: 'Description',
                                value: race.description || '\ ',
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
                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        race.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Messages`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[4].value = j.content;
                                        race.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'speed':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Speed of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        if (isNaN(j.content)) {
                                            let mesag = await j.deferReply();

                                            await mesag.edit({
                                                content: "Please provide a valid Number!"
                                            });

                                            setTimeout(async () => {
                                                await mesag.delete();
                                            }, 5000);
                                        } else {
                                            menu.data.fields[1].value = j.content;
                                            race.speed = Number(j.content);
                                            mescol.stop();
                                        }
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond or entered an invalid number!`
                                            });
                                        } else {
                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'sub':
                                    const ssel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('subsel')
                                            .setPlaceholder('No Option selected...')
                                            .setMaxValues(1)
                                            .setOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'true'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'false'
                                                }
                                            ])
                                    );

                                    mes = await i.followUp({
                                        content: 'Select an Option:',
                                        components: [ssel],
                                        ephemeral: true
                                    });

                                    mescol = msg.createMessageComponentCollector({ filter, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[2].value = Boolean(j.values[0]) ? 'Yes' : 'No';
                                        race.sub = Boolean(j.values[0]);
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'You took too long to respond!'
                                            });
                                        } else {
                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'feat':
                                    const fesel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('featsel')
                                            .setPlaceholder('No Option selected...')
                                            .setMaxValues(1)
                                            .setOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'true'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'false'
                                                }
                                            ])
                                    );
                                    
                                    mes = await i.followUp({
                                        content: 'Select an Option:',
                                        components: [fesel],
                                        ephemeral: true
                                    });

                                    mescol = msg.createMessageComponentCollector({ filter, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[3].value = Boolean(j.values[0]) ? 'Yes' : 'No';
                                        race.feat = Boolean(j.values[0]);
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'You took too long to respond!'
                                            });
                                        } else {
                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row2, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'race', race)

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('racesel')
                                .setPlaceholder('No Race selected...')
                                .setMaxValues(1)
                        );

                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const races = await client.database.Server.races.getAll(server);

                        for (const race of races) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: race.name,
                                value: `${race.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Select a Race to remove:',
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'racesel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'race', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Race to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Race to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'subclass':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let subclass = {
                            name: null,
                            description: null,
                            caster: false,
                            cast_stat: null,
                            cast_lvl: null
                        };

                        row1.addComponents(
                            new ButtonBuilder()
                                .setCustomId('name')
                                .setLabel('Set Name')
                                .setEmoji('🔤')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('desc')
                                .setLabel('Set Description')
                                .setEmoji('📝')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('caster')
                                .setLabel('Toggle Caster')
                                .setEmoji('🧙')
                                .setStyle(ButtonStyle.Primary),
                        );

                        menu.setTitle("Subclass Creator")
                        .setFields([
                            {
                                name: 'Name',
                                value: subclass.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Caster?',
                                value: subclass.caster ? 'Yes' : 'No',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: subclass.description || '\ ',
                                inline: false
                            }
                        ])
                        .setTimestamp();

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row4],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        subclass.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Messages`);

                                            if (subclass.caster) {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row4],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row4],
                                                    ephemeral: true
                                                });
                                            }
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Feat!`
                                    });
                                    
                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[2].value = j.content;
                                        subclass.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            if (subclass.caster) {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row4],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row4],
                                                    ephemeral: true
                                                });
                                            }
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'caster':
                                    const csel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('castersel')
                                            .setPlaceholder('No Option selected...')
                                            .setMaxValues(1)
                                            .setOptions([
                                                {
                                                    label: 'Yes',
                                                    value: 'true'
                                                },
                                                {
                                                    label: 'No',
                                                    value: 'false'
                                                }
                                            ])
                                    );

                                    mes = await i.followUp({
                                        content: 'Select an Option:',
                                        components: [csel],
                                        ephemeral: true
                                    });

                                    mescol = msg.createMessageComponentCollector({ filter, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        subclass.caster = Boolean(j.values[0]);

                                        if (subclass.caster) {
                                            const lvl = subclass.cast_lvl === 1 ? 'Full Caster' : (subclass.cast_lvl === 0 ? 'Special Caster' : 'Half Caster');
                                            menu.data.fields[1].value = Boolean(j.values[0]) ? (subclass.cast_stat ? `Yes, ${lvl} (${subclass.cast_stat})` : `Yes, ${lvl}`) : 'No';
                                            row2.setComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('cast_stat')
                                                    .setLabel('Set Casting Stat')
                                                    .setEmoji('📊')
                                                    .setStyle(ButtonStyle.Primary),
                                                new ButtonBuilder()
                                                    .setCustomId('cast_lvl')
                                                    .setLabel('Set Casting Level')
                                                    .setEmoji('📈')
                                                    .setStyle(ButtonStyle.Primary)
                                            );
                                        } else {
                                            menu.data.fields[1].value = 'No';
                                        }

                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Selection timed out...'
                                            });
                                        } else {
                                            if (subclass.caster) {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row4],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row4],
                                                    ephemeral: true
                                                });
                                            }
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'cast_stat':
                                    const cssel = new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId('caststatsel')
                                            .setPlaceholder('No Option selected...')
                                            .setMaxValues(1)
                                            .setOptions([
                                                {
                                                    label: 'Strength',
                                                    value: 'str'
                                                },
                                                {
                                                    label: 'Dexterity',
                                                    value: 'dex'
                                                },
                                                {
                                                    label: 'Constitution',
                                                    value: 'con'
                                                },
                                                {
                                                    label: 'Intelligence',
                                                    value: 'int'
                                                },
                                                {
                                                    label: 'Wisdom',
                                                    value: 'wis'
                                                },
                                                {
                                                    label: 'Charisma',
                                                    value: 'cha'
                                                }
                                            ])
                                    );

                                    mes = await i.followUp({
                                        content: 'Select an Option:',
                                        components: [cssel],
                                        ephemeral: true
                                    });

                                    mescol = msg.createMessageComponentCollector({ filter, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        const lvl = subclass.cast_lvl === 1 ? 'Full Caster' : (subclass.cast_lvl === 0 ? 'Special Caster' : 'Half Caster');
                                        menu.data.fields[1].value = Boolean(j.values[0]) ? (subclass.cast_stat ? `Yes, ${lvl} (${subclass.cast_stat})` : `Yes, ${lvl}`) : 'No';

                                        row2.setComponents(
                                            new ButtonBuilder()
                                                .setCustomId('cast_stat')
                                                .setLabel('Set Casting Stat')
                                                .setEmoji('📊')
                                                .setStyle(ButtonStyle.Primary),
                                            new ButtonBuilder()
                                                .setCustomId('cast_lvl')
                                                .setLabel('Set Casting Level')
                                                .setEmoji('📈')
                                                .setStyle(ButtonStyle.Primary)
                                        );
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: 'Selection timed out...'
                                            });
                                        } else {
                                            if (subclass.caster) {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row2, row4],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await mes.edit({
                                                    embeds: [menu],
                                                    components: [row1, row4],
                                                    ephemeral: true
                                                });
                                            }
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('subclassesel')
                                .setPlaceholder('No Subclass selected...')
                                .setMaxValues(1)
                        );
                        
                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const subclasses = await client.database.Server.subclasses.getAll(server);

                        for (const subclass of subclasses) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: subclass.name,
                                value: `${subclass.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Select a Subclass to remove:',
                            components: [rows[page], butRow],
                            ephemeral: true
                        });
                        
                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'subclassesel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'subclass', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Subclass to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Subclass to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
            case 'subrace':
                switch (option.getSubcommandGroup()) {
                    case 'add':
                        let subrace = {
                            name: null,
                            description: null
                        };

                        row1.addComponents(
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

                        menu.setTitle("Subrace Creator")
                        .setFields([
                            {
                                name: 'Name',
                                value: subrace.name || '\ ',
                                inline: true
                            },
                            {
                                name: 'Description',
                                value: subrace.description || '\ ',
                                inline: false
                            }
                        ])
                        .setTimestamp();

                        msg = await interaction.reply({
                            embeds: [menu],
                            components: [row1, row4],
                            ephemeral: true
                        });
                        
                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'name':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Name of the Feat!`
                                    });

                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[0].value = j.content;
                                        subrace.name = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            client.writeServerLog(guild, `Collected ${collected.size} Messages`);

                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'desc':
                                    mes = await i.followUp({
                                        content: `<@${user.id}> Please enter the Description of the Feat!`
                                    });
                                    
                                    filt = m => m.reference.messageId === mes.id && m.author.id === user.id;

                                    mescol = i.channel.createMessageCollector({ filt, time: 35000, max: 1})

                                    mescol.on('collect', async j => {
                                        menu.data.fields[1].value = j.content;
                                        subrace.description = j.content;
                                        mescol.stop();
                                    });

                                    mescol.on('end', async collected => {
                                        if (collected.size === 0) {
                                            await mes.edit({
                                                content: `<@${user.id}> You took too long to respond!`
                                            });
                                        } else {
                                            await mes.edit({
                                                embeds: [menu],
                                                components: [row1, row4],
                                                ephemeral: true
                                            });
                                        }

                                        setTimeout(async () => {
                                            await mes.delete();
                                        }, 5000);
                                    });
                                break;
                                case 'finish':
                                    mes = await i.deferReply();

                                    embed = await addAsset(server, 'subrace', subrace)

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
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
                        const rows = [];

                        const selrow = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('subracesel')
                                .setPlaceholder('No Subrace selected...')
                                .setMaxValues(1)
                        );
                        
                        const butRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setEmoji('⏪')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setEmoji('⏩')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger)
                        );

                        rows.push(selrow);

                        num, count, page = 0;

                        const subraces = await client.database.Server.subraces.getAll(server);

                        for (const subrace of subraces) {
                            if (count === 24) {
                                rows.push(selrow);
                                count = 0;
                                num++;
                            }

                            rows[num].components[0].addOptions({
                                label: subrace.name,
                                value: `${subrace.id}`
                            });

                            count++;
                        }

                        msg = await interaction.reply({
                            content: 'Select a Subrace to remove:',
                            components: [rows[page], butRow],
                            ephemeral: true
                        });

                        collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                        collector.on('collect', async i => {
                            switch (i.customId) {
                                case 'subracesel':
                                    mes = await i.deferReply();

                                    embed = await removeAsset(server, 'subrace', {id: Number(i.values[0])});

                                    emph = embed.data.color === "#FF0000";

                                    await mes.edit({
                                        embeds: [embed],
                                        ephemeral: emph
                                    });
                                break;
                                case 'prev':
                                    await i.deferUpdate();

                                    if (page > 0) {
                                        page--;

                                        if (page === 0) {
                                            butRow.components[0].setDisabled(true);
                                            butRow.components[1].setDisabled(false);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Subrace to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
                                        });
                                    }
                                break;
                                case 'next':
                                    await i.deferUpdate();

                                    if (page < rows.length - 1) {
                                        page++;

                                        if (page === rows.length - 1) {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(true);
                                        } else {
                                            butRow.components[0].setDisabled(false);
                                            butRow.components[1].setDisabled(false);
                                        }

                                        await msg.edit({
                                            content: 'Select a Subrace to remove:',
                                            components: [rows[page], butRow],
                                            ephemeral: true
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
                }
            break;
        }
    }
}

async function addAsset(server, type, asset) {
    switch (type) {
        case 'armor':
            return await addArmor(server, asset);
        case 'class':
            return await addClass(server, asset);
        case 'condition':
            return await addCondition(server, asset);
        case 'dmgtype':
            return await addDmgtype(server, asset);
        case 'feat':
            return await addFeat(server, asset);
        case 'race':
            return await addRace(server, asset);
        case 'subclass':
            return await addSubclass(server, asset);
        case 'subrace':
            return await addSubrace(server, asset);
    }
}

async function addArmor(server, armor) {
    try {
        const msg = await client.database.Armor.add(server, armor)

        return new SuccessEmbed(msg || "Success", `Successfully added Armor \`${armor.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addClass(server, clas) {
    try {
        const msg = await client.database.Server.classes.add(server, clas)

        return new SuccessEmbed(msg || "Success", `Successfully added Class \`${clas.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addCondition(server, condition) {
    try {
        const msg = await client.database.Server.conditions.add(server, condition)

        return new SuccessEmbed(msg || "Success", `Successfully added Condition \`${condition.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addDmgtype(server, dmgtype) {
    try {
        const msg = await client.database.Server.dmgtypes.add(server, dmgtype)

        return new SuccessEmbed(msg || "Success", `Successfully added Damage Type \`${dmgtype.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addFeat(server, feat) {
    try {
        const msg = await client.database.Server.feats.add(server, feat)

        return new SuccessEmbed(msg || "Success", `Successfully added Feat \`${feat.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addRace(server, race) {
    try {
        const msg = await client.database.Server.races.add(server, race)

        return new SuccessEmbed(msg || "Success", `Successfully added Race \`${race.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addSubclass(server, subclass) {
    try {
        const msg = await client.database.Server.subclasses.add(server, subclass)

        return new SuccessEmbed(msg || "Success", `Successfully added Subclass \`${subclass.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function addSubrace(server, subrace) {
    try {
        const msg = await client.database.Server.subraces.add(server, subrace)

        return new SuccessEmbed(msg || "Success", `Successfully added Subrace \`${subrace.name}\` to the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof DuplicateError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeAsset(server, type, asset) {
    switch (type) {
        case 'armor':
            return await removeArmor(server, asset);
        case 'class':
            return await removeClass(server, asset);
        case 'condition':
            return await removeCondition(server, asset);
        case 'dmgtype':
            return await removeDmgtype(server, asset);
        case 'feat':
            return await removeFeat(server, asset);
        case 'race':
            return await removeRace(server, asset);
        case 'subclass':
            return await removeSubclass(server, asset);
        case 'subrace':
            return await removeSubrace(server, asset);
    }
}

async function removeArmor(server, armor) {
    try {
        const msg = await client.database.Armor.remove(server, armor)

        return new SuccessEmbed(msg || "Success", `Successfully removed Armor \`${armor.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeClass(server, clas) {
    try {
        const msg = await client.database.Server.classes.remove(server, clas)

        return new SuccessEmbed(msg || "Success", `Successfully removed Class \`${clas.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeCondition(server, condition) {
    try {
        const msg = await client.database.Server.conditions.remove(server, condition)

        return new SuccessEmbed(msg || "Success", `Successfully removed Condition \`${condition.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeDmgtype(server, dmgtype) {
    try {
        const msg = await client.database.Server.dmgtypes.remove(server, dmgtype)

        return new SuccessEmbed(msg || "Success", `Successfully removed Damage Type \`${dmgtype.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeFeat(server, feat) {
    try {
        const msg = await client.database.Server.feats.remove(server, feat)

        return new SuccessEmbed(msg || "Success", `Successfully removed Feat \`${feat.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeRace(server, race) {
    try {
        const msg = await client.database.Server.races.remove(server, race)

        return new SuccessEmbed(msg || "Success", `Successfully removed Race \`${race.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeSubclass(server, subclass) {
    try {
        const msg = await client.database.Server.subclasses.remove(server, subclass)

        return new SuccessEmbed(msg || "Success", `Successfully removed Subclass \`${subclass.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
}

async function removeSubrace(server, subrace) {
    try {
        const msg = await client.database.Server.subraces.remove(server, subrace)

        return new SuccessEmbed(msg || "Success", `Successfully removed Subrace \`${subrace.name}\` from the Server!`);
    } catch (err) {
        client.writeServerLog(server, err)

        if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

        return new ErrorEmbed(err, true);
    }
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
    ]
});

export { command };