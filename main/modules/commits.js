/* ==================================================
    COMMITS
================================================== */

import { uniq, requestPromise } from './helpers';
import { Auth } from './auth';

// PUBLIC

export const TYPES = {
    GITHUB: 'GITHUB',
    BITBUCKET: 'BITBUCKET'
};

export function Commits(type = TYPES.GITHUB) {
    switch (type) {
        case TYPES.GITHUB:
            return GitHubCommits(Auth('.github_token'));
        case TYPES.BITBUCKET:
            return BitBucketCommits(Auth('.bitbucket_token'));
        default:
            break;
    }
}

export function getRepositoryTypeFromUrl(repository_url) {
    if (!repository_url) { return TYPES.GITHUB; }

    if (repository_url.indexOf('github') >= 0) {
        return TYPES.GITHUB;
    }
    else if (repository_url.indexOf('bitbucket') >= 0) {
        return TYPES.BITBUCKET;
    }

    return TYPES.GITHUB;
}

export default {
    TYPES,
    Commits,
    getRepositoryTypeFromUrl
};

// BITBUCKET

function BitBucketCommits(auth) {
    const config = {
        commits_url: 'https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/commits'
    };

    return {
        isAuthorized: auth.isCredsTokenInitialized,
        authorize: auth.storeCreds,
        async getCommitsByRepo(repository, owner, takeWhile) {
            if (!repository || !owner) { return []; }

            const { username, password } = await auth.getCreds();

            const options = {
                url: config.commits_url.replace('{owner}', owner).replace('{repo}', repository),
                config: {
                    headers: {
                        'User-Agent': owner,
                        Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                    }
                }
            };

            const commits = await _requestPagedResponse(options, response => {
                if (!takeWhile) { return response.data.next; }

                return !response.data.values.map(BitBucketCommit).some(takeWhile) ? response.data.next : undefined;
            });

            return commits.reduce((acc, value) => acc.concat(value.values), []).map(BitBucketCommit);
        }
    };
}

function BitBucketCommit(value) {
    return {
        id: value.sha,
        author: value.author.user ? value.author.user.display_name : value.author.raw,
        message: value.message,
        date: value.date
    };
}

// GITHUB

function GitHubCommits(auth) {
    const config = {
        commits_url: 'https://api.github.com/repos/{owner}/{repo}/commits',
        branches_url: 'https://api.github.com/repos/{owner}/{repo}/branches'
    };

    const nextPageFunc = response => {
        const link = response.headers.link;

        if (link && link.indexOf('rel="next"') >= 0) {
            const next_url = link.substring(0, link.indexOf('rel="next"'));
            const next_url_formatted = next_url.trim().replace('<', '').replace('>', '').replace(';', '');

            return next_url_formatted;
        }
    };

    return {
        isAuthorized: auth.isCredsTokenInitialized,
        authorize: auth.storeCreds,
        async getCommitsByRepo(repository, owner, takeWhile) {
            if (!repository || !owner) { return []; }

            const { username, password } = await auth.getCreds();

            const options = {
                url: config.commits_url.replace('{owner}', owner).replace('{repo}', repository),
                config: {
                    headers: {
                        'User-Agent': owner,
                        Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                    }
                }
            };

            const branches = await requestPromise(config.branches_url.replace('{owner}', owner).replace('{repo}', repository), options.config);
            const branch_commit_results = await Promise.all(branches.data.map(branch => {
                return _requestPagedResponse(Object.assign({}, options, {
                        url: `${ options.url }?sha=${ branch.name }`
                    }),
                    response => {
                        if (!takeWhile) { return response.data.next; }

                        return !response.data.map(GitHubCommit).some(takeWhile) ? nextPageFunc(response) : undefined;
                    });
            }));

            const github_commits = branch_commit_results.reduce((acc, list) => acc.concat(list), []);
            const unique_commits = uniq(github_commits, item => item.sha);

            return unique_commits.map(GitHubCommit);
        }
    };
}

function GitHubCommit(value) {
    return {
        id: value.sha,
        author: value.commit.author.name,
        message: value.commit.message,
        date: value.commit.committer.date
    };
}

// PRIVATE

async function _requestPagedResponse(options, nextPage, values = []) {
    const { url, config } = options;
    const response = await requestPromise(url, config);
    const chunked_values = values.concat(response.data);

    const next_page_url = nextPage(response);

    if (next_page_url) {
        return _requestPagedResponse({ url: next_page_url, config }, nextPage, chunked_values);
    }

    return chunked_values;
}
