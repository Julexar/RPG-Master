import DiscordClient from "./structures/lib/DiscordClient";
const client = new DiscordClient();

client.start();
console.log("Client started");

return client;