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

export default {
    isFile
};
