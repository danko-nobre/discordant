import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';

const TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready and logged in as ${readyClient.user.tag} :)`);
});

client.commands = new Collection();

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

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.login(TOKEN);
