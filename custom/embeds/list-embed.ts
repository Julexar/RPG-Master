import { CustomEmbed } from './custom-embed.ts';

class ListEmbed extends CustomEmbed {
    constructor(title: string, description: string, fields: any[] | null) {
        super(title, description, 0x00ffff, fields, null);
    }
}

export { ListEmbed };
