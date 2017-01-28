/* ==================================================
    BITBUCKET
================================================== */

const fs = require('fs');
const async = require('async');
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

        async.waterfall([
            function(cb) {
                _getCreds()
                    .then(result => cb(null, result))
                    .catch(cb);
            },
            function ({ username, password }, cb) {
                request.get(`${ repo_path }/commits`)
                    .auth(username, password)
                    .on('response', response => response.statusCode !== 200 ? cb(new Error(response.statusMessage)) : cb(null, response));
            },
            function (response) {
                response.on('data', result => {
                    const data = JSON.parse(result);

                    resolve(data.values);
                });
            }
        ], reject);
    });
}

module.exports = {
    isCredsTokenInitialized,
    storeCreds,
    getCommitsByRepo
};
