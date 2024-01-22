import { PermissionFlagsBits } from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { ErrorEmbed } from '../../../custom/embeds';
import { NotFoundError } from '../../../custom/errors';
import fs from 'fs';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        if (fs.existsSync('./logs/dev/devlog.log')) {
            await interaction.reply({files: ['./logs/dev/devlog.log']});
        } else {
            const err = new NotFoundError('Devlog not found', 'Could not find the devlog in the Bot\'s files.');
            const embed = new ErrorEmbed(err, false);

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }
}

const command = new Command({
    name: 'devprint',
    description: 'Prints the Devlog',
    defaultMemberPermissions: [PermissionFlagsBits.Administrator]
});

export { command };