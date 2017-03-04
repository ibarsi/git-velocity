/* ==================================================
    AUTH
================================================== */

import fs from 'fs';

import { isFile } from './helpers';

export function Auth(token) {
    return {
        isCredsTokenInitialized: async function() {
            return isFile(`${ process.env.HOME }/${ token }`);
        },
        getCreds: async function() {
            return JSON.parse(fs.readFileSync(`${ process.env.HOME }/${ token }`, 'utf8'));
        },
        storeCreds(username, password) {
            return new Promise((resolve, reject) => {
                fs.writeFile(
                    `${ process.env.HOME }/${ token }`,
                    JSON.stringify({ username, password }),
                    error => error ? reject(error) : resolve()
                );
            });
        }
    };
}

export default {
    Auth
};
