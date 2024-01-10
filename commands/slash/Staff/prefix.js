import { 
    ActionRowBuilder, 
    ApplicationCommandOptionType, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits 
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { NotFoundError, DuplicateError } from '../../../custom/errors';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';

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
        const user = interaction.user;
        const guild = interaction.guild;
        let embed, emph, rows, collector, msg, prefixes;
        let count,
            num,
            page = 0;

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
        );

        const filter = (m) => m.user.id === user.id;

        switch (option.getSubcommand()) {
            case 'add':
                const prefix = option.getString('prefix');

                embed = await addPrefix(guild, prefix);

                emph = embed.data.color === '#FF0000';

                return await interaction.reply({
                    embeds: [embed],
                    ephemeral: emph,
                });
            case 'remove':
                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder().setCustomId('prefix_select').setPlaceholder('No Prefix selected...').setMaxValues(1)
                );

                rows = [];
                rows.push(row);

                prefixes = await client.database.Server.prefixes.getAll(guild);

                for (const prefix of prefixes) {
                    if (count === 24) {
                        rows.push(row);
                        count = 0;
                        num++;
                    }

                    rows[num].components[0].addOptions({
                        label: prefix.prefix,
                        value: `${prefix.id}`,
                    });
                    count++;
                }

                msg = await interaction.reply({
                    content: 'Select a Prefix to remove',
                    components: [rows[page], row2],
                    ephemeral: true,
                });

                collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                collector.on('collect', async (i) => {
                    switch (i.customId) {
                        case 'prefix_select':
                            const prefix = await client.database.Server.prefixes.getOne(guild, { id: i.values[0] });

                            embed = await removePrefix(guild, prefix);

                            emph = embed.data.color === '#FF0000';

                            await i.deferReply({
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

                collector.on('end', async (collected) => {
                    if (collected.size === 0) {
                        await msg.edit({
                            content: 'Selection timed out...',
                            components: [],
                            ephemeral: true,
                        });
                    }

                    client.writeServerLog(guild, `Collected ${collected.size} Interactions`);

                    setTimeout(async () => {
                        await msg.delete();
                    }, 5000);
                });
                break;
            case 'list':
                try {
                    prefixes = await client.database.Server.prefixes.getAll(guild);
                    prefixes = prefixes.join('\n');

                    return await interaction.reply({
                        embeds: [new ListEmbed('Prefixes', prefixes)],
                    });
                } catch (err) {
                    client.writeServerLog(guild, err);

                    if (err instanceof NotFoundError) {
                        return interaction.reply({
                            embeds: [new ErrorEmbed(err, false)],
                            ephemeral: true,
                        });
                    } else {
                        return interaction.reply({
                            embeds: [new ErrorEmbed(err, true)],
                            ephemeral: true,
                        });
                    }
                }
        }
    }
}

async function addPrefix(guild, prefix) {
    try {
        const msg = await client.database.Server.prefixes.add(guild, prefix);

        return new SuccessEmbed(msg || 'Success', `The Prefix \`${prefix}\` has been added!`);
    } catch (err) {
        client.writeServerLog(guild, err);

        if (err instanceof DuplicateError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

async function removePrefix(guild, prefix) {
    try {
        const msg = await client.database.Server.prefixes.remove(guild, prefix);

        return new SuccessEmbed(msg || 'Success', `The Prefix \`${prefix}\` has been removed!`);
    } catch (err) {
        client.writeServerLog(guild, err);

        if (err instanceof NotFoundError) {
            return new ErrorEmbed(err, false);
        } else {
            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'prefix',
    description: 'Prefix Command',
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'add',
            description: 'Adds a Prefix',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'prefix',
                    description: 'Provide a Prefix',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'remove',
            description: 'Removes a Prefix',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'list',
            description: 'Shows a List of all Prefixes',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
});

export { command };
