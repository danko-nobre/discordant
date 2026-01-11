import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commands = [];

// Ajuste o caminho abaixo para onde estão seus arquivos de comando
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // Importação dinâmica compatível com TS/ESM
        const { command } = await import(`file://${filePath}`);

        if (command && 'data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(config.discord.token);

(async () => {
    try {
        console.log(`Iniciando atualização de ${commands.length} comandos slash.`);

        const data: any = await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
            { body: commands },
        );

        console.log(`Sucesso! ${data.length} comandos registrados.`);
    } catch (error) {
        console.error(error);
    }
})();
