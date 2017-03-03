/* ==================================================
    AUTH
================================================== */

import fs from 'fs';

import { isFile } from './helpers';

export function Auth(token) {
    return {
        isCredsTokenInitialized() {
            return new Promise(resolve => resolve(isFile(`${ process.env.HOME }/${ token }`)));
        },
        getCreds() {
            return new Promise((resolve, reject) => {
                try {
                    resolve(JSON.parse(fs.readFileSync(`${ process.env.HOME }/${ token }`, 'utf8')));
                }
                catch (error) {
                    reject(error);
                }
            });
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
