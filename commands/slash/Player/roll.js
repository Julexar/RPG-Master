import { ApplicationCommandOptionType } from "discord.js";
class Command {
    constructor() {
        this.name = "roll";
        this.nick = "r";
        this.description = "Rolls some Dice";
        this.enabled = true;
        this.options = [
            {
                name: "custom",
                description: "Rolls a custom dice formula",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "formula",
                        description: "Provide a dice formula.",
                        type: ApplicationCommandOptionType.String
                    },
                ],
            },
            {
                name: "fixed",
                description: "Rolls a predetermined dice formula",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: "amount",
                        description: "Provide the number of dice",
                        type: ApplicationCommandOptionType.Number,
                        required: true,
                    },
                    {
                        name: "dice",
                        description: "Select a Dice",
                        type: ApplicationCommandOptionType.String,
                        choices: [
                            {
                                name: "d100",
                                value: "d100",
                            },
                            {
                                name: "d20",
                                value: "d20",
                            },
                            {
                                name: "d12",
                                value: "d12",
                            },
                            {
                                name: "d10",
                                value: "d10",
                            },
                            {
                                name: "d8",
                                value: "d8",
                            },
                            {
                                name: "d6",
                                value: "d6",
                            },
                            {
                                name: "d4",
                                value: "d4"
                            },
                        ],
                        required: true,
                    },
                    {
                        name: "bonus",
                        description: "Provide the bonus",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
        ];
    }

    splitMessage(message) {
        const regex = /(\d+d\d+)|([-+]\s*)?(\d+)/g;
        const matches = message.match(regex);
        const components = {
            beforeD: [],
            afterD: [],
            arguments: []
        };
        let currentComponent = 'beforeD';
        for (let match of matches) {
            if (match.includes('+')) {
                currentComponent = 'arguments';
                match = match.replace("+ ", "");
                components[currentComponent].push(Number(match));
            } else if (match.includes('-')) {
                currentComponent = 'arguments';
                match = match.replace("- ", "-");
                components[currentComponent].push(Number(match));
            } else if (match.includes('d')) {
                const [numDice, numSides] = match.split('d').map(Number);
                components[currentComponent].push(numDice);
                components.afterD.push(numSides);
            }
        }
        return components;
    }

    rollDice(numDice, numSides) {
        const rolls = [];
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
        }
        return rolls;
    }

    diceRoller(message) {
        const components = this.splitMessage(message);
        let total = 0;
        let output = '';

        for (let i = 0; i < components.beforeD.length; i++) {
            const numDice = components.beforeD[i];
            const numSides = components.afterD[i];
            const rolls = this.rollDice(numDice, numSides);
            const rollSum = rolls.reduce((a, b) => a + b, 0);
            total += rollSum;
            output += `${numDice}d${numSides} (${rolls.join(', ')}) `;
        }

        for (let arg of components.arguments) {
            total += arg;
            arg = String(arg).replace(`${arg}`, `+ ${arg}`).replace("-", "- ");
            output += `${arg}`;
        }
        return { total, output };
    }

    async run(client, interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const filter = m => m.user.id == user.id;
        let collector;
        switch (option.getSubcommand()) {
            case "custom":
                const forms = option.getString("formula");
                if (!forms) {
                    const menu = new EmbedBuilder()
                        .setColor("#00ffff")
                        .setTitle("Formula Builder")
                        .setDescription("This is the Formula Builder, your current formula will be shown below")
                        .setFields({
                            name: "Formula",
                            value: "\ "
                        })
                        .setTimestamp()
                    const row1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("setform")
                                .setLabel("Set Formula")
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("📝")
                        );
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("finish")
                                .setLabel("Finish Formula")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId("cancel")
                                .setLabel("Cancel")
                                .setStyle(ButtonStyle.Danger)
                        );
                    const msg = await interaction.reply({
                        embeds: [menu],
                        components: [row1, row2],
                        ephemeral: true
                    });
                    collector = msg.createMessageComponentCollector({
                        filter,
                        time: 90000
                    });
                    collector.on("collect", async (i) => {
                        if (i.customId == "setform") {
                            const mr = new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId("formula")
                                        .setLabel("Provide your Formula:")
                                        .setStyle(TextInputStyle.Short)
                                        .setRequired(true)
                                );
                            const modal = new ModalBuilder()
                                .setCustomId("diceform")
                                .setTitle("Dice Formula")
                                .addComponents(mr);
                            await i.showModal(modal);
                            const filt = int => int.customId == 'diceform';
                            i.awaitModalSubmit({
                                filt,
                                time: 35000
                            })
                                .then(async (inter) => {
                                    await inter.deferUpdate();
                                    const form = inter.fields.getTextInputValue('formula');
                                    menu.setFields({
                                        name: "Formula",
                                        value: form
                                    });
                                    await msg.edit({
                                        embeds: [menu],
                                        components: [row1, row2],
                                        ephemeral: true
                                    });
                                })
                                .catch(console.error);
                        } else if (i.customId == "finish") {
                            const formula = menu.data.fields[0].value;
                            const result = this.diceRoller(formula);
                            const mes = await i.deferReply();
                            await mes.edit({
                                content: `<@${user.id}> 🎲\n**Result:** ${result.output}\n**Total:** ${result.total}`
                            });
                        } else if (i.customId == "cancel") {
                            await i.deferUpdate();
                            await collector.stop();
                        }
                    });
                    collector.on("end", async () => {
                        await msg.edit({
                            embeds: [menu],
                            components: [],
                            ephemeral: true
                        });
                    });
                } else {
                    const result = this.diceRoller(forms);
                    await interaction.reply({
                        content: `<@${user.id}> 🎲\n**Result:** ${result.output}\n**Total:** ${result.total}`
                    });
                }
            return;
            case "fixed":
                const amount = String(option.getNumber("amount"));
                const dice = option.getString("dice");
                const bonus = " " + option.getString("bonus");
                const formula = amount + dice + bonus;
                const result = this.diceRoller(formula);
                await interaction.reply({
                    content: `<@${user.id}> 🎲\n**Result:** ${result.output}\n**Total:** ${result.total}`
                });
            return;
        }
    }
}
export default new Command();