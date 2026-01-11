export interface GithubIssue {
    id: number;
    node_id: string;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    labels: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    user: {
        login: string;
    } | null;
}

export type IssueType = 'epic' | 'story';
