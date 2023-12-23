import { CustomEmbed } from './custom-embed.js';

class SuccessEmbed extends CustomEmbed {
    constructor(title, description) {
        super(title, description, '#65fe08');
    }
}

export { SuccessEmbed };
