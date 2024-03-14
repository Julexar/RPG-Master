import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
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
                    row1 = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder().setCustomId('charsel').setPlaceholder('No Character selected...').setMaxValues(1)
                    );

                    row2 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
                        new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
                        new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                    );

                    rows.push(row1);

                    count, num, (page = 0);

                    const characters = await client.database.Character.getAll(user);

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
                        ephemeral: true,
                    });

                    collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                    collector.on('collect', async i => {
                        if (i.customId === 'charsel') {
                            const char = await client.database.Character.getOne(user, { id: Number(i.values[0]) });

                            embed = await this.selectChar(user, char);

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
                                    ephemeral: true,
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
                                    ephemeral: true,
                                });
                            }
                        } else if (i.customId === 'cancel') {
                            await i.deferUpdate();
                            await msg.edit({
                                content: 'Character Selection has been cancelled.',
                                components: [],
                                ephemeral: true,
                            });
                            collector.stop();
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: 'Character Selection has timed out.',
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
            case "view":
                if (option.getSubcommandGroup() == "notes") {
                    const noteId = option.getInteger("id");
                    if (!noteId) {
                        const rows = [];
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId("notesel")
                                    .setMinValues(1)
                                    .setMaxValues(1)
                                    .setPlaceholder("No Note selected...")
                            );
                        rows.push(row);
                        const row2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("prev")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏪")
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId("next")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji("⏩"),
                                new ButtonBuilder()
                                    .setCustomId("cancel")
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel("Cancel")
                            );
                        client.database.getUser(user)
                            .then(async (u) => {
                                if (!u.char_id) {
                                    const cmd = await server.commands.cache.find(c => c.name == "character");
                                    client.database.writeDevLog(await client.database.writeLog(server, "Error 404: No Character selected").catch(err => client.database.writeDevLog(`${err}`)));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("Error 404: No Character selected")
                                                .setDescription(`You need to select a Character first before you use this Command! Use </character select:${cmd.id}> to select a Character.`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    client.database.getCharNote(user, {id: u.char_id})
                                        .then(async (notes) => {
                                            let count = 0;
                                            let num = 0;
                                            for (const note of notes) {
                                                if (count == 24) {
                                                    rows.push(row);
                                                    num++;
                                                    count = 0;
                                                }
                                                if (note.title) {
                                                    rows[num].components[0].addOptions({
                                                        label: `${note.title} (#${note.id})`,
                                                        value: `${note.id}`
                                                    });
                                                } else {
                                                    rows[num].components[0].addOptions({
                                                        label: `Note #${note.id}`,
                                                        value: `${note.id}`
                                                    });
                                                }
                                                count++;
                                            }
                                            if (rows.length==1) {
                                                row2.components[1].setDisabled(true);
                                            }
                                            let page = 0;
                                            const msg = await interaction.reply({
                                                content: "Select a Note:",
                                                components: [rows[page], row2],
                                                ephemeral: true
                                            });
                                            const collector = msg.createMessageComponentCollector({
                                                filter,
                                                time: 90000
                                            });
                                            collector.on("collect", async (i) => {
                                                if (i.customId=="notesel") {
                                                    const mes = await i.deferReply();
                                                    client.database.getCharNote(user, {id: u.char_id}, {id: Number(i.values[0])})
                                                        .then(async (note) => {
                                                            const embed = new EmbedBuilder()
                                                                .setColor("Yellow")
                                                                .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                                                .setTitle(`Note #${note.id}`)
                                                                .setDescription(note.content)
                                                                .setTimestamp()
                                                            if (note.title) {
                                                                embed.setTitle(`${note.title} (#${note.id})`);
                                                            }
                                                            await mes.edit({
                                                                embeds: [embed],
                                                                ephemeral: note.private
                                                            });
                                                        })
                                                        .catch(async (err) => {
                                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                                            if (String(err).includes("Error 404")) {
                                                                await mes.edit({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor("Red")
                                                                            .setTitle(`${err}`)
                                                                            .setDescription("Could not find that Character Note in the Database!")
                                                                            .setTimestamp()
                                                                    ],
                                                                    ephemeral: true
                                                                });
                                                            } else {
                                                                await mes.edit({
                                                                    embeds: [
                                                                        new EmbedBuilder()
                                                                            .setColor("Red")
                                                                            .setTitle("An Error occurred...")
                                                                            .setDescription(`${err}`)
                                                                            .setTimestamp()
                                                                    ],
                                                                    ephemeral: true
                                                                });
                                                            }
                                                        });
                                                } else if (i.customId=="prev") {
                                                    if (page>0) {
                                                        page--;
                                                        if (page==0) {
                                                            row2.components[0].setDisabled(true);
                                                            row2.components[1].setDisabled(false);
                                                        } else {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select a Note:",
                                                            components: [rows[page], row2],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId=="next") {
                                                    if (page<rows.length-1) {
                                                        page++;
                                                        if (page==rows.length-1) {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(true);
                                                        } else {
                                                            row2.components[0].setDisabled(false);
                                                            row2.components[1].setDisabled(false);
                                                        }
                                                        await msg.edit({
                                                            content: "Select a Note:",
                                                            components: [rows[page], row2],
                                                            ephemeral: true
                                                        });
                                                    }
                                                } else if (i.customId=="cancel") {
                                                    await i.deferUpdate();
                                                    collector.stop();
                                                }
                                            });
                                            collector.on("end", async (collected) => {
                                                if (collected.size===0) {
                                                    await msg.edit({
                                                        content: "Selection timed out...",
                                                        components: [],
                                                        ephemeral: true
                                                    });
                                                } else {
                                                    client.database.writeDevLog(await client.database.writeLog(server, `Collected ${collected.size} Interactions`).catch(err => client.database.writeDevLog(`${err}`)));
                                                }
                                                setTimeout(async () => {
                                                    await msg.delete();
                                                }, 5000);
                                            });
                                        })
                                        .catch(async (err) => {
                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                            if (String(err).includes("Error 404")) {
                                                if (String(err).includes("Note")) {
                                                    await interaction.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find any Character Notes in the Database!")
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                } else {
                                                    await interaction.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find that Character in the Database. Make sure to select an existing Character!")
                                                                .setTimestamp()
                                                        ],
                                                        ephemeral: true
                                                    });
                                                }
                                            }
                                        });
                                }
                            })
                            .catch(async (err) => {
                                client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find User in the Database. Please contact the Developer if this Issue persists!")
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("An Error occurred...")
                                                .setDescription(`${err}`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                }
                            });
                    } else {
                        client.database.getUser(user)
                            .then(async (u) => {
                                if (!u.char_id) {
                                    const cmd = await server.commands.cache.find(c => c.name == "character");
                                    client.database.writeDevLog(await client.database.writeLog(server, "Error 404: No Character selected").catch(err => client.database.writeDevLog(`${err}`)));
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("Error 404: No Character selected")
                                                .setDescription(`You need to select a Character first before you use this Command! Use </character select:${cmd.id}> to select a Character.`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    client.database.getCharNote(user, {id: u.char_id}, {id: noteId})
                                        .then(async (note) => {
                                            const embed = new EmbedBuilder()
                                                .setColor("Yellow")
                                                .setAuthor({ name: user.displayName, iconURL: user.avatarURL() })
                                                .setTitle(`Note #${note.id}`)
                                                .setDescription(note.content)
                                                .setTimestamp()
                                            if (note.title) {
                                                embed.setTitle(`${note.title} (#${note.id})`);
                                            }
                                            await interaction.reply({
                                                embeds: [embed],
                                                ephemeral: note.private
                                            });
                                        })
                                        .catch(async (err) => {
                                            client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                            if (String(err).includes("Error 404")) {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle(`${err}`)
                                                            .setDescription("Could not find that Character Note in the Database!")
                                                            .setTimestamp()
                                                    ],
                                                    ephemeral: true
                                                });
                                            } else {
                                                await interaction.reply({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setColor("Red")
                                                            .setTitle("An Error occurred...")
                                                            .setDescription(`${err}`)
                                                            .setTimestamp()
                                                    ],
                                                    ephemeral: true
                                                });
                                            }
                                        });
                                }
                            })
                            .catch(async (err) => {
                                client.database.writeDevLog(await client.database.writeLog(server, `${err}`).catch(err1 => client.database.writeDevLog(`${err1}`)));
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find User in the Database. Contact the Developer if this Issue persists!")
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("An Error occurred...")
                                                .setDescription(`${err}`)
                                                .setTimestamp()
                                        ],
                                        ephemeral: true
                                    });
                                }
                            });
                    }
            break;
            case "add":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Add Character Note
                }
            break;
            case 'add':
                if (option.getSubcommandGroup() == 'notes') {
                    //TODO
                } else {
                    //TODO: Add Character
                }
            break;
            case "remove":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Remove Character Note
                }
            break;
            case "edit":
                if (option.getSubcommandGroup() == "notes") {
                    //TODO: Edit Character Note
                }
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
            const msg = await client.database.User.selectChar(user, char);

            return new SuccessEmbed(msg || 'Success', `Successfully changed active Character to ${char.name}.`);
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
    ],
});

export { command };
