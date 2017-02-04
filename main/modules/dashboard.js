import { screen } from 'blessed';
import { grid, markdown, log, line } from 'blessed-contrib';

// SETTINGS

const info_content =
`# GIT VELOCITY
Welcome to the \`git-velocity\` dashboard!

Current Commits: {previous_commits}
Previous Commits: {current_commits}

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
    const dashboard = screen();
    dashboard.key([ 'escape', 'C-c' ], () => process.exit(0));

    // LAYOUT

    const layout = new grid({ rows: 12, cols: 12, screen: dashboard });

    // layout.set(row, col, rowSpan, colSpan, obj, opts)
    const info = layout.set(0, 0, 4, 6, markdown);
    const listing = layout.set(0, 6, 4, 6, log, listing_settings);
    const velocity = layout.set(4, 0, 8, 12, line, line_settings);

    return {
        // TODO: Get/set data through params.
        setData() {
            // DATA

            const days = [ 'Mon', 'Tues', 'Wen', 'Thurs', 'Fri', 'Sat', 'Sun' ];

            const previous_commits = {
                title: 'Previous',
                x: days,
                y: [ 5, 1, 7, 5, 3, 10, 15 ],
                style: {
                    line: 'red'
                }
            };

            const current_commits = {
                title: 'Current',
                x: days,
                y: [ 2, 1, 4, 8, 3, 12, 6 ],
                style: {
                    line: 'green'
                }
            };

            const commit_messages = [
                'Igor Barsi: [CPA-98] - Removed un-used styles.'
            ];

            info.setMarkdown(info_content);
            velocity.setData([ current_commits, previous_commits ]);
            commit_messages.forEach(message => listing.log(message));
        },
        render() {
            dashboard.render();
        }
    };
}
