/* ==================================================
    VELOCITY
================================================== */

import { expect } from 'chai';
import moment from 'moment';
import { isEmpty } from 'lodash';

import { FORMATS, Velocity } from './velocity.js';

const velocity_week = Velocity(FORMATS.WEEK);
const velocity_month = Velocity(FORMATS.MONTH);

const now = moment();
const start_of_week = moment(now).startOf('week').hours(0);
const start_of_month = moment(now).startOf('month').hours(0);

const commits = [
    {
        id: '0',
        author: 'Author 1',
        message: 'Test Message 1',
        date: undefined
    },
    {
        id: '1',
        author: 'Author 2',
        message: 'Test Message 2',
        date: undefined
    }
];

describe('Velocity', () => {
    describe('getFormat', () => {
        it(`${ FORMATS.WEEK }: Returns correct format.`, done => {
            const result = velocity_week.getFormat();

            expect(result).to.equal(FORMATS.WEEK);

            done();
        });

        /* ========= */

        it(`${ FORMATS.MONTH }: Returns correct format.`, done => {
            const result = velocity_month.getFormat();

            expect(result).to.equal(FORMATS.MONTH);

            done();
        });
    });

    describe('isDateWithinThisTimeFrame', () => {
        it(`${ FORMATS.WEEK }: True when date within time frame.`, done => {
            const value = moment(start_of_week).add(1, 'minute');

            const result = velocity_week.isDateWithinThisTimeFrame(value);

            expect(result).to.equal(true);

            done();
        });
        it(`${ FORMATS.WEEK }: False when date not within time frame.`, done => {
            const value = moment(start_of_week).subtract(1, 'week').subtract(1, 'minute');

            const result = velocity_week.isDateWithinThisTimeFrame(value);

            expect(result).to.equal(false);

            done();
        });

        /* ========= */

        it(`${ FORMATS.MONTH }: True when date within time frame.`, done => {
            const value = moment(start_of_month).add(1, 'minute');

            const result = velocity_month.isDateWithinThisTimeFrame(value);

            expect(result).to.equal(true);

            done();
        });
        it(`${ FORMATS.MONTH }: False when date not within time frame.`, done => {
            const value = moment(start_of_month).subtract(1, 'month').subtract(1, 'minute');

            const result = velocity_month.isDateWithinThisTimeFrame(value);

            expect(result).to.equal(false);

            done();
        });
    });

    describe('isDateWithinLastTimeFrame', () => {
        it(`${ FORMATS.WEEK }: True when date within time frame.`, done => {
            const value = moment(start_of_week).subtract(1, 'week').add(1, 'minute');

            const result = velocity_week.isDateWithinLastTimeFrame(value);

            expect(result).to.equal(true);

            done();
        });
        it(`${ FORMATS.WEEK }: False when date not within time frame.`, done => {
            const value = moment(start_of_week).subtract(2, 'week').subtract(1, 'minute');

            const result = velocity_week.isDateWithinLastTimeFrame(value);

            expect(result).to.equal(false);

            done();
        });

        /* ========= */

        it(`${ FORMATS.MONTH }: True when date within time frame.`, done => {
            const value = moment(start_of_month).subtract(1, 'month').add(1, 'minute');

            const result = velocity_month.isDateWithinLastTimeFrame(value);

            expect(result).to.equal(true);

            done();
        });
        it(`${ FORMATS.MONTH }: False when date not within time frame.`, done => {
            const value = moment(start_of_month).subtract(2, 'month').subtract(1, 'minute');

            const result = velocity_month.isDateWithinLastTimeFrame(value);

            expect(result).to.equal(false);

            done();
        });
    });

    describe('groupCommitsByFormat', () => {
        it(`${ FORMATS.WEEK }: Empty when commits are empty.`, async () => {
            const result = await velocity_week.groupCommitsByFormat([]);

            expect(isEmpty(result.current)).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.WEEK }: Empty when commits are out of range.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_week).subtract(1, 'week').subtract(1, 'minute');
            values[1].date = moment(start_of_week).add(1, 'week').add(1, 'minue');

            const result = await velocity_week.groupCommitsByFormat(values);

            expect(isEmpty(result.current)).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.WEEK }: Previous values when commits are in last time frame.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_week).subtract(1, 'week').add(1, 'minute');
            values[1].date = moment(start_of_week).subtract(1, 'minute');

            const result = await velocity_week.groupCommitsByFormat(values);

            expect(isEmpty(result.current)).to.equal(true);
            expect(result.previous.length === 2).to.equal(true);
        });
        it(`${ FORMATS.WEEK }: Current values when commits are in current time frame.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_week).add(1, 'minute');
            values[1].date = moment(now).subtract(1, 'minute');

            const result = await velocity_week.groupCommitsByFormat(values);

            expect(result.current.length === 2).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.WEEK }: Current and Previous values when commits are in both time frames.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_week).subtract(1, 'week').add(1, 'minute');
            values[1].date = moment(now).subtract(1, 'minute');

            const result = await velocity_week.groupCommitsByFormat(values);

            expect(result.current.length === 1).to.equal(true);
            expect(result.previous.length === 1).to.equal(true);
        });

        /* ========= */

        it(`${ FORMATS.MONTH }: Empty when commits are empty.`, async () => {
            const result = await velocity_month.groupCommitsByFormat([]);

            expect(isEmpty(result.current)).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.MONTH }: Empty when commits are out of range.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_month).subtract(1, 'month').subtract(1, 'minute');
            values[1].date = moment(start_of_month).add(1, 'month').add(1, 'minue');

            const result = await velocity_month.groupCommitsByFormat(values);

            expect(isEmpty(result.current)).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.MONTH }: Previous values when commits are in last time frame.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_month).subtract(1, 'month').add(1, 'minute');
            values[1].date = moment(start_of_month).subtract(1, 'minute');

            const result = await velocity_month.groupCommitsByFormat(values);

            expect(isEmpty(result.current)).to.equal(true);
            expect(result.previous.length === 2).to.equal(true);
        });
        it(`${ FORMATS.MONTH }: Current values when commits are in current time frame.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_month).add(1, 'minute');
            values[1].date = moment(now).subtract(1, 'minute');

            const result = await velocity_month.groupCommitsByFormat(values);

            expect(result.current.length === 2).to.equal(true);
            expect(isEmpty(result.previous)).to.equal(true);
        });
        it(`${ FORMATS.MONTH }: Current and Previous values when commits are in both time frames.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(start_of_month).subtract(1, 'month').add(1, 'minute');
            values[1].date = moment(now).subtract(1, 'minute');

            const result = await velocity_month.groupCommitsByFormat(values);

            expect(result.current.length === 1).to.equal(true);
            expect(result.previous.length === 1).to.equal(true);
        });
    });

    describe('groupCommitsByDay', () => {
        it(`${ FORMATS.WEEK }: Days have a count of zero when commits are empty.`, async () => {
            const result = await velocity_week.groupCommitsByDay([]);

            expect(Object.keys(result).some(key => result[key].length !== 0)).to.equal(false);
        });
        it(`${ FORMATS.WEEK }: Days have correct count when commits are staggered.`, async () => {
            const values = [
                ...commits.map(commit => Object.assign({}, commit)),
                ...commits.map(commit => Object.assign({}, commit)),
                ...commits.map(commit => Object.assign({}, commit)),
                Object.assign({}, commits[0]) ];

            values[0].date = moment(now).day('Monday');
            values[1].date = moment(now).day('Tuesday');
            values[2].date = moment(now).day('Wednsday');
            values[3].date = moment(now).day('Thursday');
            values[4].date = moment(now).day('Friday');
            values[5].date = moment(now).day('Saturday');
            values[6].date = moment(now).day('Sunday');

            const result = await velocity_week.groupCommitsByDay(values);

            expect(result.Mon.length === 1).to.equal(true);
            expect(result.Tue.length === 1).to.equal(true);
            expect(result.Wed.length === 1).to.equal(true);
            expect(result.Thu.length === 1).to.equal(true);
            expect(result.Fri.length === 1).to.equal(true);
            expect(result.Sat.length === 1).to.equal(true);
            expect(result.Sun.length === 1).to.equal(true);
        });
        it(`${ FORMATS.WEEK }: Day has correct count when multiple commits are valid.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(now).day('Monday');
            values[1].date = moment(now).day('Monday');

            const result = await velocity_week.groupCommitsByDay(values);

            expect(result.Mon.length === 2).to.equal(true);
        });

        /* ========= */

        it(`${ FORMATS.MONTH }: Days have a count of zero when commits are empty.`, async () => {
            const result = await velocity_month.groupCommitsByDay([]);

            expect(Object.keys(result).some(key => result[key].length !== 0)).to.equal(false);
        });
        it(`${ FORMATS.MONTH }: Days have correct count when commits are staggered.`, async () => {
            const values = [
                ...commits.map(commit => Object.assign({}, commit)),
                ...commits.map(commit => Object.assign({}, commit)),
                ...commits.map(commit => Object.assign({}, commit)),
                Object.assign({}, commits[0]) ];

            values[0].date = moment(now).date('2');
            values[1].date = moment(now).date('6');
            values[2].date = moment(now).date('14');
            values[3].date = moment(now).date('18');
            values[4].date = moment(now).date('23');
            values[5].date = moment(now).date('29');
            values[6].date = moment(now).date('30');

            const result = await velocity_month.groupCommitsByDay(values);

            expect(result['2'].length === 1).to.equal(true);
            expect(result['6'].length === 1).to.equal(true);
            expect(result['14'].length === 1).to.equal(true);
            expect(result['18'].length === 1).to.equal(true);
            expect(result['23'].length === 1).to.equal(true);
            expect(result['29'].length === 1).to.equal(true);
            expect(result['30'].length === 1).to.equal(true);
        });
        it(`${ FORMATS.MONTH }: Day has correct count when multiple commits are valid.`, async () => {
            const values = [ ...commits ];
            values[0].date = moment(now).date('4');
            values[1].date = moment(now).date('4');

            const result = await velocity_month.groupCommitsByDay(values);

            expect(result['4'].length === 2).to.equal(true);
        });
    });
});
