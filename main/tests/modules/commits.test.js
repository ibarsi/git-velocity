/* ==================================================
    VELOCITY
================================================== */

import { expect } from 'chai';
import { isEmpty, isArray } from 'lodash';

import { TYPES, Commits } from '../../modules/commits.js';

const bitbucket_commits = Commits(TYPES.BITBUCKET);

describe('Commits', () => {
    describe('getCommitsByRepo', () => {
        it('Return no results when owner is empty', async () => {
            const result = await bitbucket_commits.getCommitsByRepo('test');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });
        it('Return no results when repository is empty', async () => {
            const result = await bitbucket_commits.getCommitsByRepo(undefined, 'test');

            expect(isArray(result) && isEmpty(result)).to.equal(true);
        });
    });
});
