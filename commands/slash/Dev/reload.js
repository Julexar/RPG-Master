import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
let cmds;

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
        this.choices = true;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {

    }

    /**
     * @param {import("discord.js").Guild} guild
     */
    setChoices(guild) {
        cmds = guild.commands.cache.map(cmd => ({name: cmd.name, value: `${cmd.id}`}));
    }
}

const command = new Command({
    name: 'reload',
    description: 'Reloads a Command',
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'command',
            description: 'Reloads a single Command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'Provide a Command',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: cmds,
                },
            ],
        },
        {
            name: 'all',
            description: 'Reloads all Commands',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ]
});

export { command };