/* ==================================================
    COMMITS
================================================== */

import fs from 'fs';

import { isFile, async, requestPromise } from './helpers';

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
                        const url = config.url.replace('{owner}', owner).replace('{repo}', repository);

                        const { username, password } = yield _getCreds(config.token);

                        const request_config = {
                            headers: {
                                'User-Agent': owner,
                                Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                            }
                        };

                        const data = yield _requestFullResponse(url, request_config);

                        switch (type) {
                            case TYPES.GITHUB:
                                resolve(data.map(GitHubCommit));
                                break;
                            case TYPES.BITBUCKET:
                                resolve(data.map(BitBucketCommit));
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
        author: value.author.user ? value.author.user.display_name : value.author.raw,
        message: value.message,
        date: value.date
    };
}

function GitHubCommit(value) {
    return {
        author: value.commit.author.name,
        message: value.commit.message,
        date: value.commit.committer.date
    };
}

function _initCommitProps(type) {
    switch (type) {
        case TYPES.BITBUCKET:
            return {
                url: 'https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/commits',
                token: '.bitbucket_token'
            };
        case TYPES.GITHUB:
            return {
                url: 'https://api.github.com/repos/{owner}/{repo}/commits',
                token: '.github_token'
            };
        default:
            return {
                url: ''
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

function _requestFullResponse(url, request_config, values = []) {
    return new Promise((resolve, reject) => {
        async(function* () {
            try {
                const result = JSON.parse(yield requestPromise(url, request_config));
                const chunked_values = values.concat(result.values);

                if (result.next) {
                    resolve(_requestFullResponse(result.next, request_config, chunked_values));
                }

                resolve(chunked_values);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
