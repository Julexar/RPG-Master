import { ApplicationCommandOptionType } from "discord.js";
class Command {
    constructor() {
        this.name = "lookup";
        this.description = "Displays Information about various things";
        this.enabled = true;
        this.options = [
            {
                name: "armor",
                description: "Displays Information about Armor",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "class",
                description: "Displays Information about Classes",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "condition",
                description: "Displays Information about Conditions",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "dmgtype",
                description: "Displays Information about Damagetypes",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "feat",
                description: "Displays Information about Feats",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "race",
                description: "Displays Information about Races",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "subclass",
                description: "Displays Information about Subclasses",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: "subrace",
                description: "Displays Information about Subraces",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ];
    }

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const server = interaction.guild;
        const filter = m => m.user.id == user.id;
        let msg;
        const menu = new EmbedBuilder()
            .setColor("#00ffff")
            .setAuthor({
                name: user.username,
                iconURL: user.avatarURL()
            })
            .setTimestamp()
        const row1 = new ActionRowBuilder();
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
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
            );
        const rows = [];
        let num = 0;
        let count = 0;
        let page = 0;
        let collector;
        switch (option.getSubcommand()) {
            case "armor":
                row1.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("armsel")
                        .setMaxValues(1)
                        .setPlaceholder("No Armor selected...")
                );
                rows.push(row1);
                client.database.getArmor(server)
                    .then(async (armors) => {
                        for (const armor of armors) {
                            if (count == 24) {
                                rows.push(row1);
                                count = 0;
                                num++;
                            }
                            rows[num].components[0].addOptions({
                                label: `${armor.name}`,
                                value: `${armor.id}`
                            });
                        }
                        msg = await interaction.reply({
                            content: "Select Armor:",
                            components: [rows[page], row2],
                            ephemeral: true
                        });
                        collector = msg.createMessageComponentCollector({
                            filter,
                            time: 90000
                        });
                        collector.on("collect", async (i) => {
                            await i.deferUpdate();
                            if (i.customId == "armsel") {
                                const id = Number(i.values[0]);
                                client.database.getArmor(server, { id: id })
                                    .then(async (arm) => {
                                        menu.setTitle(arm.name)
                                        if (arm.attune) {
                                            if (arm.attune_req) {
                                                menu.setDescription(`_Requires attunement by (a) ${arm.attune_req}_\n\n${arm.description}`);
                                            } else {
                                                menu.setDescription(`_Requires attunement_\n\n${arm.description}`);
                                            }
                                        } else {
                                            menu.setDescription(arm.description);
                                        }
                                        menu.addFields(
                                            {
                                                name: "Rarity",
                                                value: `${arm.rarity}`,
                                                inline: true
                                            },
                                            {
                                                name: "Type",
                                                value: `${type}`,
                                                inline: true
                                            },
                                            {
                                                name: "AC",
                                                value: `${arm.ac}`,
                                                inline: true,
                                            },
                                            {
                                                name: "Dex",
                                                value: `${arm.dex_bonus}`,
                                                inline: true,
                                            },
                                            {
                                                name: "Str",
                                                value: `${arm.str_req}`,
                                                inline: true
                                            }
                                        );
                                        await msg.edit({
                                            content: "",
                                            embeds: [menu],
                                            components: []
                                        });
                                    })
                                    .catch(async (err) => {
                                        client.database.writeLog(server, `${err}`)
                                            .then(async () => {
                                                if (String(err).includes("Error 404")) {
                                                    await interaction.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find that Armor in the Database!")
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
                                            })
                                            .catch(err1 => client.database.writeDevLog(`${err1}`));
                                    });
                            } else if (i.customId == "prev") {
                                page--;
                                if (page >= 0) {
                                    if (page == 0) {
                                        row2.components[0].setDisabled(true);
                                        row2.components[1].setDisabled(false);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: "Select Armor:",
                                        components: [rows[page], row2],
                                        ephemeral: true
                                    });
                                }
                            } else if (i.customId == "next") {
                                page++;
                                if (page <= rows.length - 1) {
                                    if (page == rows.length - 1) {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(true);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: "Select Armor:",
                                        components: [rows[page], row2],
                                        ephemeral: true
                                    });
                                }
                            } else if (i.customId == "cancel") {
                                await collector.stop();
                            }
                        })
                        collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                            content: "Selection timed out...",
                            components: [],
                            ephemeral: true
                            });
                        } else {
                            console.log(`Collected ${collected.size} Interactions`);
                        }
                        setTimeout(async function() {
                            await msg.delete()
                        }, 5000);
                        });
                    })
                    .catch(async (err) => {
                        client.database.writeLog(server, `${err}`)
                            .then(async () => {
                                if (String(err).includes("Error 404")) {
                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find any Armors in the Database, ask Staff or a GM to add custom Armor, using </game add armor:1124244803048177726>, before you use this Command again!")
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
                            })
                            .catch(console.error);
                    });
            break;
            case "class":
                row1.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("csel")
                        .setMaxValues(1)
                        .setPlaceholder("No Class selected...")
                );
                rows.push(row1);
                client.database.getClass(server)
                    .then(async (classes) => {
                        for (const clas of classes) {
                            if (count == 24) {
                                rows.push(row1);
                                num++;
                                count = 0;
                            }
                            rows[num].components[0].addOptions({
                                label: clas.name,
                                value: `${clas.id}`
                            });
                            count++;
                        }
                        if (rows.length < 2) {
                            row2.components[1].setDisabled(true);
                        }
                        msg = await interaction.reply({
                            content: "Select a Class:",
                            components: [rows[page], row2],
                            ephemeral: true
                        });
                        collector.on("collect", async (i) => {
                            if (i.customId == "csel") {
                                client.database.getClass(server, { id: Number(i.value[0]) })
                                    .then(async (clas) => {
                                        let traits = "";
                                        let prevlvl;
                                        for (const trait of clas.traits) {
                                            if (prevlvl == trait.level) {
                                                traits += `, ${trait.name}`;
                                            } else {
                                                traits += `\n\`${trait.level}\` ${trait.name}`;
                                            }
                                            prevlvl = trait.level;
                                        }
                                        let optfeats = [];
                                        let feats = [];
                                        for (const feat of clas.feats) {
                                            if (feat.optional) {
                                                optfeats.push(feat.name);
                                            } else {
                                                feats.push(feat.name);
                                            }
                                        }
                                        let profs = {
                                            armor: [],
                                            weapon: [],
                                            tool: [],
                                            skill: [],
                                            lang: []
                                        };
                                        for (const prof of clas.profs) {
                                            switch (prof.type) {
                                                case "armor":
                                                    profs.armor.push(prof.name);
                                                break;
                                                case "weapon":
                                                    profs.weapon.push(prof.name);
                                                break;
                                                case "tool":
                                                    profs.tool.push(prof.name);
                                                break;
                                                case "skill":
                                                    profs.skill.push(prof.name);
                                                break;
                                                case "language":
                                                    profs.lang.push(prof.name);
                                                break;
                                            }
                                        }
                                        let saves = [];
                                        for (const save of clas.saves) {
                                            saves.push(save.stat);
                                        }
                                        const menu = new EmbedBuilder()
                                            .setColor("Aqua")
                                            .setTitle(`${clas.name}`)
                                            .setDescription(`
                                                ${clas.description}\n\n
                                                ${traits}\n\n
                                                **Hit Dice:** ${clas.hitdice}d${clas.hitdice_size} per level\n
                                                **Optional Class Features**\n
                                                ${optfeats.join(", ")}\n\n
                                                **Starting Proficiencies**\n
                                                **Armor:** ${profs.armor.join(", ")}\n
                                                **Weapons:** ${profs.weapon.join(", ")}\n
                                                **Tools:** ${profs.tool.join(", ")}\n
                                                **Saving Throws:** ${saves.join(", ")}\n
                                                **Skills:** ${profs.skill.join(", ")}
                                            `)
                                            .setTimestamp()
                                        let mes = await i.deferReply();
                                        await mes.edit({
                                            embeds: [menu]
                                        });
                                    })
                                    .catch(async (err) => {
                                        let mes = await i.deferReply();
                                        client.database.writeLog(server, `${err}`)
                                            .then(async () => {
                                                if (String(err).includes("Error 404")) {
                                                    await mes.edit({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setColor("Red")
                                                                .setTitle(`${err}`)
                                                                .setDescription("Could not find this Class in the Database! Contact the Developer if this Issue persists.")
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
                                            })
                                            .catch(err => client.database.writeDevLog(`${err}`));
                                    });
                            } else if (i.customId == "prev") {
                                await i.deferUpdate();
                                if (page > 0) {
                                    page--;
                                    if (page == 0) {
                                        row2.components[0].setDisabled(true);
                                        row2.components[1].setDisabled(false);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: "Select a Class:",
                                        components: [rows[page], row2],
                                        ephemeral: true
                                    });
                                }
                            } else if (i.customId == "next") {
                                await i.deferUpdate();
                                if (page < rows.length - 1) {
                                    page++;
                                    if (page == rows.length - 1) {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(true);
                                    } else {
                                        row2.components[0].setDisabled(false);
                                        row2.components[1].setDisabled(false);
                                    }
                                    await msg.edit({
                                        content: "Select a Class:",
                                        components: [rows[page], row2],
                                        ephemeral: true
                                    });
                                }
                            } else if (i.customId == "cancel") {
                                await i.deferUpdate();
                                collector.stop();
                            }
                        });
                        collector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await msg.edit({
                            content: "Selection timed out...",
                            components: [],
                            ephemeral: false
                            });
                        } else {
                            console.log(`Collected ${collected.size} Interactions`);
                        }
                        setTimeout(async () => {
                            await msg.delete();
                        }, 5000);
                        });
                    })
                    .catch(async (err) => {
                        client.database.writeLog(server, `${err}`)
                            .then(async () => {
                                if (String(err).includes("Error 404")) {
                                    await msg.edit({
                                        content: "",
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle(`${err}`)
                                                .setDescription("Could not find any Classes in the Database! Contact the Developer if this Issue persists.")
                                                .setTimestamp()
                                        ],
                                        components: [],
                                        ephemeral: true
                                    });
                                } else {
                                    await msg.edit({
                                        content: "",
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setTitle("An Error occurred...")
                                                .setDescription(`${err}`)
                                                .setTimestamp()
                                        ],
                                        components: [],
                                        ephemeral: true
                                    });
                                }
                            })
                            .catch(console.error);
                    });
            break;
            case "condition":
                //TODO
            break;
            case "dmgtype":
                //TODO
            break;
            case "feat":
                //TODO
            break;
            case "race":
                //TODO
            break;
            case "subclass":
                //TODO
            break;
            case "subrace":
                //TODO
            break;
        }
    }
}
export default new Command();