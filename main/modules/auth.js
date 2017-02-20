/* ==================================================
    AUTH
================================================== */

import fs from 'fs';

import { isFile, partial } from './helpers';

// PUBLIC

export function Auth(token) {
    return {
        isCredsTokenInitialized: partial(_isCredsTokenInitialized, token),
        getCreds: partial(_getCreds, token),
        storeCreds: partial(_storeCreds, token)
    };
}

export default {
    Auth
};

// PRIVATE

function _isCredsTokenInitialized(token) {
    return new Promise(resolve => resolve(isFile(`${ process.env.HOME }/${ token }`)));
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

function _storeCreds(token, username, password) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            `${ process.env.HOME }/${ token }`,
            JSON.stringify({ username, password }),
            error => error ? reject(error) : resolve()
        );
    });
}
