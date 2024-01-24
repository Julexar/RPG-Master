import { ApplicationCommandOptionType } from 'discord.js';
import fs from 'fs';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { BadRequestError, DuplicateError } from '../../../custom/errors';
import { SuccessEmbed, ErrorEmbed } from '../../../custom/embeds';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    async getCharacterData(url) {
        const api_url = 'https://character-service.dndbeyond.com/character/v5/character/';
        const id = url.replace(/.*\/characters\//, '').replace(/\/.*/, '');
        const result = await fetch(api_url + id);
        const text = await result.text();
        const char = JSON.parse(text).data;
        if (!char) {
            throw new BadRequestError('Error 400: Invalid Link', 'The provided Link is invalid! Please provide a link to a D&D Beyond Character');
        } else {
            fs.writeFileSync('./logs/char.json', JSON.stringify(char, null, '\t'));
            return char;
        }
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const url = option.getString('link');

        try {
            const char = await this.getCharacterData(url);

            const dbChar = await client.database.Character.getOne(user, { name: char.name });

            if (dbChar) {
                throw new DuplicateError(
                    'Character already exists',
                    'You already have a Character with this name! Please delete it or choose a different name.'
                );
            }

            const character = {
                name: char.name,
                portrait: char.avatarURL,
                ac: 10,
                init: char.stats[1].value,
                level: Math.floor(char.currentXp / 300),
                hp: char.baseHitPoints - char.removedHitPoints,
                hp_max: char.baseHitPoints,
                hp_temp: char.temporaryHitPoints,
                xp: char.currentXp,
                money: char.currencies,
                stats: {
                    str: char.stats[0].value,
                    dex: char.stats[1].value,
                    con: char.stats[2].value,
                    int: char.stats[3].value,
                    wis: char.stats[4].value,
                    cha: char.stats[5].value,
                },
                multi: char.classes.length > 1,
                armor: {
                    name: null,
                },
                race: {
                    name: char.race.baseRaceName,
                },
                class: {
                    name: null,
                },
                subrace: {
                    name: char.race.isSubrace ? char.race.subRaceShotName : null,
                },
                subclass: {
                    name: null,
                },
                mc1: {
                    name: null,
                    level: 1,
                },
                mc1_sub: {
                    name: null,
                    level: 1,
                },
                mc2: {
                    name: null,
                    level: 1,
                },
                mc2_sub: {
                    name: null,
                    level: 1,
                },
                mc3: {
                    name: null,
                    level: 1,
                },
                mc3_sub: {
                    name: null,
                    level: 1,
                },
                senses: char.customSenses,
                feats: char.feats,
                profs: char.customProficiencies,
                actions: char.actions + char.customActions,
                spells: char.spells,
                resistances: [],
                immunities: [],
            };

            let num = 0;
            for (const clas of char.classes) {
                if (clas.isStartingClass) {
                    character.class.name = clas.definition.name;
                    character.class.level = clas.level;

                    if (clas.subclassDefinition) character.subclass.name = clas.subclassDefinition.name;

                    num++;
                } else {
                    if (num === 1) {
                        character.mc1.name = clas.definition.name;
                        character.mc1.level = clas.level;

                        if (clas.subclassDefinition) character.mc1_sub.name = clas.subclassDefinition.name;
                    } else if (num === 2) {
                        character.mc2.name = clas.definition.name;
                        character.mc2.level = clas.level;

                        if (clas.subclassDefinition) character.mc2_sub.name = clas.subclassDefinition.name;
                    } else if (num === 3) {
                        character.mc3.name = clas.definition.name;
                        character.mc3.level = clas.level;

                        if (clas.subclassDefinition) character.mc3_sub.name = clas.subclassDefinition.name;
                    }
                    num++;
                }

                for (const mod of char.modifiers.race) {
                    if (mod.type === 'immunity') character.immunities.push({ name: mod.friendlySubtypeName });
                    else if (mod.type === 'resistance') character.resistances.push({ name: mod.friendlySubtypeName });
                }

                for (const mod of char.modifiers.class) {
                    if (mod.type === 'immunity') character.immunities.push({ name: mod.friendlySubtypeName });
                    else if (mod.type === 'resistance') character.resistances.push({ name: mod.friendlySubtypeName });
                }

                for (const item of char.inventory) {
                    if (item.type.includes('Armor')) {
                        character.armor.name = item.definition.name;
                        character.ac =
                            item.type.includes('Light') || item.type.includes('Medium') ? item.armorClass + char.stats[1].value : item.armorClass;
                    } else if (item.type.includes('Shield')) {
                        character.ac += item.armorClass;
                    }
                }

                const msg = await client.database.Character.add(user, character);

                await interaction.reply({
                    embeds: [new SuccessEmbed(msg || 'Success', `Your Character has been successfully imported!`)],
                });
            }
        } catch (err) {
            client.logServerError(server, err);

            if (err instanceof BadRequestError || err instanceof DuplicateError)
                return await interaction.reply({
                    embeds: [new ErrorEmbed(err, false)],
                });

            return await interaction.reply({
                embeds: [new ErrorEmbed(err, true)],
            });
        }
    }
}

const command = new Command({
    name: 'import',
    description: 'Imports a D&D Beyond Character',
    options: [
        {
            name: 'link',
            description: 'The link to the Character',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
});

export { command };
