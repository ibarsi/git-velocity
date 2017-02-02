/* ==================================================
    COMMITS
================================================== */

import fs from 'fs';
import req from 'request';

import { isFile } from './file_helper';

const request = req.defaults({
    encoding: 'utf8',
    json: true
});

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
                const url = config.url.replace('{owner}', owner).replace('{repo}', repository);

                _getCreds(config.token)
                    .then(({ username, password }) => {
                        return new Promise((inner_resolve, inner_reject) => {
                            request.get(url, {
                                    headers: {
                                        'User-Agent': owner,
                                        Authorization: 'Basic ' + new Buffer(`${ username }:${ password }`).toString('base64')
                                    }
                                })
                                .on('response', response => {
                                    if (response.statusCode !== 200) { inner_reject(new Error(response.statusMessage)); }

                                    let chunk = '';

                                    response.on('data', result => { chunk += result; });

                                    response.on('end', () => {
                                        try {
                                            switch (type) {
                                                case TYPES.GITHUB:
                                                    inner_resolve(JSON.parse(chunk).map(GitHubCommit));
                                                    break;
                                                case TYPES.BITBUCKET:
                                                    inner_resolve(JSON.parse(chunk).values.map(BitBucketCommit));
                                                    break;
                                                default:
                                                    inner_resolve([]);
                                                    break;
                                            }
                                        }
                                        catch (error) {
                                            inner_reject(error);
                                        }
                                    });
                                });
                        });
                    })
                    .then(resolve)
                    .catch(reject);
            });
        }
    };
}

export default {
    TYPES,
    Commits
};

// PRIVATE

function BitBucketCommit(value) {
    return {
        date: value.date
    };
}

function GitHubCommit(value) {
    return {
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
