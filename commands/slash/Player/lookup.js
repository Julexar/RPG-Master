import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { ListEmbed, ErrorEmbed } from '../../../custom/embeds';
import { NotFoundError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const user = interaction.user;
        const server = interaction.guild;
        const filter = m => m.user.id === user.id;

        let msg, collector, menu;

        const row1 = new ActionRowBuilder();
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true),
            new ButtonBuilder().setCustomId('next').setStyle(ButtonStyle.Secondary).setEmoji('⏩'),
            new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Cancel')
        );

        const rows = [];

        let num,
            count,
            page = 0;

        switch (option.getSubcommand()) {
            case 'armor':
                row1.addComponents(new StringSelectMenuBuilder().setCustomId('armorsel').setPlaceholder('No Armor selected...').setMaxValues(1));

                rows.push(row1);

                try {
                    const armors = await client.database.Server.armors.getAll(server);

                    const menu = new ListEmbed('Armor List');

                    for (const armor of armors) {
                        if (count === 24) {
                            rows.push(row1);
                            count = 0;
                            num++;
                        }

                        rows[num].components[0].addOptions({
                            label: armor.name,
                            value: `${armor.id}`,
                        });

                        count++;
                    }

                    msg = await interaction.reply({
                        content: 'Select an Armor:',
                        embeds: [menu],
                        components: [rows[page], row2],
                    });

                    collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                    collector.on('collect', async i => {
                        await i.deferUpdate();

                        switch (i.customId) {
                            case 'armorsel':
                                const armorId = Number(i.values[0]);

                                const armor = await client.database.Server.armors.getOne(server, { id: armorId });

                                menu.data.title = armor.name;
                                menu.data.description =
                                    armor.attune ?
                                        armor.attune_req ?
                                            `_Requires Attunement by (a) ${armor.attune_req}_\n\n` + armor.description
                                        :   `_Requires Attunement_\n\n` + armor.description
                                    :   armor.description;
                                menu.addFields(
                                    {
                                        name: 'Rarity',
                                        value: armor.rarity,
                                        inline: true,
                                    },
                                    {
                                        name: 'Type',
                                        value: armor.type + ' Armor',
                                        inline: true,
                                    },
                                    {
                                        name: 'AC',
                                        value: `${armor.ac}`,
                                        inline: true,
                                    },
                                    {
                                        name: 'Strength Requirement',
                                        value: armor.str_req ? `${armor.str_req}` : 'None',
                                        inline: true,
                                    },
                                    {
                                        name: 'Dex Bonus',
                                        value: armor.dex_bonus ? `${armor.dex_bonus}` : 'None',
                                        inline: true,
                                    }
                                );

                                await msg.edit({
                                    content: '',
                                    embeds: [menu],
                                    components: [],
                                });

                                collector.stop();
                                break;
                            case 'prev':
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
                                        content: 'Select an Armor:',
                                        embeds: [menu],
                                        components: [rows[page], row2],
                                    });
                                }
                                break;
                            case 'next':
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
                                        content: 'Select an Armor:',
                                        embeds: [menu],
                                        components: [rows[page], row2],
                                    });
                                }
                                break;
                            case 'cancel':
                                collector.stop();
                                break;
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: 'Selection timed out...',
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
                } catch (err) {
                    client.logServerError(server, err);

                    if (err instanceof NotFoundError)
                        return interaction.reply({
                            embeds: [new ErrorEmbed(err, false)],
                        });

                    return interaction.reply({
                        embeds: [new ErrorEmbed(err, true)],
                    });
                }
                break;
            case 'class':
                row1.addComponents(new StringSelectMenuBuilder().setCustomId('classsel').setPlaceholder('No Class selected...').setMaxValues(1));

                rows.push(row1);

                try {
                    const classes = await client.database.Server.classes.getAll(server);

                    const menu = new ListEmbed('Class List');

                    for (const servClas of classes) {
                        if (count === 24) {
                            rows.push(row1);
                            count = 0;
                            num++;
                        }

                        rows[num].components[0].addOptions({
                            label: servClas.name,
                            value: `${servClas.id}`,
                        });

                        count++;
                    }

                    msg = await interaction.reply({
                        content: 'Select a Class:',
                        embeds: [new ListEmbed('Class List')],
                        components: [rows[page], row2],
                    });

                    collector = msg.createMessageComponentCollector({ filter, time: 90000 });

                    collector.on('collect', async i => {
                        await i.deferUpdate();

                        switch (i.customId) {
                            case 'classsel':
                                const classId = Number(i.values[0]);

                                const servClas = await client.database.Server.classes.getOne(server, { id: classId });

                                menu.data.title = servClas.class.name;

                                let traitList = '';
                                let prevlvl;

                                const traits = await client.database.Class.traits.getAll(servClas.class);

                                for (const trait of traits) {
                                    if (prevlvl === trait.level) traitList += `, ${trait.name}`;
                                    else traits += `\n\`${trait.level}\` ${trait.name}`;

                                    prevlvl = trait.level;
                                }

                                let profs = {
                                    armor: [],
                                    weapon: [],
                                    tool: [],
                                    skill: [],
                                    lang: [],
                                };

                                const clasProfs = await client.database.Class.profs.getAll(servClas.class);

                                for (const prof of clasProfs) {
                                    switch (prof.type) {
                                        case 'armor':
                                            profs.armor.push(prof.name);
                                            break;
                                        case 'weapon':
                                            profs.weapon.push(prof.name);
                                            break;
                                        case 'tool':
                                            profs.tool.push(prof.name);
                                            break;
                                        case 'skill':
                                            profs.skill.push(prof.name);
                                            break;
                                        case 'language':
                                            profs.lang.push(prof.name);
                                            break;
                                    }
                                }

                                let saveList = [];

                                const saves = await client.database.Class.saves.getAll(servClas.class);

                                for (const save of saves) {
                                    saveList.push(save.stat);
                                }

                                menu.data.description = `
                                ${servClas.description}\n\n
                                ${traitList}\n\n
                                **Hit Dice:** ${servClas.class.hitdice}d${servClas.class.hitdice_size} per level\n
                                ### Starting Proficiencies\n
                                **Armor:** ${profs.armor.length ? profs.armor.join(', ') : 'None'}\n
                                **Weapons:** ${profs.weapon.length ? profs.weapon.join(', ') : 'None'}\n
                                **Tools:** ${profs.tool.length ? profs.tool.join(', ') : 'None'}\n
                                **Saving Throws:** ${saveList.length ? saveList.join(', ') : 'None'}\n
                                **Skills:** ${profs.skill.length ? profs.skill.join(', ') : 'None'}
                                `;

                                await msg.edit({
                                    content: '',
                                    embeds: [menu],
                                    components: [],
                                });

                                collector.stop();
                                break;
                            case 'prev':
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
                                        content: 'Select a Class:',
                                        embeds: [menu],
                                        components: [rows[page], row2],
                                    });
                                }
                                break;
                            case 'next':
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
                                        content: 'Select a Class:',
                                        embeds: [menu],
                                        components: [rows[page], row2],
                                    });
                                }
                                break;
                            case 'cancel':
                                collector.stop();
                                break;
                        }
                    });

                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await msg.edit({
                                content: 'Selection timed out...',
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
                } catch (err) {
                    client.logServerError(server, err);

                    if (err instanceof NotFoundError)
                        return interaction.reply({
                            embeds: [new ErrorEmbed(err, false)],
                        });

                    return interaction.reply({
                        embeds: [new ErrorEmbed(err, true)],
                    });
                }
                break;
            case 'condition':
                //TODO: Add Condition Lookup
                break;
            case 'dmgtype':
                //TODO: Add Damagetype Lookup
                break;
            case 'feat':
                //TODO: Add Feat Lookup
                break;
            case 'race':
                //TODO: Add Race Lookup
                break;
            case 'subclass':
                //TODO: Add Subclass Lookup
                break;
            case 'subrace':
                //TODO: Add Subrace Lookup
                break;
        }
    }
}

const command = new Command({
    name: 'lookup',
    description: 'Displays Information about various things',
    options: [
        {
            name: 'armor',
            description: 'Displays Information about Armor',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'class',
            description: 'Displays Information about Classes',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'condition',
            description: 'Displays Information about Conditions',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'dmgtype',
            description: 'Displays Information about Damagetypes',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'feat',
            description: 'Displays Information about Feats',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'race',
            description: 'Displays Information about Races',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'subclass',
            description: 'Displays Information about Subclasses',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'subrace',
            description: 'Displays Information about Subraces',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
});

export { command };
