#!/usr/bin/env node

/* ==================================================
    INDEX
================================================== */

const path = require('path');
const clear = require('clear');
const chalk = require('chalk');
const CLI = require('clui');
const figlet = require('figlet');
const inquirer = require('inquirer');

const file_helper = require('./lib/file_helper');
const bitbucket = require('./lib/bitbucket');
const velocity = require('./lib/velocity');

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

        console.log();
        console.log(chalk.white('Creating `.bitbucket_token` in root.'));

        return getBitBucketCreds().then(({ username, password }) => bitbucket.storeCreds(username, password));
    })
    .then(() => {
        console.log();
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        return getRepositoryInfo();
    })
    .then(({ repository, owner }) => {
        const spinner = new CLI.Spinner('Pulling commits...');
        spinner.start();

        return new Promise((resolve, reject) => {
            bitbucket.getCommitsByRepo(repository, owner)
            .then(result => { spinner.stop(); resolve(result); })
            .catch(error => { spinner.stop(); reject(error); });
        });
    })
    .then(result => {
        getVelocityFormat()
            .then(choice => {
                console.log();
                console.log(chalk.white(`Your ${ choice.format } commit velocity is...`));

                const commit_velocity = velocity.getCommitVelocityByFormat(choice.format, result);

                console.log();
                console.log(chalk.white(`Current commits: ${ commit_velocity.current }`));
                console.log(chalk.white(`Previous commits: ${ commit_velocity.previous }`));
                console.log(chalk[commit_velocity.diff > 0 ? 'green' : 'red'](
                    `Difference: ${ commit_velocity.diff > 0 ? '+' : '' }${ commit_velocity.diff }`
                ));
                console.log(chalk[commit_velocity.velocity > 0 ? 'green' : 'red'](`Velocity: ${ commit_velocity.velocity }%`));
            });
    })
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

function getRepositoryInfo() {
    const repo_package_path = `${ process.cwd() }/package.json`;
    const repo_package = file_helper.isFile(repo_package_path) ? require(repo_package_path) : undefined;

    return new Promise(resolve => {
        const questions = [
            {
                name: 'repository',
                type: 'input',
                message: 'Enter the slugged name of the repository:',
                default: path.basename(process.cwd()),
                validate: value => value.length && slug_regex.test(value) ? true : 'Please enter a valid slug.'
            },
            {
                name: 'owner',
                type: 'input',
                message: 'Enter the owner of the repository:',
                default: repo_package && repo_package.author ? repo_package.author : '',
                validate: value => value.length ? true : 'Please enter a value.'
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}

function getVelocityFormat() {
    return new Promise(resolve => {
        const questions = [
            {
                type: 'list',
                name: 'format',
                message: 'Velocity calculation format:',
                choices: [
                    velocity.FORMATS.WEEKLY,
                    velocity.FORMATS.MONTHLY,
                    velocity.FORMATS.YEARLY
                ],
                default: velocity.FORMATS.WEEKLY
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}
