import { screen } from 'blessed';
import { grid, markdown, log, line } from 'blessed-contrib';
import moment from 'moment';

import { Velocity } from './velocity';

// SETTINGS

const info_content =
`# GIT VELOCITY
Welcome to the \`git-velocity\` dashboard!

Configuration: __{{format}}__
Current Commits: __{{current_commits}}__
Previous Commits: __{{previous_commits}}__

Press \`Esc\` or \`Ctrl-C\` to quit.`;

const listing_settings = {
    fg: 'green',
    selectedFg: 'green',
    label: 'Commit Log'
};

const line_settings = {
    style: {
        line: 'yellow',
        text: 'white',
        baseline: 'white'
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
        async render(format, commits) {
            // INIT

            if (!dashboard) {
                dashboard = _initScreen();
                layout = _initLayout(dashboard);
            }

            const velocity = Velocity(format);
            const grouped_commits = await velocity.groupCommitsByFormat(commits);

            // INFO

            const info_content_formatted = info_content
                .replace('{{format}}', format)
                .replace('{{current_commits}}', grouped_commits.current.length)
                .replace('{{previous_commits}}', grouped_commits.previous.length);

            // LISTING

            const commit_messages = [ ...grouped_commits.current, ...grouped_commits.previous ]
                .map(commit => `(${ moment(commit.date).format('MMM Do') }) ${ commit.author }: ${ commit.message }`)
                .reverse();

            // VELOCITY

            const previous_daily_commits = await velocity.groupCommitsByDay(grouped_commits.previous);
            const previous_days = Object.keys(previous_daily_commits);

            const previous_commits = {
                title: 'Previous',
                x: previous_days,
                y: previous_days.map(day => previous_daily_commits[day].length),
                style: {
                    line: 'red'
                }
            };

            const current_daily_commits = await velocity.groupCommitsByDay(grouped_commits.current);
            const current_days = Object.keys(current_daily_commits);

            const current_commits = {
                title: 'Current',
                x: current_days,
                y: current_days.map(day => current_daily_commits[day].length),
                style: {
                    line: 'green'
                }
            };

            // LAYOUT

            layout.info.setMarkdown(info_content_formatted);
            layout.velocity.setData([ previous_commits, current_commits ]);
            commit_messages.forEach(message => layout.listing.log(message));
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
