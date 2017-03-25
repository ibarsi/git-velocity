/* ==================================================
    AUTH
================================================== */

import fs from 'fs';
import os from 'os';

import { isEmpty } from 'lodash';

import { isFile } from './helpers';

export function Auth(token) {
    return {
        async isCredsTokenInitialized() {
            return isFile(`${ os.homedir() }/${ token }`);
        },
        async getCreds() {
            return JSON.parse(fs.readFileSync(`${ os.homedir() }/${ token }`, 'utf8'));
        },
        async storeCreds(username, password) {
            if (isEmpty(username) || isEmpty(password)) { throw new Error('Both username and password are required to store credentials.'); }

            return new Promise((resolve, reject) => {
                fs.writeFile(
                    `${ os.homedir() }/${ token }`,
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
