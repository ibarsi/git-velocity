import { screen } from 'blessed';
import { grid, markdown, log, line } from 'blessed-contrib';

import { async } from './helpers';
import { Velocity } from './velocity';

// SETTINGS

const info_content =
`# GIT VELOCITY
Welcome to the \`git-velocity\` dashboard!

Current Commits: *{{current_commits}}*
Previous Commits: *{{previous_commits}}*

Press \`Esc\` or \`Ctrl/Cmd-C\` to quit.`;

const listing_settings = {
    fg: 'green',
    selectedFg: 'green',
    label: 'Commit Log'
};

const line_settings = {
    style: {
        line: 'yellow',
        text: 'white',
        baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: true,
    label: 'Commit Velocity'
};

// PUBLIC

export default function CommitsDashboard() {
    let dashboard;
    let layout;

    return {
        render(format, commits) {
            return new Promise((resolve, reject) => {
                async(function* () {
                    try {
                        if (!dashboard) {
                            dashboard = _initScreen();
                            layout = _initLayout(dashboard);
                        }

                        const velocity = Velocity(format);
                        const grouped_commits = yield velocity.groupCommitsByFormat(commits);

                        // INFO

                        const info_content_formatted = info_content
                            .replace('{{current_commits}}', grouped_commits.current.length)
                            .replace('{{previous_commits}}', grouped_commits.previous.length);

                        // LISTING
                        const commit_messages = commits.map(commit => `${ commit.author }: ${ commit.message }`).reverse();

                        const previous_daily_commits = yield velocity.groupCommitsByDay(grouped_commits.previous);
                        const previous_days = Object.keys(previous_daily_commits);

                        const previous_commits = {
                            title: 'Previous',
                            x: previous_days,
                            y: previous_days.map(day => previous_daily_commits[day].length),
                            style: {
                                line: 'red'
                            }
                        };

                        const current_daily_commits = yield velocity.groupCommitsByDay(grouped_commits.current);
                        const current_days = Object.keys(current_daily_commits);

                        const current_commits = {
                            title: 'Current',
                            x: current_days,
                            y: current_days.map(day => current_daily_commits[day].length),
                            style: {
                                line: 'green'
                            }
                        };

                        layout.info.setMarkdown(info_content_formatted);
                        layout.velocity.setData([ previous_commits, current_commits ]);
                        commit_messages.forEach(message => layout.listing.log(message));

                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }
    };
}

// PRIVATE

function _initScreen() {
    const dashboard = screen();
    dashboard.key([ 'escape', 'C-c' ], () => process.exit(0));

    return dashboard;
}

function _initLayout(dashboard) {
    const layout = new grid({ rows: 12, cols: 12, screen: dashboard });

    // layout.set(row, col, rowSpan, colSpan, obj, opts)
    const info = layout.set(0, 0, 4, 6, markdown);
    const listing = layout.set(0, 6, 4, 6, log, listing_settings);
    const velocity = layout.set(4, 0, 8, 12, line, line_settings);

    return {
        info,
        listing,
        velocity
    };
}
