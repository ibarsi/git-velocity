/* ==================================================
    FILE HELPER
================================================== */

import fs from 'fs';
import CLI from 'clui';

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
    async
};
