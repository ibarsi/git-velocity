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
        isDateWithinThisTimeFrame: partial(_isDateWithinThisTimeFrame, format),
        isDateWithinLastTimeFrame: partial(_isDateWithinLastTimeFrame, format),
        groupCommitsByFormat: partial(_groupCommitsByTime, _getFormatTimeValue(format)),
        groupCommitsByDay: partial(_groupCommitsByDay, format)
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

function _isDateWithinThisTimeFrame(format, date) {
    const time = _getFormatTimeValue(format);

    const now = moment();
    const start_of_time = moment(now).startOf(time).hours(0);

    return start_of_time.isBefore(date) && now.isAfter(date);
}

function _isDateWithinLastTimeFrame(format, date) {
    const time = _getFormatTimeValue(format);

    const now = moment();
    const start_of_time = moment(now).startOf(time).hours(0);
    const start_of_last_time = moment(start_of_time).subtract(1, `${ time }s`);

    return start_of_last_time.isBefore(date) && start_of_time.isAfter(date);
}

function _groupCommitsByTime(time, commits) {
    return new Promise((resolve, reject) => {
        try {
            const now = moment();
            const start_of_time = moment(now).startOf(time).hours(0);
            const start_of_last_time = moment(start_of_time).subtract(1, `${ time }s`);

            const commits_this_time = commits.filter(commit => start_of_time.isBefore(commit.date) && now.isAfter(commit.date));
            const commits_last_time = commits.filter(commit => start_of_last_time.isBefore(commit.date) && start_of_time.isAfter(commit.date));

            resolve({
                current: commits_this_time,
                previous: commits_last_time
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

function _groupCommitsByDay(format, commits) {
    return new Promise((resolve, reject) => {
        try {
            const days_of_week = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
            const days_of_month = [ ...Array(31).keys() ].map(i => ++i);

            switch (format) {
                case FORMATS.WEEK:
                    resolve(days_of_week.reduce((group, day) => {
                        group[day] = commits.filter(commit => moment(commit.date).format('ddd') === day);

                        return group;
                    }, {}));

                    break;
                case FORMATS.MONTH:
                    resolve(days_of_month.reduce((group, day) => {
                        group[day] = commits.filter(commit => moment(commit.date).date() === day);

                        return group;
                    }, {}));

                    break;
                default:
                    resolve({});
            }
        }
        catch (error) {
            reject(error);
        }
    });
}
