import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
class Command {
    constructor() {
        this.name = "help";
        this.description = "Displays Info about Commands";
        this.enabled = true;
        this.options = [
            {
                name: "command",
                description: "Select a Command",
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const cmd = option.getString("command");
        const member = interaction.member;
        const server = interaction.guild;
        if (cmd) {
            const command = await server.commands.cache.find(c => c.name == cmd);
            const embed = new EmbedBuilder()
                .setColor("Aqua")
                .setTimestamp()
            if (command.defaultMemberPermissions) {
                if (member.permissions.has(command.defaultMemberPermissions)) {
                    if (!command.options) {
                        embed.setTitle(`</${command.name}:${command.id}>`);
                        embed.setDescription(`${command.description}`);
                        await interaction.reply({
                            embeds: [embed]
                        });
                    } else {
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId("prev")
                                    .setEmoji("⏪")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId("next")
                                    .setEmoji("⏩")
                                    .setStyle(ButtonStyle.Secondary)
                            );
                        embed.setTitle(`</${command.name}:${command.id}>`);
                        embed.setDescription(`${command.description}`);
                        const menus = [];
                        let num = 0;
                        let count = 0;
                        menus.push(embed);
                        for (const opt of command.options) {
                            if (count == 10) {
                                menus.push(embed);
                                num++;
                                count = 0;
                            }
                            if (opt.type == ApplicationCommandOptionType.SubcommandGroup) {
                                for (const opt2 of opt.options) {
                                    if (opt2.type == ApplicationCommandOptionType.Subcommand) {
                                        menus[num].addFields({
                                            name: `</${command.name} ${opt.name} ${opt2.name}:${command.id}>`,
                                            value: `${opt2.description}`,
                                        });
                                        count++;
                                    }
                                }
                            } else if (opt.type == ApplicationCommandOptionType.Subcommand) {
                                menus[num].addFields({
                                    name: `</${command.name} ${opt.name}:${command.id}>`,
                                    value: `${opt.description}`,
                                });
                                count++;
                            }
                        }
                        let page = 0;
                        const msg = await interaction.reply({
                            embeds: [menus[page]],
                            components: [row]
                        });
                        const filter = m => m.user.id == user.id;
                        const collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000
                        });
                        collector.on("collect", async (i) => {
                            await i.deferUpdate();
                            if (i.customId == "prev") {
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row.components[0].setDisabled(true);
                                        row.components[1].setDisabled(false);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row]
                                    });
                                }
                            } else if (i.customId == "next") {
                                if (page < menus.length - 1) {
                                    page++;
                                    if (page == menus.length - 1) {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(true);
                                    } else {
                                        row.components[0].setDisabled(false);
                                        row.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        embeds: [menus[page]],
                                        components: [row]
                                    });
                                }
                            }
                        });
                        collector.on("end", async (collected) => {
                            if (collected.size >= 1) {
                                console.log(`Collected ${collected.size} Interactions`);
                            }
                            row.components[0].setDisabled(true);
                            row.components[1].setDisabled(true);
                            await msg.edit({
                                embeds: [menus[page]],
                                components: [row]
                            });
                            setTimeout(async function() {
                                await msg.delete();
                            }, 5000);
                        });
                    }
                } else {
                    let perms = member.permissions.missing(command.defaultMemberPermissions);
                    client.database.writeLog(server, "Error 403: Missing Permission")
                        .then(async () => {
                            await interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setTitle("Error 403: Missing Permission")
                                        .setDescription("You are missing the necessary Permissions to view this Command:\n" + perms.join(', '))
                                        .setTimestamp()
                                ],
                                ephemeral: true
                            });
                        })
                        .catch(err => client.database.writeDevLog(`${err}`));
                }
            } else {
                if (!command.options) {
                    embed.setTitle(`</${command.name}:${command.id}>`);
                    embed.setDescription(`${command.description}`);
                } else {
                    for (const opt in command.options) {
                        if (opt.type == ApplicationCommandOptionType.SubcommandGroup) {
                            for (const opt2 in opt.options) {
                                if (opt2.type == ApplicationCommandOptionType.Subcommand) {
                                    embed.setTitle(`</${command.name} ${opt.name} ${opt2.name}:${command.id}>`);
                                    embed.setDescription(`${opt2.description}`);
                                }
                            }
                        } else if (opt.type == ApplicationCommandOptionType.Subcommand) {
                            embed.setTitle(`</${command.name} ${opt.name}:${command.id}>`);
                            embed.setDescription(`${opt.description}`);
                        }
                    }
                }
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        } else {
            const embeds = [];
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji("⏪")
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji("⏩")
                );
            embeds.push(
                new EmbedBuilder()
                    .setColor("Aqua")
                    .setTitle("Slash Command List")
                    .setTimestamp()
            );
            let count = 0;
            let num = 0;
            server.commands.cache.forEach(command => {
                if (command.defaultMemberPermissions) {
                    if (member.permissions.has(command.defaultMemberPermissions)) {
                        if (count == 10) {
                            embeds.push(
                                new EmbedBuilder()
                                    .setColor("Aqua")
                                    .setTitle("Slash Command List")
                                    .setTimestamp()
                            );
                            count = 0;
                            num++;
                        }
                        embeds[num].addFields({
                            name: `</${command.name}:${command.id}>`,
                            value: `${command.description}`
                        });
                        count++;
                    } else if (!member.permissions.has(command.defaultMemberPermissions)) {
                        return;
                    }
                } else {
                    if (count == 10) {
                        embeds.push(
                            new EmbedBuilder()
                                .setColor("Aqua")
                                .setTitle("Slash Command List")
                                .setTimestamp()
                        );
                        count = 0;
                        num++;
                    }
                    embeds[num].addFields({
                        name: `</${command.name}:${command.id}>`,
                        value: `${command.description}`
                    });
                    count++;
                }
            });
            let page = 0;
            if (embeds.length === 1) {
                row.components[1].setDisabled(true)
                await interaction.reply({
                    embeds: [embeds[page]],
                    components: [row]
                });
            } else if (embeds.length > 1) {
                const filter = m => m.user.id == interaction.user.id;
                const msg = await interaction.reply({
                    embeds: [embeds[page]],
                    components: [row]
                });
                const collector = msg.createMessageComponentCollector({
                    filter,
                    time: 90000
                });
                collector.on("collect", async (i) => {
                    await i.deferUpdate();
                    if (i.customId == "prev") {
                        if (page > 0) {
                            page--;
                            if (page == 0) {
                                row.components[0].setDisabled(true);
                                row.components[1].setDisabled(false);
                            } else {
                                row.components[0].setDisabled(false);
                                row.components[1].setDisabled(false);
                            }
                            await msg.edit({
                                embeds: [embeds[page]],
                                components: [row]
                            });
                        }
                    } else if (i.customId == "next") {
                        if (page < embeds.length - 1) {
                            page++;
                            if (page == embeds.length - 1) {
                                row.components[0].setDisabled(false);
                                row.components[1].setDisabled(true);
                            } else {
                                row.components[0].setDisabled(false);
                                row.components[1].setDisabled(false);
                            }
                            await msg.edit({
                                embeds: [embeds[page]],
                                components: [row]
                            });
                        }
                    }
                });
                collector.on("end", async (collected) => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);
                    await msg.edit({
                        embeds: [embeds[page]],
                        components: [row]
                    });
                    console.log(`Collected ${collected.size} Interactions`);
                });
            }
        }
    }
}
export default new Command();