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
    async run(interaction) {}
}

const command = new Command({
    name: 'cast',
    description: 'Casts a Spell',
});

export { command };
