/* ==================================================
    COMMITS
================================================== */

import fs from 'fs';

import { isFile, uniq, async, requestPromise } from './helpers';

// PUBLIC

export const TYPES = {
    GITHUB: 'GITHUB',
    BITBUCKET: 'BITBUCKET'
};

export function Commits(type = TYPES.GITHUB) {
    const config = _initCommitProps(type);

    return {
        isCredsTokenInitialized() {
            return new Promise(resolve => resolve(isFile(`${ process.env.HOME }/${ config.token }`)));
        },
        storeCreds(username, password) {
            return new Promise((resolve, reject) => {
                fs.writeFile(
                    `${ process.env.HOME }/${ config.token }`,
                    JSON.stringify({ username, password }),
                    error => error ? reject(error) : resolve()
                );
            });
        },
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

                        switch (type) {
                            case TYPES.GITHUB:
                                const branches = yield requestPromise(config.branches_url.replace('{owner}', owner).replace('{repo}', repository), options.config);
                                const branch_commit_results = yield Promise.all(branches.data.map(branch => {
                                    return _requestFullGitHubResponse(Object.assign({}, options, {
                                            url: `${ options.url }?sha=${ branch.name }`
                                        }));
                                }));

                                const github_commits = branch_commit_results.reduce((acc, list) => acc.concat(list), []);
                                const unique_commits = uniq(github_commits, item => item.sha);

                                resolve(unique_commits.map(GitHubCommit));
                                break;
                            case TYPES.BITBUCKET:
                                const bitbucket_commits = yield _requestFullBitBucketResponse(options);

                                resolve(bitbucket_commits.map(BitBucketCommit));
                                break;
                            default:
                                resolve([]);
                                break;
                        }
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }
    };
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

// PRIVATE

function BitBucketCommit(value) {
    return {
        id: value.sha,
        author: value.author.user ? value.author.user.display_name : value.author.raw,
        message: value.message,
        date: value.date
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

function _initCommitProps(type) {
    switch (type) {
        case TYPES.BITBUCKET:
            return {
                commits_url: 'https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/commits',
                token: '.bitbucket_token'
            };
        case TYPES.GITHUB:
            return {
                commits_url: 'https://api.github.com/repos/{owner}/{repo}/commits',
                branches_url: 'https://api.github.com/repos/{owner}/{repo}/branches',
                token: '.github_token'
            };
        default:
            return {
                commits_url: '',
                branches_url: '',
                token: ''
            };
    }
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

function _requestFullBitBucketResponse(options, values = []) {
    return new Promise((resolve, reject) => {
        async(function* () {
            try {
                const { url, config } = options;
                const response = yield requestPromise(url, config);
                const chunked_values = values.concat(response.data.values);

                if (response.data.next) {
                    resolve(_requestFullBitBucketResponse({ url: response.data.next, config }, chunked_values));
                }

                resolve(chunked_values);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}

function _requestFullGitHubResponse(options, values = []) {
    return new Promise((resolve, reject) => {
        async(function* () {
            try {
                const { url, config } = options;
                const response = yield requestPromise(url, config);
                const chunked_values = values.concat(response.data);

                const link = response.headers.link;

                if (link && link.indexOf('rel="next"') >= 0) {
                    const next_url = link.substring(0, link.indexOf('rel="next"'));
                    const next_url_formatted = next_url.trim().replace('<', '').replace('>', '').replace(';', '');

                    resolve(_requestFullGitHubResponse({ url: next_url_formatted, config }, chunked_values));
                }

                resolve(chunked_values);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
