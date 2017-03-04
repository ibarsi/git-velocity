/* ==================================================
    AUTH
================================================== */

import fs from 'fs';

import { isFile } from './helpers';

export function Auth(token) {
    return {
        async isCredsTokenInitialized() {
            return isFile(`${ process.env.HOME }/${ token }`);
        },
        async getCreds() {
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
