import { SlashCommandBuilder, type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { config } from '../../config.js';
import { createIssue } from '../../lib/github.js';

const command = {
    data: new SlashCommandBuilder()
        .setName('create-issue')
        .setDescription('Cria uma issue no GitHub a partir desta thread')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.channel;

            // Verifica se está em uma thread
            if (!channel?.isThread()) {
                await interaction.editReply({
                    content: '❌ Este comando só pode ser usado em threads!'
                });
                return;
            }

            // Verifica se a thread está no canal de triage
            if (channel.parentId !== config.discord.triageChannelId) {
                await interaction.editReply({
                    content: '❌ Este comando só pode ser usado em threads do canal de triagem!'
                });
                return;
            }

            // Busca a primeira mensagem da thread
            const messages = await channel.messages.fetch({ limit: 1 });
            const firstMessage = messages.first();

            if (!firstMessage) {
                await interaction.editReply({
                    content: '❌ Não foi possível encontrar mensagens nesta thread!'
                });
                return;
            }

            if (!interaction.guildId) {
                await interaction.editReply({
                    content: '❌ Erro ao obter informações do servidor!'
                });
                return;
            }

            const title = channel.name;
            const body = formatIssueBody(
                firstMessage.author.tag,
                interaction.guildId,
                channel.id,
                firstMessage.content
            );

            // Cria a issue no GitHub
            const issue = await createIssue(
                config.github.publicRepo.owner,
                config.github.publicRepo.repo,
                title,
                body,
                ['triagem', 'discord']
            );

            await interaction.editReply({
                content: `✅ Issue criada com sucesso: ${issue.html_url}`
            });

            // Envia mensagem pública na thread
            await channel.send(`✅ Issue criada no GitHub por ${interaction.user}: ${issue.html_url}`);

            console.log(`Issue criada via comando por ${interaction.user.tag}: ${issue.html_url}`);
        } catch (error) {
            console.error('Erro ao criar issue:', error);
            await interaction.editReply({
                content: '❌ Erro ao criar issue no GitHub. Verifique os logs.'
            });
        }
    }
};

function formatIssueBody(
    authorTag: string,
    guildId: string,
    threadId: string,
    content: string
): string {
    return `**Criado por:** ${authorTag}\n**Discord Thread:** https://discord.com/channels/${guildId}/${threadId}\n\n---\n\n${content}`;
}

export { command };
