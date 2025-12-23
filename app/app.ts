import 'dotenv/config';

// Node deps
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Discord.js
import { Client, Collection, GatewayIntentBits } from 'discord.js';

const TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandPath).filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandPath, file);
        const { command } = await import(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const { event } = import(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(TOKEN);
