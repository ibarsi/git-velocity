/* ==================================================
    VELOCITY
================================================== */

import moment from 'moment';

import { partial } from './helpers';

// PUBLIC

export const FORMATS = {
    WEEK: 'WEEK',
    MONTH: 'MONTH'
};

export function Velocity(format) {
    return {
        groupCommitsByFormat: partial(_groupCommitsByFormat, format),
        groupCommitsByDay: partial(_groupCommitsByDay, format)
    };
}

export default {
    FORMATS,
    Velocity
};

// PRIVATE

function _groupCommitsByFormat(format, commits) {
    switch (format) {
        case FORMATS.WEEK:
            return _groupCommitsByTime('week', commits);
        case FORMATS.MONTH:
            return _groupCommitsByTime('month', commits);
        default:
            return undefined;
    }
}

function _groupCommitsByTime(time, commits) {
    const start_of_time = moment().startOf(time).hours(0);
    const start_of_last_time = moment(start_of_time).subtract(1, `${ time }s`);

    const commits_this_time = commits.filter(commit => start_of_time.isBefore(commit.date));
    const commits_last_time = commits.filter(commit => start_of_last_time.isBefore(commit.date) && start_of_time.isAfter(commit.date));

    return {
        current: commits_this_time,
        previous: commits_last_time
    };
}

function _groupCommitsByDay(format, commits) {
    const days_of_week = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ];

    switch (format) {
        case FORMATS.WEEK:
            return days_of_week.reduce((group, day) => {
                group[day] = commits.filter(commit => moment(commit.date).format('ddd') === day);

                return group;
            }, {});
        case FORMATS.MONTH:
            // TODO
            return {};
        default:
            return {};
    }
}
