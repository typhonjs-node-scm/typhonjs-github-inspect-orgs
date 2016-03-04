'use strict';

import { assert }          from 'chai';
import fs                  from 'fs';

import GitHubInspectOrgs   from '../../src/GitHubInspectOrgs';

/**
 * This series of tests confirm that GitHubInspectOrgs properly queries the organizations and data associated with
 * `typhonjs-test`.
 *
 * The normalized data results are stripped of variable data and compared against stored JSON output in
 * `./test/fixture`.
 *
 * @test {onHandleCode}
 */
describe('GitHubInspectOrgs', () =>
{
   // Loads owner / user public access tokens from environment variables or from `./token.owner` and `./token.user` in
   // the root directory.
   //
   // For Travis CI this is the testing account public access token of `typhonjs-test` GitHub account. The associated
   // organizations are:
   // https://github.com/test-org-typhonjs
   // https://github.com/test-org-typhonjs2
   let ownerCredential = process.env.GITHUB_OWNER_TOKEN;

   // The user credential is owned by `typhonjs-test2` GitHub account.
   let userCredential = process.env.GITHUB_USER_TOKEN;

   const s_USER_NAME = 'typhonjs-test2';

   // If user ownerCredential is still undefined attempt to load from a local file `./owner.token`.
   if (typeof ownerCredential === 'undefined')
   {
      try { ownerCredential = fs.readFileSync('./token.owner', 'utf-8'); }
      catch(err) { /* ... */ }
   }

   // If user userCredential is still undefined attempt to load from a local file `./user.token`.
   if (typeof userCredential === 'undefined')
   {
      try { userCredential = fs.readFileSync('./token.user', 'utf-8'); }
      catch(err) { /* ... */ }
   }

   // Fail now if we don't have an owner token.
   if (typeof ownerCredential !== 'string')
   {
      throw new TypeError('No owner credentials found in `process.env.GITHUB_OWNER_TOKEN` or `./token.owner`.');
   }

   // Fail now if we don't have an user token.
   if (typeof userCredential !== 'string')
   {
      throw new TypeError('No user credentials found in `process.env.GITHUB_USER_TOKEN` or `./token.user`.');
   }

   const githubInspect = new GitHubInspectOrgs(
   {
      organizations: [{ credential: ownerCredential, owner: 'typhonjs-test', regex: '^test' }]
   });

   /**
    * Test `getCollaborators` without user credentials.
    */
   it('getCollaborators (all)', () =>
   {
      return githubInspect.getCollaborators().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-collaborators-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-collaborators-all');
      });
   });

   /**
    * Test `getCollaborators` with user credentials.
    */
   it('getCollaborators (user)', () =>
   {
      return githubInspect.getCollaborators({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-collaborators-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-collaborators-user');
      });
   });

   /**
    * Test `getContributors` without user credentials.
    */
   it('getContributors (all)', () =>
   {
      return githubInspect.getContributors().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-contributors-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-contributors-all');
      });
   });

   /**
    * Test `getContributors` with user credentials.
    */
   it('getContributors (user)', () =>
   {
      return githubInspect.getContributors({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-contributors-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-contributors-user');
      });
   });

   /**
    * Test `getMembers` without user credentials.
    */
   it('getMembers (all)', () =>
   {
      return githubInspect.getMembers().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-members-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-members-all');
      });
   });

   /**
    * Test `getMembers` with user credentials.
    */
   it('getMembers (user)', () =>
   {
      return githubInspect.getMembers({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-members-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-members-user');
      });
   });

   /**
    * Test `getOrgMembers` without user credentials.
    */
   it('getOrgMembers (all)', () =>
   {
      return githubInspect.getOrgMembers().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-members-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-members-all');
      });
   });

   /**
    * Test `getOrgMembers` with user credentials.
    */
   it('getOrgMembers (user)', () =>
   {
      return githubInspect.getOrgMembers({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-members-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-members-user');
      });
   });

   /**
    * Test `getOrgRepoCollaborators` without user credentials.
    */
   it('getOrgRepoCollaborators (all)', () =>
   {
      return githubInspect.getOrgRepoCollaborators().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-collaborators-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-collaborators-all');
      });
   });

   /**
    * Test `getOrgRepoCollaborators` with package.json & without user credentials.
    */
   it('getOrgRepoCollaborators (all) w/ package.json', () =>
   {
      return githubInspect.getOrgRepoCollaborators({ repoFiles: ['package.json'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-collaborators-all-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-collaborators-all-with-files');
      });
   });

   /**
    * Test `getOrgRepoCollaborators` with user credentials.
    */
   it('getOrgRepoCollaborators (user)', () =>
   {
      return githubInspect.getOrgRepoCollaborators({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-collaborators-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-collaborators-user');
      });
   });

   /**
    * Test `getOrgRepoCollaborators` with package.json & user credentials.
    */
   it('getOrgRepoCollaborators (user) w/ package.json', () =>
   {
      return githubInspect.getOrgRepoCollaborators({ credential: userCredential, repoFiles: ['package.json'] }).then(
       (data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-collaborators-user-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-collaborators-user-with-files');
      });
   });

   /**
    * Test `getOrgRepoContributors` without user credentials.
    */
   it('getOrgRepoContributors (all)', () =>
   {
      return githubInspect.getOrgRepoContributors().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-contributors-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-contributors-all');
      });
   });

   /**
    * Test `getOrgRepoContributors` with package.json & without user credentials.
    */
   it('getOrgRepoContributors (all) w/ package.json', () =>
   {
      return githubInspect.getOrgRepoContributors({ repoFiles: ['package.json'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-contributors-all-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-contributors-all-with-files');
      });
   });

   /**
    * Test `getOrgRepoContributors` with user credentials.
    */
   it('getOrgRepoContributors (user)', () =>
   {
      return githubInspect.getOrgRepoContributors({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-contributors-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-contributors-user');
      });
   });

   /**
    * Test `getOrgRepoContributors` with package.json & user credentials.
    */
   it('getOrgRepoContributors (user) w/ package.json', () =>
   {
      return githubInspect.getOrgRepoContributors({ credential: userCredential, repoFiles: ['package.json'] }).then(
       (data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repo-contributors-user-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repo-contributors-user-with-files');
      });
   });

   /**
    * Test `getOrgRepoStats` without user credentials.
    */
   it('getOrgRepoStats (all)', () =>
   {
      return githubInspect.getOrgRepoStats({ categories: ['all'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // GitHub statistics for repos are fairly variable, so the verification below checks for the appropriate data
         // categories and data types of the normalized results.

         assert(Array.isArray(data.normalized.orgs));
         assert(data.normalized.orgs.length === 2);

         const jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-stats-all.json', 'utf-8');

         const orgs = data.normalized.orgs;

         for (let cntr = 0; cntr < orgs.length; cntr++)
         {
            const org = orgs[cntr];
            assert(Array.isArray(org.repos));

            for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               const repo = org.repos[cntr2];
               assert(typeof repo === 'object');
               assert(typeof repo.repo_files === 'object');
               assert(Array.isArray(repo.stats));
               assert(repo.stats.length === 1);
               assert(typeof repo.stats[0] === 'object');

               // Verify that the repo stats keys equals all categories.
               assert(JSON.stringify(Object.keys(repo.stats[0])) === jsonText);
            }
         }
      });
   });

   /**
    * Test `getOrgRepoStats` with user credentials.
    */
   it('getOrgRepoStats (user)', () =>
   {
      return githubInspect.getOrgRepoStats({ credential: userCredential, categories: ['all'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // GitHub statistics for repos are fairly variable, so the verification below checks for the appropriate data
         // categories and data types of the normalized results.

         assert(Array.isArray(data.normalized.orgs));
         assert(data.normalized.orgs.length === 2);

         const jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-stats-user.json', 'utf-8');

         const orgs = data.normalized.orgs;

         for (let cntr = 0; cntr < orgs.length; cntr++)
         {
            const org = orgs[cntr];
            assert(Array.isArray(org.repos));

            for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               const repo = org.repos[cntr2];
               assert(typeof repo === 'object');
               assert(typeof repo.repo_files === 'object');
               assert(Array.isArray(repo.stats));
               assert(repo.stats.length === 1);
               assert(typeof repo.stats[0] === 'object');

               // Verify that the repo stats keys equals all categories.
               assert(JSON.stringify(Object.keys(repo.stats[0])) === jsonText);
            }
         }
      });
   });

   /**
    * Test `getOrgRepos` without user credentials.
    */
   it('getOrgRepos (all)', () =>
   {
      return githubInspect.getOrgRepos().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repos-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repos-all');
      });
   });

   /**
    * Test `getOrgRepos` with package.json & without user credentials.
    */
   it('getOrgRepos (all) w/ package.json', () =>
   {
      return githubInspect.getOrgRepos({ repoFiles: ['package.json'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repos-all-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repos-all-with-files');
      });
   });

   /**
    * Test `getOrgRepos` with user credentials.
    */
   it('getOrgRepos (user)', () =>
   {
      return githubInspect.getOrgRepos({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repos-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repos-user');
      });
   });

   /**
    * Test `getOrgRepos` with package.json & user credentials.
    */
   it('getOrgRepos (user) w/ package.json', () =>
   {
      return githubInspect.getOrgRepos({ credential: userCredential, repoFiles: ['package.json'] }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-repos-user-with-files');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-repos-user-with-files');
      });
   });

   /**
    * Test `getOrgTeamMembers` without user credentials.
    */
   it('getOrgTeamMembers (all)', () =>
   {
      return githubInspect.getOrgTeamMembers().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-team-members-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-team-members-all');
      });
   });

   /**
    * Test `getOrgTeamMembers` with user credentials.
    */
   it('getOrgTeamMembers (user)', () =>
   {
      return githubInspect.getOrgTeamMembers({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-team-members-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-team-members-user');
      });
   });

   /**
    * Test `getOrgTeams` without user credentials.
    */
   it('getOrgTeams (all)', () =>
   {
      return githubInspect.getOrgTeams().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-teams-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-teams-all');
      });
   });

   /**
    * Test `getOrgTeams` with user credentials.
    */
   it('getOrgTeams (user)', () =>
   {
      return githubInspect.getOrgTeams({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-org-teams-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-org-teams-user');
      });
   });

   /**
    * Test `getOrgs` without user credentials.
    */
   it('getOrgs (all)', () =>
   {
      return githubInspect.getOrgs().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-orgs-all');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-orgs-all');
      });
   });

   /**
    * Test `getOrgs` with user credentials.
    */
   it('getOrgs (user)', () =>
   {
      return githubInspect.getOrgs({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-orgs-user');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-orgs-user');
      });
   });

   /**
    * Test `getOwnerOrgs`.
    */
   it('getOwnerOrgs', () =>
   {
      return githubInspect.getOwnerOrgs().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-owner-orgs');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-owner-orgs');
      });
   });

   /**
    * Test `getOwners`.
    */
   it('getOwners', () =>
   {
      return githubInspect.getOwners().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-owners');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-owners');
      });
   });

   /**
    * Test `getOwnerRateLimits`.
    */
   it('getOwnerRateLimits', () =>
   {
      return githubInspect.getOwnerRateLimits().then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-owners-rate-limit');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-owners-rate-limit');
      });
   });

   /**
    * Test `getUserFromCredential`.
    */
   it('getUserFromCredential', () =>
   {
      return githubInspect.getUserFromCredential({ credential: userCredential }).then((data) =>
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         s_STRIP_VARIABLE_DATA(data.normalized);

         // Unless generating test data the body of s_DATA_WRITE is not executed.
         s_DATA_WRITE(data.normalized, 'github-get-user-from-credential');

         // Usually data is being tested.
         s_DATA_TEST(data.normalized, 'github-get-user-from-credential');
      });
   });

   /**
    * Test `getUserOwnsCredential`.
    */
   it('getUserOwnsCredential', () =>
   {
      return githubInspect.getUserOwnsCredential({ userName: s_USER_NAME, credential: userCredential }).then((result) =>
      {
         assert(result);
      });
   });
});

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Always true; enabling testing of data in `./test/fixture`.
 * @type {boolean}
 */
const s_TEST_DATA = true;

/**
 * Usually false; generates test data written to `./test/fixture`.
 * @type {boolean}
 */
const s_WRITE_DATA = false;

/**
 * Tests all permutations for the given filePrefix. Iterates through `s_FILE_DATA` and compares all results.
 *
 * @param {object}   data - The normalized data output from `GitHubInspectOrgsTransform`.
 * @param {string}   fileName - A file name for the test being run.
 */
const s_DATA_TEST = (data, fileName) =>
{
   if (s_TEST_DATA)
   {
      const filePath = `./test/fixture/${fileName}.json`;
      const testData = fs.readFileSync(filePath, 'utf-8');

      assert(JSON.stringify(data) === testData);
   }
};

/**
 * Iterates over `s_FILE_DATA` writing out comparison data to `./test/fixture`.
 *
 * @param {object}   data - The normalized data output from `GitHubInspectOrgsTransform`.
 * @param {string}   fileName - A file name for the test being run.
 */
const s_DATA_WRITE = (data, fileName) =>
{
   if (s_WRITE_DATA)
   {
      const filePath = `./test/fixture/${fileName}.json`;

      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
   }
};

/**
 * Strips variable data entries that may change from the normalized data returned from GitHubInspectOrgs.
 *
 * Strips data.normalized.timestamp
 *
 * Strips from data.normalized.orgs[].repos[] -> 'updated_at', 'pushed_at', 'stargazers_count', 'watchers_count'
 *
 * Strips from data.normalized.owners[].ratelimit[] -> 'limit', 'remaining', 'reset' fields.
 *
 * @param {object}   data - Normalized data to strip.
 */
const s_STRIP_VARIABLE_DATA = (data) =>
{
   delete data['timestamp'];

   // Strip any variable repo data from orgs.
   if (Array.isArray(data.orgs))
   {
      s_STRIP_VARIABLE_ORGS(data.orgs);
   }

   // Strip any owner / ratelimit data.
   if (Array.isArray(data.owners))
   {
      for (let cntr = 0; cntr < data.owners.length; cntr++)
      {
         const owner = data.owners[cntr];

         // Strip any variable repo data from orgs.
         if (Array.isArray(owner.orgs))
         {
            s_STRIP_VARIABLE_ORGS(owner.orgs);
         }

         if (Array.isArray(owner.ratelimit))
         {
            // Strip 'limit', 'remaining', 'reset' fields as they may change.
            for (let cntr2 = 0; cntr2 < owner.ratelimit.length; cntr2++)
            {
               const ratelimit = owner.ratelimit[cntr2];

               delete ratelimit.core['limit'];
               delete ratelimit.core['remaining'];
               delete ratelimit.core['reset'];

               delete ratelimit.search['limit'];
               delete ratelimit.search['remaining'];
               delete ratelimit.search['reset'];
            }
         }
      }
   }
};

/**
 * Strips variable repo data from an array of normalized organizations.
 *
 * @param {Array} orgs - Organizations to parse.
 */
const s_STRIP_VARIABLE_ORGS = (orgs) =>
{
   for (let cntr = 0; cntr < orgs.length; cntr++)
   {
      const org = orgs[cntr];

      // Strip 'updated_at', 'pushed_at', 'stargazers_count', 'watchers_count' fields as they may change.
      if (Array.isArray(org.repos))
      {
         for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
         {
            const repo = org.repos[cntr2];

            delete repo['updated_at'];
            delete repo['pushed_at'];
            delete repo['stargazers_count'];
            delete repo['watchers_count'];
         }
      }
   }
};
