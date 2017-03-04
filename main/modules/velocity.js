/* ==================================================
    VELOCITY
================================================== */

import moment from 'moment';

// PUBLIC

export const FORMATS = {
    WEEK: 'WEEK',
    MONTH: 'MONTH'
};

export function Velocity(format) {
    const time = _getFormatTimeValue(format);

    return {
        isDateWithinThisTimeFrame(date) {
            const now = moment();
            const start_of_time = moment(now).startOf(time).hours(0);

            return start_of_time.isBefore(date) && now.isAfter(date);
        },
        isDateWithinLastTimeFrame(date) {
            const now = moment();
            const start_of_time = moment(now).startOf(time).hours(0);
            const start_of_last_time = moment(start_of_time).subtract(1, `${ time }s`);

            return start_of_last_time.isBefore(date) && start_of_time.isAfter(date);
        },
        async groupCommitsByFormat(commits) {
            const now = moment();
            const start_of_time = moment(now).startOf(time).hours(0);
            const start_of_last_time = moment(start_of_time).subtract(1, `${ time }s`);

            const commits_this_time = commits.filter(commit => start_of_time.isBefore(commit.date) && now.isAfter(commit.date));
            const commits_last_time = commits.filter(commit => start_of_last_time.isBefore(commit.date) && start_of_time.isAfter(commit.date));

            return {
                current: commits_this_time,
                previous: commits_last_time
            };
        },
        async groupCommitsByDay(commits) {
            const days_of_week = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
            const days_of_month = [ ...Array(31).keys() ].map(i => ++i);

            switch (format) {
                case FORMATS.WEEK:
                    return days_of_week.reduce((group, day) => {
                        group[day] = commits.filter(commit => moment(commit.date).format('ddd') === day);

                        return group;
                    }, {});
                case FORMATS.MONTH:
                    return days_of_month.reduce((group, day) => {
                        group[day] = commits.filter(commit => moment(commit.date).date() === day);

                        return group;
                    }, {});
                default:
                    return {};
            }
        }
    };
}

export default {
    FORMATS,
    Velocity
};

// PRIVATE

function _getFormatTimeValue(format) {
    switch (format) {
        case FORMATS.WEEK:
            return 'week';
        case FORMATS.MONTH:
            return 'month';
        default:
            return undefined;
    }
}
