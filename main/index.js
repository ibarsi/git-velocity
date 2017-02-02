#!/usr/bin/env node

/* ==================================================
    INDEX
================================================== */

import path from 'path';
import clear from 'clear';
import chalk from 'chalk';
import CLI from 'clui';
import figlet from 'figlet';
import inquirer from 'inquirer';

import { isFile } from './lib/file_helper';
import { TYPES, Commits } from './lib/commits';
import { FORMATS, getCommitVelocityByFormat } from './lib/velocity';

const repository_package_path = `${ process.cwd() }/package.json`;
const repository_package = isFile(repository_package_path) ? require(repository_package_path) : undefined;

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
        const commits = Commits(type);

        return commits.isCredsTokenInitialized(type)
            .then(result => {
                if (result) { return Promise.resolve(); }

                console.log();
                console.log(chalk.white('Creating auth token in root.'));

                return getRepositoryCreds(type).then(({ username, password }) => commits.storeCreds(username, password));
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
                    commits.getCommitsByRepo(repository, owner)
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

                const commit_velocity = getCommitVelocityByFormat(choice.format, result);

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
                    TYPES.GITHUB,
                    TYPES.BITBUCKET
                ],
                default: repository_package ? _getRepositoryTypeFromUrl(repository_package.repository) : TYPES.GITHUB
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
                    FORMATS.WEEKLY,
                    FORMATS.MONTHLY,
                    FORMATS.YEARLY
                ],
                default: FORMATS.WEEKLY
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}

// PRIVATE

function _getRepositoryTypeFromUrl(repository_url) {
    if (!repository_url) { return TYPES.GITHUB; }

    if (repository_url.indexOf('github') >= 0) {
        return TYPES.GITHUB;
    }
    else if (repository_url.indexOf('bitbucket') >= 0) {
        return TYPES.BITBUCKET;
    }

    return TYPES.GITHUB;
}
