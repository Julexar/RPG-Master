import { DiscordClient } from './structures/lib/DiscordClient.js';
const client = new DiscordClient();

client.start();
console.log('Client started');

export { client };
