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
    return (...inner_args) => func(...args, ...inner_args);
}

// SOURCE: https://gist.github.com/ChrisChares/1ed079b9a6c9877ba4b43424139b166d
export function async(gen, context = undefined) {
    const generator = typeof gen === 'function' ? gen() : gen;
    const { value: promise } = generator.next(context);

    if ( typeof promise !== 'undefined' ) {
        promise
            .then(resolved => async(generator, resolved))
            .catch(error => generator.throw(error));
    }
}

export default {
    isFile,
    wrapSpinner,
    partial,
    async
};
