/* ==================================================
    AUTH
================================================== */

import os from 'os';
import fs from 'fs';

import chai from 'chai';
import chai_promise from 'chai-as-promised';
import sinon from 'sinon';
import sinon_test from 'sinon-test';
import { isEmpty } from 'lodash';

import { Auth } from '../../modules/auth.js';
import helpers, * as helpers_modules from '../../modules/helpers.js';

sinon.test = sinon_test.configureTest(sinon);
sinon.testCase = sinon_test.configureTestCase(sinon);

chai.use(chai_promise);
const expect = chai.expect;

const auth = Auth();

describe('Auth', () => {
    describe('isCredsTokenInitialized', () => {
        it('Expect initialized auth token to return true.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const isFile_stub = this.stub(helpers, 'isFile');
            const isFile_module_stub = this.stub(helpers_modules, 'isFile');
            isFile_stub.returns(true);
            isFile_module_stub.returns(true);

            const result = await auth.isCredsTokenInitialized();

            expect(result).to.equal(true);
        }));
        it('Expect un-initialized auth token to return false.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const isFile_stub = this.stub(helpers, 'isFile');
            const isFile_module_stub = this.stub(helpers_modules, 'isFile');
            isFile_stub.returns(false);
            isFile_module_stub.returns(false);

            const result = await auth.isCredsTokenInitialized();

            expect(result).to.equal(false);
        }));
    });

    describe('getCreds', () => {
        it('Expect valid token contents to be returned.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const readFileSync_stub = this.stub(fs, 'readFileSync');
            readFileSync_stub.returns({});
            const parse_stub = this.stub(JSON, 'parse');
            parse_stub.returns({ foo: 'bar' });

            const result = await auth.getCreds();

            expect(isEmpty(result)).to.equal(false);
            expect(result.foo).to.equal('bar');
        }));
        it('Expect error if no token exists.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const readFileSync_stub = this.stub(fs, 'readFileSync');
            readFileSync_stub.throws(new Error('FAIL'));

            await expect(auth.getCreds()).to.be.rejectedWith(Error);
        }));
        it('Expect error if token does not contain valid JSON.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const readFileSync_stub = this.stub(fs, 'readFileSync');
            readFileSync_stub.returns({});
            const parse_stub = this.stub(JSON, 'parse');
            parse_stub.throws(new Error('FAIL'));

            await expect(auth.getCreds()).to.be.rejectedWith(Error);
        }));
    });

    describe('storeCreds', () => {
        it('Expect no error when storing valid creds.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const writeFile_stub = this.stub(fs, 'writeFile');
            writeFile_stub.callsArgWith(2, undefined);
            const stringify_stub = this.stub(JSON, 'stringify');
            stringify_stub.returns('');

            const result = await auth.storeCreds('foo', 'bar');

            expect(isEmpty(result)).to.equal(true);
        }));
        it('Expect error when storing creds without a username.', sinon.test(async function() {
            await expect(auth.getCreds(undefined, 'bar')).to.be.rejectedWith(Error);
        }));
        it('Expect error when storing creds without a password.', sinon.test(async function() {
            await expect(auth.getCreds('foo')).to.be.rejectedWith(Error);
        }));
        it('Expect error when writeFile fails.', sinon.test(async function() {
            const homedir_stub = this.stub(os, 'homedir');
            homedir_stub.returns('');
            const writeFile_stub = this.stub(fs, 'writeFile');
            writeFile_stub.callsArgWith(2, new Error('FAIL'));
            const stringify_stub = this.stub(JSON, 'stringify');
            stringify_stub.returns('');

            await expect(auth.storeCreds('foo', 'bar')).to.be.rejectedWith(Error);
        }));
    });
});
