/* ==================================================
    BITBUCKET
================================================== */

const fs = require('fs');
const request = require('request').defaults({
    encoding: 'utf8'
});

const file_helper = require('./file_helper');

// PRIVATE

function _getCreds() {
    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(fs.readFileSync(`${ process.env.HOME }/.bitbucket_token`, 'utf8')));
        }
        catch (error) {
            reject(error);
        }
    });
}

// PUBLIC

function isCredsTokenInitialized() {
    return new Promise(resolve => resolve(file_helper.isFile(`${ process.env.HOME }/.bitbucket_token`)));
}

function storeCreds(username, password) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            `${ process.env.HOME }/.bitbucket_token`,
            JSON.stringify({ username, password }),
            error => error ? reject(error) : resolve()
        );
    });
}

function getCommitsByRepo(repository, owner) {
    return new Promise((resolve, reject) => {
        const repo_path = `https://api.bitbucket.org/2.0/repositories/${ owner }/${ repository }`;

        _getCreds()
            .then(({ username, password }) => {
                return new Promise((inner_resolve, inner_reject) => {
                    request.get(`${ repo_path }/commits`)
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

module.exports = {
    isCredsTokenInitialized,
    storeCreds,
    getCommitsByRepo
};
