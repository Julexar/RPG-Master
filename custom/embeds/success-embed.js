import { CustomEmbed } from "./custom-embed.js";

class SuccessEmbed extends CustomEmbed {
    constructor(description) {
        super(null, description, "#32cd32");
    };
};

export { SuccessEmbed };