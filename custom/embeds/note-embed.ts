import { APIEmbedField  } from 'discord.js';
import { CustomEmbed } from './custom-embed.ts';

class NoteEmbed extends CustomEmbed {
    constructor(title: string, description: string, fields: APIEmbedField[] | null = null, author: { displayName: string, iconURL: () => string } | undefined = undefined){
        super(title, description, 0xFFFF00, fields, author);
    }
}

export { NoteEmbed };
