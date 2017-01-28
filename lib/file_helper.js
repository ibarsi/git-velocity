/* ==================================================
    FILE HELPER
================================================== */

const fs = require('fs');

// PUBLIC

function isFile(path) {
    try {
        return fs.statSync(path).isFile();
    }
    catch (error) {
        return false;
    }
}

module.exports = {
    isFile
};
