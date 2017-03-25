/* ==================================================
    COMMITS
================================================== */

import { expect } from 'chai';
import sinon from 'sinon';
import sinon_test from 'sinon-test';
import fetch_mock from 'fetch-mock';
import { isEmpty, isArray } from 'lodash';

import { TYPES, Commits } from '../../modules/commits.js';
import auth, * as auth_modules from '../../modules/auth.js';
import bitbucket_commits_data from '../data/commits_bitbucket_data.json';
import github_commits_data from '../data/commits_github_data.json';
import github_branch_data from '../data/branch_github_data.json';
import github_branches_data from '../data/branches_github_data.json';

sinon.test = sinon_test.configureTest(sinon);
sinon.testCase = sinon_test.configureTestCase(sinon);

const fake_auth = {
    getCreds() {
        return {
            username: '',
            password: ''
            };
    }
};

describe('Commits', () => {
    describe('getCommitsByRepo', () => {
        it(`${ TYPES.BITBUCKET } - Return correct results with no pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get('https://api.bitbucket.org/2.0/repositories/bar/foo/commits', bitbucket_commits_data);

            const bitbucket_commits = Commits(TYPES.BITBUCKET);

            const result = await bitbucket_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === bitbucket_commits_data.values.length).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.BITBUCKET } - Return correct results with 2 pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get(
                'https://api.bitbucket.org/2.0/repositories/bar/foo/commits',
                Object.assign({}, bitbucket_commits_data, {
                    next: 'https://api.bitbucket.org/2.0/repositories/bar/foo/commits?page=2'
                }));
            fetch_mock.get('https://api.bitbucket.org/2.0/repositories/bar/foo/commits?page=2', bitbucket_commits_data);

            const bitbucket_commits = Commits(TYPES.BITBUCKET);

            const result = await bitbucket_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === bitbucket_commits_data.values.length * 2).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.BITBUCKET } - Return no results when owner is empty`, async () => {
            const bitbucket_commits = Commits(TYPES.BITBUCKET);

            const result = await bitbucket_commits.getCommitsByRepo('foo');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });
        it(`${ TYPES.BITBUCKET } - Return no results when repository is empty`, async () => {
            const bitbucket_commits = Commits(TYPES.BITBUCKET);

            const result = await bitbucket_commits.getCommitsByRepo(undefined, 'bar');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });

    //     /* ========= */

        it(`${ TYPES.GITHUB } - Return correct results with one branch, no pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get('https://api.github.com/repos/bar/foo/branches', github_branch_data);
            fetch_mock.get('https://api.github.com/repos/bar/foo/commits?sha=master', github_commits_data);

            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === github_commits_data.length).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.GITHUB } - Return correct results with 2 branches (same commits), no pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get('https://api.github.com/repos/bar/foo/branches', github_branches_data);
            fetch_mock.get('https://api.github.com/repos/bar/foo/commits?sha=master', github_commits_data);
            fetch_mock.get('https://api.github.com/repos/bar/foo/commits?sha=develop', github_commits_data);

            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === github_commits_data.length).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.GITHUB } - Return correct results with 2 branches (different commits), no pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get('https://api.github.com/repos/bar/foo/branches', github_branches_data);
            fetch_mock.get('https://api.github.com/repos/bar/foo/commits?sha=master', github_commits_data);
            fetch_mock.get(
                'https://api.github.com/repos/bar/foo/commits?sha=develop',
                github_commits_data.map(commit => Object.assign({}, commit, { sha: `MODIFIED - ${ commit.sha }` }))
            );

            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === github_commits_data.length * 2).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.GITHUB } - Return correct results with 2 branches (some overlapping commits), no pages`, sinon.test(async function() {
            const Auth_modules_stub = this.stub(auth_modules, 'Auth');
            Auth_modules_stub.returns(fake_auth);
            const Auth_stub = this.stub(auth, 'Auth');
            Auth_stub.returns(fake_auth);

            fetch_mock.get('https://api.github.com/repos/bar/foo/branches', github_branches_data);
            fetch_mock.get('https://api.github.com/repos/bar/foo/commits?sha=master', github_commits_data);
            fetch_mock.get(
                'https://api.github.com/repos/bar/foo/commits?sha=develop',
                github_commits_data.map((commit, index) => {
                    return index % 2 === 0 ? Object.assign({}, commit, { sha: `MODIFIED - ${ commit.sha }` }) : commit;
                })
            );

            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo('foo', 'bar');

            expect(!isEmpty(result)).to.equal(true);
            expect(result.length === github_commits_data.length * 1.5).to.equal(true);

            fetch_mock.restore();
        }));
        it(`${ TYPES.GITHUB } - Return correct results with 2 pages`, async () => {
            // TODO: IMPLEMENT
        });
        it(`${ TYPES.GITHUB } - Return no results when owner is empty`, async () => {
            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo('foo');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });
        it(`${ TYPES.GITHUB } - Return no results when repository is empty`, async () => {
            const github_commits = Commits(TYPES.GITHUB);

            const result = await github_commits.getCommitsByRepo(undefined, 'bar');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });
    });
});
