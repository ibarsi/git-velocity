/* ==================================================
    FILE HELPER
================================================== */

import fs from 'fs';

// PUBLIC

export function isFile(path) {
    try {
        return fs.statSync(path).isFile();
    }
    catch (error) {
        return false;
    }
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
    async
};
