#!/usr/bin/env node

/* ==================================================
    INDEX
================================================== */

import 'babel-polyfill';
import path from 'path';
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';

import { isFile, wrapSpinner, async } from './modules/helpers';
import { TYPES, Commits, getRepositoryTypeFromUrl } from './modules/commits';
import { FORMATS } from './modules/velocity';
import CommitsDashboard from './modules/dashboard';

const repository_package_path = `${ process.cwd() }/package.json`;
const repository_package = isFile(repository_package_path) ? require(repository_package_path) : undefined;

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', { horizontalLayout: 'full' })
    )
);

// START

async(function* () {
    try {
        const { type } = yield getRepositoryType();
        const commits = Commits(type);

        const isTokenInitialized = yield commits.isCredsTokenInitialized();

        if (!isTokenInitialized) {
            console.log();
            console.log(chalk.white('Creating auth token in root.'));

            const { username, password } = yield getRepositoryCreds(type);

            commits.storeCreds(username, password);
        }

        console.log();
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        const { repository, owner } = yield getRepositoryInfo();
        const data = yield wrapSpinner(commits.getCommitsByRepo, 'Pulling commits...')(repository, owner);
        const { format } = yield getVelocityFormat();

        const dashboard = CommitsDashboard();
        yield wrapSpinner(dashboard.render, 'Rendering dashboard...')(format, data);
    }
    catch (error) {
        console.error(chalk.red('=== ERROR ==='));
        console.log(error);
    }
});

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
                default: repository_package ? getRepositoryTypeFromUrl(repository_package.repository) : TYPES.GITHUB
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
                validate: value => value.length ? true : 'Please enter a value.'
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
                    FORMATS.WEEK,
                    FORMATS.MONTH
                ],
                default: FORMATS.WEEK
            }
        ];

        inquirer.prompt(questions).then(resolve);
    });
}