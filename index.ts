import { DiscordClient } from "./structures/lib/DiscordClient.ts";
const client = new DiscordClient();

client.start();
console.log('Client started!');

export { client };