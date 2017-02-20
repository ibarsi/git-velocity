/* ==================================================
    COMMITS
================================================== */

import fs from 'fs';

import { isFile, uniq, partial, async, requestPromise } from './helpers';

// PUBLIC

export const TYPES = {
    GITHUB: 'GITHUB',
    BITBUCKET: 'BITBUCKET'
};

export function Commits(type = TYPES.GITHUB) {
    switch (type) {
        case TYPES.GITHUB:
            return GitHubCommits();
        case TYPES.BITBUCKET:
            return BitBucketCommits();
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

function BitBucketCommits() {
    const config = {
        commits_url: 'https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/commits',
        token: '.bitbucket_token'
    };

    return {
        isCredsTokenInitialized: partial(_isCredsTokenInitialized, config.token),
        storeCreds: partial(_storeCreds, config.token),
        getCommitsByRepo(repository, owner) {
            return new Promise((resolve, reject) => {
                async(function* () {
                    try {
                        const { username, password } = yield _getCreds(config.token);

                        const options = {
                            url: config.commits_url.replace('{owner}', owner).replace('{repo}', repository),
                            config: {
                                headers: {
                                    'User-Agent': owner,
                                    Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                                }
                            }
                        };

                        const commits = yield _requestPagedResponse(options, response => response.data.next);

                        resolve(commits.reduce((acc, value) => acc.concat(value.values), []).map(BitBucketCommit));
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
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

function GitHubCommits() {
    const config = {
        commits_url: 'https://api.github.com/repos/{owner}/{repo}/commits',
        branches_url: 'https://api.github.com/repos/{owner}/{repo}/branches',
        token: '.github_token'
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
        isCredsTokenInitialized: partial(_isCredsTokenInitialized, config.token),
        storeCreds: partial(_storeCreds, config.token),
        getCommitsByRepo(repository, owner) {
            return new Promise((resolve, reject) => {
                async(function* () {
                    try {
                        const { username, password } = yield _getCreds(config.token);

                        const options = {
                            url: config.commits_url.replace('{owner}', owner).replace('{repo}', repository),
                            config: {
                                headers: {
                                    'User-Agent': owner,
                                    Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                                }
                            }
                        };

                        const branches = yield requestPromise(config.branches_url.replace('{owner}', owner).replace('{repo}', repository), options.config);
                        const branch_commit_results = yield Promise.all(branches.data.map(branch => {
                            return _requestPagedResponse(Object.assign({}, options, {
                                    url: `${ options.url }?sha=${ branch.name }`
                                }), nextPageFunc);
                        }));

                        const github_commits = branch_commit_results.reduce((acc, list) => acc.concat(list), []);
                        const unique_commits = uniq(github_commits, item => item.sha);

                        resolve(unique_commits.map(GitHubCommit));
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
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

function _isCredsTokenInitialized(token) {
    return new Promise(resolve => resolve(isFile(`${ process.env.HOME }/${ token }`)));
}

function _storeCreds(token, username, password) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            `${ process.env.HOME }/${ token }`,
            JSON.stringify({ username, password }),
            error => error ? reject(error) : resolve()
        );
    });
}

function _getCreds(token) {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(fs.readFileSync(`${ process.env.HOME }/${ token }`, 'utf8')));
        }
        catch (error) {
            reject(error);
        }
    });
}

function _requestPagedResponse(options, next_page_func, values = []) {
    return new Promise((resolve, reject) => {
        async(function* () {
            try {
                const { url, config } = options;
                const response = yield requestPromise(url, config);
                const chunked_values = values.concat(response.data);

                const next_page_url = next_page_func(response);

                if (next_page_url) {
                    resolve(_requestPagedResponse({ url: next_page_url, config }, next_page_func, chunked_values));
                }

                resolve(chunked_values);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
