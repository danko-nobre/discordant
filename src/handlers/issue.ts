import { listIssuesWithLabels } from '../lib/github.js';
import { createThreadForIssue } from '../lib/discord.js';
import { config } from '../config.js';
import type { GithubIssue } from '../types.js';

const processedIssues = new Set<number>();

export async function pollPrivateRepoIssues(): Promise<void> {
    try {
        const issues = await listIssuesWithLabels(
            config.github.privateRepo.owner,
            config.github.privateRepo.repo,
            ['epic', 'story']
        );

        for (const issue of issues) {
            if (processedIssues.has(issue.id)) continue;

            if (hasEpicOrStoryLabel(issue)) {
                await createThreadForIssue(issue);
                processedIssues.add(issue.id);
                console.log(`Thread criada para issue: ${issue.title}`);
            }
        }
    } catch (error) {
        console.error('Erro no polling:', error);
    }
}

function hasEpicOrStoryLabel(issue: GithubIssue): boolean {
    return issue.labels.some((l) =>
        ['epic', 'story'].includes(l.name.toLowerCase())
    );
}
