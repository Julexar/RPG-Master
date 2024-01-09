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
        //TODO: Rewrite this entire thing
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
