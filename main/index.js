#!/usr/bin/env node

/* ==================================================
    INDEX
================================================== */

import path from 'path';
import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';

import { isFile, wrapSpinner } from './modules/helpers';
import { TYPES, Commits, getRepositoryTypeFromUrl } from './modules/commits';
import { FORMATS, Velocity } from './modules/velocity';
import CommitsDashboard from './modules/dashboard';

const repository_package_path = `${ process.cwd() }/package.json`;
const repository_package = isFile(repository_package_path) ? require(repository_package_path) : undefined;

// BANNER

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Git Velocity', {
            horizontalLayout: 'full'
        })
    )
);

// START

(async function start() {
    try {
        const { type } = await getRepositoryType();
        const commits = Commits(type);

        const isAuthorized = await commits.isAuthorized();

        if (!isAuthorized) {
            console.log();
            console.log(chalk.white('Creating auth token in root.'));

            const { username, password } = await getRepositoryCreds(type);

            commits.authorize(username, password);
        }

        console.log();
        console.log(chalk.white('Provide information regarding the repository you\'d like to analyze.'));

        const { repository, owner } = await getRepositoryInfo();
        const { format } = await getVelocityFormat();

        const velocity = Velocity(format);

        const data = await wrapSpinner(commits.getCommitsByRepo, 'Pulling commits...')(repository, owner,
            commit => !velocity.isDateWithinThisTimeFrame(commit.date) && !velocity.isDateWithinLastTimeFrame(commit.date));

        const dashboard = CommitsDashboard();
        await dashboard.render(format, data);
    }
    catch (error) {
        console.error(chalk.red('=== ERROR ==='));
        console.log(error);
    }
})();

// PROMPTS

async function getRepositoryType() {
    const questions = [
        {
            type: 'list',
            name: 'type',
            message: 'Select repository type:',
            choices: [
                TYPES.GITHUB,
                TYPES.BITBUCKET
            ],
            default: repository_package ?
                getRepositoryTypeFromUrl(typeof repository_package.repository === 'string' ?
                    repository_package.repository :
                    repository_package.repository.type || repository_package.repository.url) :
                TYPES.GITHUB
        }
    ];

    return await inquirer.prompt(questions);
}

async function getRepositoryCreds(type) {
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

    return await inquirer.prompt(questions);
}

async function getRepositoryInfo() {
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

    return await inquirer.prompt(questions);
}

async function getVelocityFormat() {
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

    return await inquirer.prompt(questions);
}
