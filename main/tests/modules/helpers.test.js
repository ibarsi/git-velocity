/* ==================================================
    HELPERS
================================================== */

import fs from 'fs';

import { expect } from 'chai';
import { isEmpty, isArray } from 'lodash';
import sinon from 'sinon';
import sinon_test from 'sinon-test';

import { isFile, uniq, wrapSpinner, partial } from '../../modules/helpers.js';

sinon.test = sinon_test.configureTest(sinon);
sinon.testCase = sinon_test.configureTestCase(sinon);

describe('Helpers', () => {
    describe('isFile', () => {
        it('Expect valid file path to be true.', sinon.test(function() {
            const statSync_stub = this.stub(fs, 'statSync');
            statSync_stub.returns({ isFile: () => true });

            const result = isFile('./real/file/path.js');

            expect(result).to.equal(true);
        }));
        it('Expect non-existant file path to be blank.', sinon.test(function() {
            const statSync_stub = this.stub(fs, 'statSync');
            statSync_stub.returns({ isFile: () => false });

            const result = isFile('./fake/file/path.js');

            expect(result).to.equal(false);
        }));
        it('Expect exception to return false.', sinon.test(function() {
            const statSync_stub = this.stub(fs, 'statSync');
            statSync_stub.throws(new Error('FAIL'));

            const result = isFile();

            expect(result).to.equal(false);
        }));
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

    describe('partial', () => {
        it('Expect partially applied function to return correct value.', done => {
            const add10 = partial((num1, num2) => num1 + num2, 10);

            const result = add10(20);

            expect(result).to.equal(30);

            done();
        });
    });
});
