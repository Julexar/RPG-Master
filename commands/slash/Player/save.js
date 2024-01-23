import { CommandBuilder } from '../../../custom/builders';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = false;
    }

    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async run(interaction) {
        //TODO: Implement Saving Throws
    }
}

const command = new Command({
    name: 'save',
    nick: 's',
    description: 'Rolls a Saving Throw',
});

export { command };
