import { ColorResolvable, EmbedBuilder } from 'discord.js';

class CustomEmbed extends EmbedBuilder {
    constructor(title: string, description: string, color: ColorResolvable, fields: any[] | null, author: any) {
        super({
            color: 0x00FFFF,
            description: description,
            footer: {
                text: 'Made by Julexar',
            },
        });

        this.setTimestamp();

        if (title) this.setTitle(title);

        if (color) this.setColor(color);

        if (fields) this.setFields(fields);

        if (author) this.setAuthor({ name: author.displayName, iconURL: author.iconURL() });
    }
}

export { CustomEmbed };