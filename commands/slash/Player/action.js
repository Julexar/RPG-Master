import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
class Command {
    constructor() {
        this.name = 'action';
        this.nick = 'a';
        this.description = 'Character Action Commands';
        this.enabled = false;
        this.defaultMemberPermissions = [PermissionFlagsBits.SendMessages];
        this.options = [
            {
                name: 'execute',
                description: 'Executes an Action',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'add',
                description: 'Adds an Action',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'remove',
                description: 'Removes an Action',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'edit',
                description: 'Edits an Action',
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;

        switch (option.getSubcommand()) {
            case 'execute':
                client.database
                    .getUser(user)
                    .then((u) => {
                        client.database
                            .getChar(u, { id: u.char_id })
                            .then((char) => {
                                client.database
                                    .getCharAction(server, user, char)
                                    .then((actions) => {
                                        //TODO
                                    })
                                    .catch(async (err) => {
                                        client.database
                                            .writeLog(server, `${err}`)
                                            .then((msg) => client.database.writeDevLog(msg))
                                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                                        if (err.includes('Error 404')) {
                                            return await interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setTitle(`${err}`)
                                                        .setDescription(
                                                            'Could not find any Actions for this Character in the Databse. Please add an action using </action add:1234> first!'
                                                        )
                                                        .setTimestamp(),
                                                ],
                                                ephemeral: true,
                                            });
                                        } else {
                                            return await interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setTitle('An Error occurred...')
                                                        .setDescription(`${err}`)
                                                        .setTimestamp(),
                                                ],
                                                ephemeral: true,
                                            });
                                        }
                                    });
                            })
                            .catch(async (err) => {
                                client.database
                                    .writeLog(server, `${err}`)
                                    .then((msg) => client.database.writeDevLog(msg))
                                    .catch((err1) => client.database.writeDevLog(`${err1}`));
                                if (String(err).includes('Error 404')) {
                                    return await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Red')
                                                .setTitle(`${err}`)
                                                .setDescription(
                                                    'Could not find that Character in the Database. Contact the Developer if this Issue persists!'
                                                )
                                                .setTimestamp(),
                                        ],
                                        ephemeral: true,
                                    });
                                } else {
                                    return await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Red')
                                                .setTitle('An Error occurred...')
                                                .setDescription(`${err}`)
                                                .setTimestamp(),
                                        ],
                                        ephemeral: true,
                                    });
                                }
                            });
                    })
                    .catch(async (err) => {
                        client.database
                            .writeLog(server, `${err}`)
                            .then((msg) => client.database.writeDevLog(msg))
                            .catch((err1) => client.database.writeDevLog(`${err1}`));
                        if (String(err).includes('Error 404')) {
                            return await interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setTitle(`${err}`)
                                        .setDescription('Could not find User in the Database. Contact the Developer if this Issue persists!')
                                        .setTimestamp(),
                                ],
                                ephemeral: true,
                            });
                        } else {
                            return await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                ephemeral: true,
                            });
                        }
                    });
                return;
            case 'add':
                //TODO
                return;
            case 'remove':
                //TODO
                return;
            case 'edit':
                //TODO
                return;
        }
    }
}
export default new Command();
