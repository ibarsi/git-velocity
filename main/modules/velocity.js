/* ==================================================
    VELOCITY
================================================== */

import moment from 'moment';

// PUBLIC

export const FORMATS = {
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY'
};

export function getCommitVelocityByFormat(format, commits) {
    switch (format) {
        case FORMATS.WEEKLY:
            return _getCommitVelocityOverTime(commits, 'isoWeek');
        case FORMATS.MONTHLY:
            return _getCommitVelocityOverTime(commits, 'month');
        case FORMATS.YEARLY:
            return _getCommitVelocityOverTime(commits, 'year');
        default:
            return undefined;
    }
}

export default {
    FORMATS,
    getCommitVelocityByFormat
};

// PRIVATE

function Velocity(current, previous) {
    return {
        current,
        previous,
        diff: current - previous,
        velocity: (previous <= 0 ? current : current / previous) * 100
    };
}

function _getCommitVelocityOverTime(commits, time) {
    const start_of_week = moment().startOf(time).hours(0);
    const start_of_last_week = moment(start_of_week).subtract(1, `${ time }s`);

    const commits_this_week = commits.filter(commit => start_of_week.isBefore(commit.date));
    const commits_last_week = commits.filter(commit => start_of_last_week.isBefore(commit.date) && start_of_week.isAfter(commit.date));

    return Velocity(commits_this_week.length, commits_last_week.length);
}
