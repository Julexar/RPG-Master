import { ColorResolvable, EmbedBuilder, APIEmbedField } from 'discord.js';

class CustomEmbed extends EmbedBuilder {
    constructor(title: string, description: string, color: ColorResolvable | 0x00FFFF = 0x00FFFF, fields: APIEmbedField[] | null = null, author: { displayName: string, iconURL: () => string } | undefined = undefined) {
        super({
            description,
            title,
            timestamp: Date.now(),
            fields: fields || [],
            author: author && { name: author.displayName, iconURL: author.iconURL() },
            footer: { text: 'Made by Julexar' },
        });

        this.setColor(color);
    }
}

export { CustomEmbed };
