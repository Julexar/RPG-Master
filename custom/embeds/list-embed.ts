import { APIEmbedField  } from 'discord.js';
import { CustomEmbed } from './custom-embed.ts';

class ListEmbed extends CustomEmbed {
    constructor(title: string, description: string, fields: APIEmbedField[] | null = null) {
        super(title, description, 0x00FFFF, fields);
    }
}

export { ListEmbed };
