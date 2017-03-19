/* ==================================================
    VELOCITY
================================================== */

import { expect } from 'chai';
import { isEmpty, isArray } from 'lodash';

import { isFile, uniq, wrapSpinner, partial } from '../../modules/helpers.js';

describe('Helpers', () => {
    describe('isFile', () => {
        it('Expect current file\'s path to be true.', done => {
            const result = isFile(__filename);

            expect(result).to.equal(true);

            done();
        });
        it('Expect blank file path to be false.', done => {
            const result = isFile('');

            expect(result).to.equal(false);

            done();
        });
        it('Expect non-existant file path to be false.', done => {
            const result = isFile(`${ __filename }.${ Math.random() }`);

            expect(result).to.equal(false);

            done();
        });
    });

    describe('uniq', () => {
        it('Expect empty list to return empty list.', done => {
            const result = uniq([]);

            expect(isArray(result) && isEmpty(result)).to.equal(true);

            done();
        });
        it('Expect function to find all unique values.', done => {
            const list = [
                {
                    id: 1,
                    title: 'Test 1'
                },
                {
                    id: 1,
                    title: 'Test 1.5'
                },
                {
                    id: 2,
                    title: 'Test 2'
                },
                {
                    id: 3,
                    title: 'Test 3'
                }
            ];

            const result = uniq(list, item => item.id);

            expect(result.length === 3).to.equal(true);

            done();
        });
    });

    describe('wrapSpinner', () => {
        it('Expect original resolved Promise to be fullfilled.', async () => {
            const wrappedPromise = wrapSpinner(value => new Promise(resolve => resolve(value)));

            const result = await wrappedPromise(true);

            expect(result).to.equal(true);
        });
        it('Expect original rejected Promise to be caught.', async () => {
            const exception = new Error('Test');

            const wrappedPromise = wrapSpinner(() => new Promise((resolve, reject) => reject(exception)));

            try {
                await wrappedPromise();
            }
            catch (error) {
                expect(error).to.equal(exception);
            }
        });
    });

    describe('requestPromise', () => {
        /* === TODO === */
    });

    describe('partial', () => {
        it('Expect partially applied function to return correct value.', done => {
            const add10 = partial((num1, num2) => num1 + num2, 10);

            const result = add10(20);

            expect(result).to.equal(30);

            done();
        });
    });
});
