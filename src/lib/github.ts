import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import type { GithubIssue } from '../types.js';

const octokit = new Octokit({ auth: config.github.token });

export async function createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels: string[] = []
): Promise<GithubIssue> {
    try {
        const { data } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
        });
        return data as GithubIssue;
    } catch (error) {
        console.error('Erro ao criar issue no GitHub:', error);
        throw error;
    }
}

export async function addIssueToProject(
    issueNodeId: string,
    projectId: string
): Promise<void> {
    try {
        const mutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item {
            id
          }
        }
      }
    `;

        await octokit.graphql(mutation, {
            projectId,
            contentId: issueNodeId,
        });
    } catch (error) {
        console.error('Erro ao adicionar ao projeto:', error);
        throw error;
    }
}

export async function listIssuesWithLabels(
    owner: string,
    repo: string,
    labels: string[]
): Promise<GithubIssue[]> {
    try {
        const { data } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: 'open',
            labels: labels.join(','),
            sort: 'created',
            direction: 'desc',
            per_page: 10,
        });
        return data as GithubIssue[];
    } catch (error) {
        console.error('Erro ao buscar issues:', error);
        return [];
    }
}
