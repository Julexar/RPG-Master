import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
class Command {
    constructor() {
        this.name = 'prefix';
        this.description = 'Prefix Command';
        this.enabled = true;
        this.defaultMemberPermissions = [PermissionFlagsBits.Administrator];
        this.options = [
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
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const server = interaction.guild;
        switch (option.getSubcommand()) {
            case 'add':
                const addprefix = option.getString('prefix');
                client.database
                    .addPrefix(server, addprefix)
                    .then(async (mes) => {
                        client.database
                            .writeLog(server, mes)
                            .then((msg) => client.database.writeDevLog(msg))
                            .catch((err) => client.database.writeDevLog(`${err}`));
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Green').setTitle('Success').setDescription(`Added Prefix \`${addprefix}\``).setTimestamp()],
                        });
                    })
                    .catch(async (err) => {
                        client.database
                            .writeLog(server, `${err}`)
                            .then(async (msg1) => {
                                client.database.writeDevLog(msg1);
                                if (String(err).includes('Error 409')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription(`The Prefix \`${addprefix}\` already exists on the Server!`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
                return;
            case 'remove':
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('selpref').setPlaceholder('No Prefix selected...').setMaxValues(1));
                const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('cancel').setLabel('Cancel Selection').setStyle(ButtonStyle.Danger));
                client.database
                    .getPrefixes(server)
                    .then(async (list) => {
                        for (let i = 0; i < list.length; i++) {
                            let prefix = list[i];
                            row.components[0].addOptions({
                                label: `${prefix}`,
                                value: `${prefix}`,
                            });
                        }
                        const msg = await interaction.reply({
                            content: 'Select a Prefix:',
                            components: [row, row2],
                        });
                        const filter = (m) => m.user.id == user.id;
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000,
                        });
                        collector.on('collect', async (i) => {
                            if (i.customId == 'selpref') {
                                await i.deferUpdate();
                                client.database
                                    .remPrefix(server, i.values[0])
                                    .then(async (mes) => {
                                        client.database
                                            .writeLog(server, mes)
                                            .then((msg1) => client.database.writeDevLog(msg1))
                                            .catch((err) => client.database.writeDevLog(`${err}`));
                                        if (mes.includes('Removed')) {
                                            await msg.edit({
                                                content: '',
                                                embeds: [new EmbedBuilder().setColor('Green').setTitle('Success').setDescription(`Removed Prefix \`${i.values[0]}\``).setTimestamp()],
                                                components: [],
                                            });
                                        }
                                    })
                                    .catch(async (err) => {
                                        client.database
                                            .writeLog(server, `${err}`)
                                            .then(async (msg1) => {
                                                client.database.writeDevLog(msg1);
                                                const mes = await i.deferReply();
                                                if (String(err).includes('Error 404')) {
                                                    await mes.edit({
                                                        emebeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('That Prefix does not exist within this Server!').setTimestamp()],
                                                        ephemeral: true,
                                                    });
                                                } else {
                                                    await mes.edit({
                                                        emebeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                                        ephemeral: true,
                                                    });
                                                }
                                            })
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                    });
                            } else if (i.customId == 'back') {
                                await msg.edit({
                                    content: 'Selection has been cancelled',
                                    embeds: [],
                                    components: [],
                                });
                                await collector.stop();
                            }
                        });
                        collector.on('end', async (collected) => {
                            if (collected.size === 0) {
                                await msg.edit({
                                    content: 'Selection timed out',
                                    embeds: [],
                                    components: [],
                                });
                            } else {
                                client.database
                                    .writeLog(server, `Collected ${collected.size} Interactions.`)
                                    .then((msg1) => client.database.writeDevLog(msg1))
                                    .catch((err) => client.database.writeDevLog(`${err}`));
                            }
                            setTimeout(async () => {
                                await msg.delete();
                            }, 5000);
                        });
                    })
                    .catch((err) => {
                        client.database
                            .writeLog(server, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(msg);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('There are no registered Prefixes for this Server!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
                return;
            case 'list':
                client.database
                    .getPrefixes(server)
                    .then(async (prefixes) => {
                        prefixes = prefixes.join('\n');
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#00ffff').setTitle('Prefix List').setDescription(prefixes).setTimestamp()],
                        });
                    })
                    .catch(async (err) => {
                        client.database
                            .writeLog(server, `${err}`)
                            .then(async (msg) => {
                                client.database.writeDevLog(msg);
                                if (String(err).includes('Error 404')) {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('There are no registered Prefixes for this Server!').setTimestamp()],
                                        ephemeral: true,
                                    });
                                } else {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                }
                            })
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                    });
                return;
        }
    }
}
export default new Command();
