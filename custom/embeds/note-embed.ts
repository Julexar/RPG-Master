import { CustomEmbed } from './custom-embed.ts';

class NoteEmbed extends CustomEmbed {
    constructor(title: string, description: string, fields: any[] | null) {
        super(title, description, 0xFFFF00, fields, null);
    }
}

export { NoteEmbed };
