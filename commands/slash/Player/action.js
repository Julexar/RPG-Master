import { 
    ApplicationCommandOptionType,
    PermissionFlagsBits 
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = false;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        const filter = m => m.user.id === user.id;

        switch (option.getSubcommand()) {
            case 'execute':
                //TODO: Execute a Character Action
            break;
            case 'add':
                //TODO: Add a Character Action
            break;
            case 'remove':
                //TODO: Remove a Character Action
            break;
            case 'edit':
                //TODO: Edit a Character Action
            break;
            case 'list':
                //TODO: List all Character Actions
            break;
        }
    }
}

const command = new Command({
    name: 'action',
    nick: 'a',
    description: 'Character Actions',
    defaultMemberPermissions: [PermissionFlagsBits.SendMessages],
    options: [
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
        {
            name: 'list',
            description: 'Lists all Actions',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ]
});

export { command };
