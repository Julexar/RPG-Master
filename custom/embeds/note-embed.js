import { CustomEmbed } from "./custom-embed.js";

class NoteEmbed extends CustomEmbed {
    constructor(title, description, fields) {
        super(title, description, "#FFFF00", fields);
    };
};

export { NoteEmbed };