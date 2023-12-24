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
                        //TODO: Add Add Options
                    break;
                    case 'remove':
                        //TODO: Add Remove Options
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