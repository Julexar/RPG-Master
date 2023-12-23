import { CustomEmbed } from './custom-embed.js';

class ListEmbed extends CustomEmbed {
    constructor(title, description, fields) {
        super(title, description, '#00ffff', fields);
    }
}

export { ListEmbed };
