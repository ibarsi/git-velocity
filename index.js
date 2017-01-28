/* ==================================================
    INDEX
================================================== */

const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');

const bitbuket = require('./lib/bitbucket');

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', { horizontalLayout: 'full' })
    )
);

// START

bitbuket.isCredsTokenInitialized()
    .then(result => {
        if (result) { return Promise.resolve(); }

        console.log(chalk.white('Creating `.bitbucket_token` in root.'));

        return getBitBucketCreds().then(({ username, password }) => bitbuket.storeCreds(username, password));
    })
    .then(() => {
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        return getRepositoryName();
    })
    .then(({ repository, owner }) => bitbuket.getCommitsByRepo(repository, owner))
    .then(console.log)
    .catch(error => console.error(chalk.red(error)));

// PROMPTS

function getBitBucketCreds() {
    return new Promise(resolve => {
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
                validate: value => value.length ? true : 'Please enter a valid slug.'
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
