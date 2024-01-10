import { 
    ApplicationCommandOptionType
} from 'discord.js';
import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';
import { SuccessEmbed, ErrorEmbed } from '../../../custom/embeds';
import { NotFoundError } from '../../../custom/errors';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = true;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        const option = interaction.options;
        const server = interaction.guild;
        const user = interaction.user;
        let embed, emph;
        
        if (await client.database.Server.gms.getOne(server, user)) {
            switch (option.getSubcommandGroup()) {
                case 'toggle':
                    switch (option.getSubcommand()) {
                        case 'suggestions':
                            embed = await this.toggleSuggestion(server, user);

                            emph = embed.data.color === '#FF0000';

                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: emph 
                            });
                        break;
                    }
                break;
            }
        }
    }

    async toggleSuggestion(server, user) {
        try {
            const msg = await client.database.Server.gms.toggleSuggestion(server, user)

            return new SuccessEmbed(msg || 'Success', 'Successfully toggled receiving suggestions');
        } catch (err) {
            client.logServerError(server, err);
            
            if (err instanceof NotFoundError) return new ErrorEmbed(err, false);

            return new ErrorEmbed(err, true);
        }
    }
}

const command = new Command({
    name: 'settings',
    description: 'Personal Settings',
    options: [
        {
            name: 'toggle',
            description: 'Toggle a setting',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'suggestions',
                    description: 'Toggle whether you receive suggestions',
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
    ]
});

export { command };
