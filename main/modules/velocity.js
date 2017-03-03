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
        groupCommitsByFormat(commits) {
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
        },
        groupCommitsByDay(commits) {
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
