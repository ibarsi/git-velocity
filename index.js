/* ==================================================
    INDEX
================================================== */

const fs = require('fs');
const async = require('async');
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');

const file_helper = require('./lib/file_helper');
const bitbuket = require('./lib/bitbucket');

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', { horizontalLayout: 'full' })
    )
);

// START

async.waterfall([
    // Check if `.bitbucket_token` exists, create if it doesn't.
    function (cb) {
        if (file_helper.isFile(`${ process.env.HOME }/.bitbucket_token`)) { return cb(null); }

        console.log(chalk.white('Creating `.bitbucket_token` in root.'));

        getBitBucketCreds(value => {
            fs.writeFile(`${ process.env.HOME }/.bitbucket_token`, JSON.stringify(value), error => error ? cb(error) : cb(null));
        });
    },
    // Prompt for repository information.
    function (cb) {
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        getRepositoryName(value => cb(null, value));
    },
    // Get commits for repository.
    function ({ repository, owner }) {
        bitbuket.getCommitsByRepo(repository, owner)
            .then(console.log)
            .catch(error => console.error(chalk.red(error)));
    }
], console.error);

// PROMPTS

function getBitBucketCreds(callback) {
    const questions = [
        {
            name: 'username',
            type: 'input',
            message: 'Enter your BitBucket username:',
            validate: value => value.length ? true : 'Please enter a value.'
        },
        {
            name: 'password',
            type: 'password',
            message: 'Enter your password:',
            validate: value => value.length ? true : 'Please enter a value.'
        }
    ];

    inquirer.prompt(questions).then(callback);
}

function getRepositoryName(callback) {
    const questions = [
        {
            name: 'repository',
            type: 'input',
            message: 'Enter the slugged name of the repository:',
            // TODO: Properly validate.
            validate: value => value.length ? true : 'Please enter a valid slug.'
        },
        {
            name: 'owner',
            type: 'input',
            message: 'Enter the owner of the repository:',
            validate: value => value.length ? true : 'Please enter a value.'
        }
    ];

    inquirer.prompt(questions).then(callback);
}
