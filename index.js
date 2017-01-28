/* ==================================================
    INDEX
================================================== */

const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');

const bitbucket = require('./lib/bitbucket');

const slug_regex = new RegExp('^(?!\s)([a-z|-]+)$');

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', { horizontalLayout: 'full' })
    )
);

// START

bitbucket.isCredsTokenInitialized()
    .then(result => {
        if (result) { return Promise.resolve(); }

        console.log(chalk.white('Creating `.bitbucket_token` in root.'));

        return getBitBucketCreds().then(({ username, password }) => bitbucket.storeCreds(username, password));
    })
    .then(() => {
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        return getRepositoryName();
    })
    .then(({ repository, owner }) => bitbucket.getCommitsByRepo(repository, owner))
    .then(console.log)
    .catch(error => console.error(chalk.red(error)));

// PROMPTS

function getBitBucketCreds() {
    return new Promise(resolve => {
        const questions = [
            {
                name: 'username',
                type: 'input',
                message: 'Enter BitBucket username:',
                validate: value => value.length ? true : 'Please enter a value.'
            },
            {
                name: 'password',
                type: 'password',
                message: 'Enter password:',
                validate: value => value.length ? true : 'Please enter a value.'
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}

function getRepositoryName() {
    return new Promise(resolve => {
        const questions = [
            {
                name: 'repository',
                type: 'input',
                message: 'Enter the slugged name of the repository:',
                // TODO: Properly validate.
                validate: value => value.length && slug_regex.test(value) ? true : 'Please enter a valid slug.'
            },
            {
                name: 'owner',
                type: 'input',
                message: 'Enter the owner of the repository:',
                validate: value => value.length ? true : 'Please enter a value.'
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}
