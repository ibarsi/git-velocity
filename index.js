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
const commits = require('./lib/commits');
const velocity = require('./lib/velocity');

const repository_package_path = `${ process.cwd() }/package.json`;
const repository_package = file_helper.isFile(repository_package_path) ? require(repository_package_path) : undefined;

const slug_regex = new RegExp('^(?!\s)([a-z|-]+)$');

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', { horizontalLayout: 'full' })
    )
);

// START

getRepositoryType()
    .then(({ type }) => {
        const Commits = commits.Commits(type);

        return Commits.isCredsTokenInitialized(type)
            .then(result => {
                if (result) { return Promise.resolve(); }

                console.log();
                console.log(chalk.white('Creating auth token in root.'));

                return getRepositoryCreds(type).then(({ username, password }) => Commits.storeCreds(username, password));
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
                    Commits.getCommitsByRepo(repository, owner)
                        .then(result => { spinner.stop(); resolve(result); })
                        .catch(error => { spinner.stop(); reject(error); });
                });
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

function getRepositoryType() {
    return new Promise(resolve => {
        const questions = [
            {
                type: 'list',
                name: 'type',
                message: 'Select repository type:',
                choices: [
                    commits.TYPES.GITHUB,
                    commits.TYPES.BITBUCKET
                ],
                default: repository_package ? _getRepositoryTypeFromUrl(repository_package.repository) : commits.TYPES.GITHUB
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}

function getRepositoryCreds(type) {
    return new Promise(resolve => {
        const questions = [
            {
                name: 'username',
                type: 'input',
                message: `Enter ${ type } username:`,
                validate: value => value.length ? true : 'Please enter a value.'
            },
            {
                name: 'password',
                type: 'password',
                message: `Enter ${ type } password:`,
                validate: value => value.length ? true : 'Please enter a value.'
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}

function getRepositoryInfo() {
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
                default: repository_package && repository_package.author ? repository_package.author : '',
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

// PRIVATE

function _getRepositoryTypeFromUrl(repository_url) {
    if (!repository_url) { return commits.TYPES.GITHUB; }

    if (repository_url.indexOf('github') >= 0) {
        return commits.TYPES.GITHUB;
    }
    else if (repository_url.indexOf('bitbucket') >= 0) {
        return commits.TYPES.BITBUCKET;
    }

    return commits.TYPES.GITHUB;
}
