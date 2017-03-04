/* ==================================================
    FILE HELPER
================================================== */

import fs from 'fs';
import req from 'request';
import CLI from 'clui';

const request = req.defaults({
    encoding: 'utf8',
    json: true
});

// PUBLIC

export function isFile(path) {
    try {
        return fs.statSync(path).isFile();
    }
    catch (error) {
        return false;
    }
}

export function uniq(list, func) {
    const uids = [];
    const unique_set = [];

    list.forEach(item => {
        const uid = func(item);

        if (uids.indexOf(uid) < 0) {
            uids.push(uid);
            unique_set.push(item);
        }
    });

    return unique_set;
}

export function wrapSpinner(promise, message = '') {
    const spinner = new CLI.Spinner(message);
    spinner.start();

    return (...args) => new Promise((resolve, reject) => {
        promise(...args)
            .then(result => { spinner.stop(); resolve(result); })
            .catch(error => { spinner.stop(); reject(error); });
    });
}

export function requestPromise(url, config) {
    return new Promise((resolve, reject) => {
        request.get(url, config)
            .on('response', response => {
                if (response.statusCode !== 200) { reject(new Error(response.statusMessage)); }

                let chunk = '';

                response.on('data', result => { chunk += result; });

                response.on('end', () => {
                    resolve({
                        data: JSON.parse(chunk),
                        headers: response.headers
                    });
                });
            });
    });
}

// SOURCE: https://gist.github.com/ibarsi/856a0c46e37fb4c951b033995aec55d5
export function partial(func, ...args) {
    return func.bind(undefined, ...args);
}

export default {
    isFile,
    uniq,
    wrapSpinner,
    partial
};
