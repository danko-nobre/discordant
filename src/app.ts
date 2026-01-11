import { Events } from 'discord.js';
import { client, commands } from './lib/discord.js';
import { config } from './config.js';
import { handleNewThread } from './handlers/thread.js';
import { pollPrivateRepoIssues } from './handlers/issue.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Event: Bot pronto
client.once(Events.ClientReady, () => {
    console.log(`→ Bot conectado como ${client.user?.tag}`);
    // Executar imediatamente
    pollPrivateRepoIssues();

    // Polling a cada 2 minutos
    setInterval(pollPrivateRepoIssues, 120000);
});


// Event: Nova thread criada
client.on('threadCreate', async (thread) => {
    await handleNewThread(thread);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função simples para carregar comandos
const loadCommands = async () => {
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const { command } = await import(`file://${filePath}`);

            if (command?.data && command?.execute) {
                commands.set(command.data.name, command);
            }
        }
    }
};

// Evento de interação
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Erro ao executar comando!', ephemeral: true });
    }
});


// Tratamento de erros
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Inicialização
await loadCommands();
await client.login(config.discord.token);
