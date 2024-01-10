import { 
    ActionRowBuilder, 
    ApplicationCommandOptionType, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    StringSelectMenuBuilder 
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { SuccessEmbed, ErrorEmbed, ListEmbed } from '../../../custom/embeds';
import { NotFoundError, DuplicateError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = false;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction 
     */
    async run(interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const filter = m => m.user.id === user.id;
        let msg, embed, rows, row1, row2, collector, emph, count, num, page;
        
        if (!option.getSubcommandGroup()) {
            switch (option.getSubcommand()) {
                case 'select':
                    rows = [];
                    row1 = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('charsel')
                            .setPlaceholder('No Character selected...')
                            .setMaxValues(1)
                    );

                    row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⏪')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⏩'),
                        new ButtonBuilder()
                            .setCustomId('cancel')
                            .setStyle(ButtonStyle.Danger)
                            .setLabel('Cancel')
                    );

                    rows.push(row1);

                    count, num, page = 0;

                    const characters = await client.database.Character.getAll(user)

                    for (const char of characters) {
                        if (count === 24) {
                            rows.push(row1);
                            count = 0;
                            num++;
                        }

                        rows[num].components[0].addOptions({
                            label: char.name,
                            value: `${char.id}`,
                        });

                        count++;
                    }

                    msg = await interaction.reply({
                        content: 'Select a Character:',
                        components: [rows[page], row2],
                        ephemeral: true
                    });

                    collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                    collector.on('collect', async i => {
                        if (i.customId === 'charsel') {
                            const char = await client.database.Character.getOne(user, {id: Number(i.values[0])})

                            embed = await this.selectChar(user, char)

                            emph = embed.data.color === '#FF0000';

                            await i.followUp({
                                embeds: [embed],
                                ephemeral: emph,
                            });
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
                                    content: 'Select a Character:',
                                    components: [rows[page], row2],
                                    ephemeral: true
                                });
                            }
                        } else if (i.customId === 'next') {
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
                                    content: 'Select a Character:',
                                    components: [rows[page], row2],
                                    ephemeral: true
                                });
                            }
                        } else if (i.customId === 'cancel') {
                            await i.deferUpdate();
                            await msg.edit({
                                content: 'Character Selection has been cancelled.',
                                components: [],
                                ephemeral: true
                            });
                            collector.stop();
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: 'Character Selection has timed out.',
                                components: [],
                                ephemeral: true
                            });
                        } else {
                            client.writeServerLog(server, `Collected ${collected.size} Interactions`);
                        }

                        setTimeout(async () => {
                            await msg.delete();
                        }, 5000);
                    });
                break;
                case 'view':
                    //TODO: Add Character Sheet
                break;
                case 'create':
                    //TODO: Add Character Creation
                break;
                case 'delete':
                    //TODO: Add Character Deletion
                break;
                case 'edit':
                    //TODO: Add Character Editing
                break;
            }
        } else {
            const noteId = option.getNumber('id');

            switch (option.getSubcommand()) {
                case 'view':
                    //TODO: Add Note Viewing
                break;
                case 'create':
                    //TODO: Add Note Creation
                break;
                case 'delete':
                    //TODO: Add Note Deletion
                break;
                case 'edit':
                    //TODO: Add Note Editing
                break;
            }
        }
    }

    async selectChar(user, char) {
        try {
            const msg = await client.database.User.selectChar(user, char)

            return new SuccessEmbed(msg || 'Success', `Successfully changed active Character to ${char.name}.`)
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'character',
    nick: 'char',
    description: 'Character Management',
    options: [
        {
            name: 'select',
            description: 'Selects a Character',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'view',
            description: 'Posts the Character Sheet',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'create',
            description: 'Creates a Character',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'delete',
            description: 'Deletes a Character',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'edit',
            description: 'Edits a Character',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'notes',
            description: 'Character Notes Management',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'view',
                    description: 'Views Character Notes',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'private',
                            description: 'Toggle viewing private Notes',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: 'id',
                            description: 'Provide the ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: 'create',
                    description: 'Creates a Character Note',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'delete',
                    description: 'Deletes a Character Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'Provide the ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: 'edit',
                    description: 'Edits a Character Note',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'id',
                            description: 'Provide the ID of the Note',
                            type: ApplicationCommandOptionType.Number,
                            minValue: 1,
                        },
                    ],
                },
            ],
        },
    ]
});

export { command };
