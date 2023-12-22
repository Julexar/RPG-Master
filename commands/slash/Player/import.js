import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import fs from 'fs';
class Command {
    constructor() {
        this.name = 'import';
        this.description = 'Imports a Character from D&D Beyond';
        this.enabled = true;
        this.options = [
            {
                name: 'link',
                description: 'Provide a Link to the Character',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ];
    }

    async getCharacterData(url) {
        return new Promise(async (resolve, reject) => {
            const api_url = 'https://character-service.dndbeyond.com/character/v5/character/';
            const id = url.replace(/.*\/characters\//, '').replace(/\/.*/, '');
            const result = await fetch(api_url + id);
            const text = await result.text();
            const char = JSON.parse(text).data;
            if (!char) {
                reject('Error 400: Invalid Link');
            } else {
                fs.writeFileSync('./logs/char.json', JSON.stringify(char, null, '\t'));
                resolve(char);
            }
        });
    }

    async run(client, interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const url = option.getString('link');
        this.getCharacterData(url)
            .then(async (char) => {
                client.database
                    .getChar(user, { name: char.name })
                    .then(async () => {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle('Error 409: Duplicate Character').setDescription('You already have a Character with that Name!').setTimestamp()],
                            ephemeral: true,
                        });
                    })
                    .catch(async (err) => {
                        if (String(err).includes('Error 404')) {
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
                                pp: char.currencies.pp,
                                gp: char.currencies.gp,
                                ep: char.currencies.ep,
                                sp: char.currencies.sp,
                                cp: char.currencies.cp,
                                stats: {
                                    str: {
                                        val: char.stats[0].value,
                                    },
                                    dex: {
                                        val: char.stats[1].value,
                                    },
                                    con: {
                                        val: char.stats[2].value,
                                    },
                                    int: {
                                        val: char.stats[3].value,
                                    },
                                    wis: {
                                        val: char.stats[4].value,
                                    },
                                    cha: {
                                        val: char.stats[5].value,
                                    },
                                },
                                multi: false,
                                armor: {
                                    name: null,
                                },
                                race: {
                                    name: null,
                                },
                                subrace: {
                                    name: null,
                                },
                                class: {
                                    name: null,
                                    level: 1,
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
                                },
                                mc2: {
                                    name: null,
                                    level: 1,
                                },
                                mc2_sub: {
                                    name: null,
                                },
                                mc3: {
                                    name: null,
                                    level: 1,
                                },
                                mc3_sub: {
                                    name: null,
                                },
                                senses: char.customSenses,
                                feats: char.feats,
                                profs: char.customProficiencies,
                                actions: char.actions + char.customActions,
                                spells: char.spells,
                                resistances: [],
                                immunities: [],
                            };
                            if (char.race.isSubRace) {
                                character.race.name = char.race.baseRaceName;
                                character.subrace.name = char.race.fullName;
                            }
                            if (char.classes.length > 1) {
                                character.multi = true;
                            }
                            let num = 0;
                            for (const clas of char.classes) {
                                if (clas.isStartingClass) {
                                    character.class.name = clas.definition.name;
                                    character.class.level = clas.level;
                                    if (clas.subclassDefinition) {
                                        character.subclass.name = clas.subclassDefinition.name;
                                    }
                                    num++;
                                } else {
                                    if (num == 1) {
                                        character.mc1.name = clas.definition.name;
                                        character.mc1.level = clas.level;
                                        if (clas.subclassDefinition) {
                                            character.mc1_sub.name = clas.subclassDefinition.name;
                                        }
                                    } else if (num == 2) {
                                        character.mc2.name = clas.definition.name;
                                        character.mc2.level = clas.level;
                                        if (clas.subclassDefinition) {
                                            character.mc2_sub.name = clas.subclassDefinition.name;
                                        }
                                    } else if (num == 3) {
                                        character.mc3.name = clas.definition.name;
                                        character.mc3.level = clas.level;
                                        if (clas.subclassDefinition) {
                                            character.mc3_sub.name = clas.subclassDefinition.name;
                                        }
                                    }
                                    num++;
                                }
                            }
                            for (const rmod of char.modifiers.race) {
                                if (rmod.type == 'immunity') {
                                    character.immunities.push({
                                        name: rmod.friendlySubtypeName,
                                    });
                                } else if (rmod.type == 'resistance') {
                                    character.resistances.push({
                                        name: rmod.friendlySubtypeName,
                                    });
                                }
                            }
                            for (const cmod of char.modifiers.class) {
                                if (cmod.type == 'immunity') {
                                    character.immunities.push({
                                        name: cmod.friendlySubtypeName,
                                    });
                                } else if (cmod.type == 'resistance') {
                                    character.resistances.push({
                                        name: cmod.friendlySubtypeName,
                                    });
                                }
                            }
                            for (const item of char.inventory) {
                                if (item.type.includes('Armor')) {
                                    if (item.type.includes('Light') || item.type.includes('Medium')) {
                                        character.ac = item.armorClass + char.stats[1].value;
                                    }
                                } else if (item.type.includes('Shield')) {
                                    character.ac += item.armorClass;
                                }
                            }
                            client.database
                                .addChar(server, user, character)
                                .then(async () => {
                                    await interaction.reply({
                                        content: 'Character has been imported!',
                                    });
                                })
                                .catch(async (err) => {
                                    client.database
                                        .writeLog(server, `${err}`)
                                        .then(async () => {
                                            await interaction.reply({
                                                embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occured during Character Import!').setDescription(`${err}`).setTimestamp()],
                                                ephemeral: true,
                                            });
                                        })
                                        .catch(console.error);
                                });
                        } else {
                            client.database
                                .writeLog(server, `${err}`)
                                .then(async () => {
                                    await interaction.reply({
                                        embeds: [new EmbedBuilder().setColor('Red').setTitle('An Error occurred...').setDescription(`${err}`).setTimestamp()],
                                        ephemeral: true,
                                    });
                                })
                                .catch(console.error);
                        }
                    });
            })
            .catch(async (err) => {
                client.database
                    .writeLog(server, `${err}`)
                    .then(async () => {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setTitle(`${err}`).setDescription('The Link you provided is invalid!').setTimestamp()],
                            ephemeral: true,
                        });
                    })
                    .catch(console.error);
            });
    }
}
export default new Command();
