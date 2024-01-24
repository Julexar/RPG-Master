import { CommandBuilder } from '../../../custom/builders';
import { client } from '../../..';

class Command extends CommandBuilder {
    constructor(data) {
        super(data);

        this.enabled = false;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async run(interaction) {
        //TODO: Add Ability Checks
    }
}

const command = new Command({
    name: 'check',
    nick: 'c',
    description: 'Rolls a Skill or Ability Check',
});

export { command };
