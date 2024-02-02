import { ColorResolvable, EmbedBuilder, APIEmbedField } from 'discord.js';

class CustomEmbed extends EmbedBuilder {
    constructor(
        title: string,
        description: string,
        color: ColorResolvable | null = null,
        fields: APIEmbedField[] | null = null,
        author: { displayName: string, iconURL: () => string } | undefined
    ) {
        super({
            color: 0x00FFFF,
            description,
            title,
            fields: fields || [],
            author: author && { name: author.displayName, iconURL: author.iconURL() },
            footer: { text: 'Made by Julexar' },
        });

        this.setTimestamp();
        this.setColor(color);
    }
}

export { CustomEmbed };
