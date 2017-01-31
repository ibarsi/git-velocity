/* ==================================================
    COMMITS
================================================== */

const fs = require('fs');
const request = require('request').defaults({
    encoding: 'utf8'
});

const file_helper = require('./file_helper');

const TYPES = {
    GITHUB: 'GITHUB',
    BITBUCKET: 'BITBUCKET'
};

function Commits(type = TYPES.GITHUB) {
    const config = _initCommitProps(type);

    return {
        isCredsTokenInitialized() {
            return new Promise(resolve => resolve(file_helper.isFile(`${ process.env.HOME }/${ config.token }`)));
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
                            request.get(url)
                                .auth(username, password)
                                .on('response', response => {
                                    if (response.statusCode !== 200) { return inner_reject(new Error(response.statusMessage)); }

                                    return response.on('data', result => {
                                        try {
                                            const data = JSON.parse(result);

                                            inner_resolve(data.values);
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

// PRIVATE

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

module.exports = {
    TYPES,
    Commits
};
