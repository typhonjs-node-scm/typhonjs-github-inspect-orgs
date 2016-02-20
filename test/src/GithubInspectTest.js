var assert =         require('chai').assert;
var fs =             require('fs-extra');

var GithubInspect =  require('../../src/GithubInspect');

// Loads a public access token from environment variable or from public.token in the root directory.
// This is the testing account public access token of typhonjs-test GitHub account. The associated organizations are:
// https://github.com/test-org-typhonjs
// https://github.com/test-org-typhonjs2

var userCredential = process.env.GITHUB_TOKEN;

// If user credential is still undefined attempt to load from a local file in the root directory `./public.token`.
if (typeof userCredential === 'undefined' && fs.existsSync('./public.token'))
{
   userCredential = fs.readFileSync('./public.token').toString();
}

// Fail now if we don't have a token.

if (typeof userCredential !== 'string')
{
   throw new TypeError('No user credentials found in `process.env.GITHUB_TOKEN` or `./public.token`.');
}

var githubInspect = new GithubInspect(
{
   organizations: [{ credential: userCredential, owner: 'typhonjs-test', regex: 'test' }],
   userCredential: userCredential
});

/**
 * Strips variable data entries that may change from the normalized data returned from GithubInspect.
 *
 * Strips data.normalized.timestamp
 *
 * Strips from data.normalized.orgs[].repos[] -> 'updated_at', 'pushed_at', 'stargazers_count', 'watchers_count'
 *
 * Strips from data.ratelimits[] -> 'limit', 'remaining', 'reset' fields.
 *
 * @param {object}   data
 */
function stripVariableData(data)
{
   delete data['timestamp'];

   // Strip any variable repo data from orgs.
   if (Array.isArray(data.orgs))
   {
      for (var cntr = 0; cntr < data.orgs.length; cntr++)
      {
         var org = data.orgs[cntr];

         // Strip 'updated_at', 'pushed_at', 'stargazers_count', 'watchers_count' fields as they may change.
         if (Array.isArray(org.repos))
         {
            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];

               delete repo['updated_at'];
               delete repo['pushed_at'];
               delete repo['stargazers_count'];
               delete repo['watchers_count'];
            }
         }
      }
   }

   if (Array.isArray(data.ratelimits))
   {
      // Strip 'limit', 'remaining', 'reset' fields as they may change.
      for (cntr = 0; cntr < data.ratelimits.length; cntr++)
      {
         var ratelimit = data.ratelimits[cntr];

         delete ratelimit.core['limit'];
         delete ratelimit.core['remaining'];
         delete ratelimit.core['reset'];

         delete ratelimit.search['limit'];
         delete ratelimit.search['remaining'];
         delete ratelimit.search['reset'];
      }
   }
}

/**
 * This series of tests confirm that GithubInspect properly queries the organizations and data associated with
 * `typhonjs-test`.
 *
 * The normalized data results are stripped of variable data and compared against stored JSON output in
 * `./test/fixture`.
 *
 * @test {onHandleCode}
 */
describe('Github Inspect', function()
{
   /**
    * Test `getCollaborators` without user credentials.
    */
   it('github-get-collaborators-all', function()
   {
      return githubInspect.getCollaborators().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-collaborators-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getCollaborators` with user credentials.
    */
   it('github-get-collaborators-user', function()
   {
      return githubInspect.getCollaborators({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-collaborators-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getContributors` without user credentials.
    */
   it('github-get-contributors-all', function()
   {
      return githubInspect.getContributors().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-contributors-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getContributors` with user credentials.
    */
   it('github-get-contributors-user', function()
   {
      return githubInspect.getContributors({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-contributors-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getMembers` without user credentials.
    */
   it('github-get-members-all', function()
   {
      return githubInspect.getMembers().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-members-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getMembers` with user credentials.
    */
   it('github-get-members-user', function()
   {
      return githubInspect.getMembers({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-members-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgMembers` without user credentials.
    */
   it('github-get-org-members-all', function()
   {
      return githubInspect.getOrgMembers().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-members-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgMembers` with user credentials.
    */
   it('github-get-org-members-user', function()
   {
      return githubInspect.getOrgMembers({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-members-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepoCollaborators` without user credentials.
    */
   it('github-get-org-repo-collaborators-all', function()
   {
      return githubInspect.getOrgRepoCollaborators().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-collaborators-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepoCollaborators` with user credentials.
    */
   it('github-get-org-repo-collaborators-user', function()
   {
      return githubInspect.getOrgRepoCollaborators({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-collaborators-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepoContributors` without user credentials.
    */
   it('github-get-org-repo-contributors-all', function()
   {
      return githubInspect.getOrgRepoContributors().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-contributors-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepoContributors` with user credentials.
    */
   it('github-get-org-repo-contributors-user', function()
   {
      return githubInspect.getOrgRepoContributors({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-contributors-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepoStats` without user credentials.
    */
   it('github-get-org-repo-stats-all', function()
   {
      return githubInspect.getOrgRepoStats({ categories: ['all'] }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // GitHub statistics for repos are fairly variable, so the verification below checks for the appropriate data
         // categories and data types of the normalized results.

         assert(Array.isArray(data.normalized.orgs));
         assert(data.normalized.orgs.length === 2);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-stats-all.json').toString();

         var orgs = data.normalized.orgs;

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];
            assert(Array.isArray(org.repos));

            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];
               assert(typeof repo === 'object');
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
   it('github-get-org-repo-stats-user', function()
   {
      return githubInspect.getOrgRepoStats({ credentials: userCredential, categories: ['all'] }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // GitHub statistics for repos are fairly variable, so the verification below checks for the appropriate data
         // categories and data types of the normalized results.

         assert(Array.isArray(data.normalized.orgs));
         assert(data.normalized.orgs.length === 2);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repo-stats-user.json').toString();

         var orgs = data.normalized.orgs;

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];
            assert(Array.isArray(org.repos));

            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];
               assert(typeof repo === 'object');
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
   it('github-get-org-repos-all', function()
   {
      return githubInspect.getOrgRepos().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repos-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgRepos` with user credentials.
    */
   it('github-get-org-repos-user', function()
   {
      return githubInspect.getOrgRepos({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-repos-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgTeamMembers` without user credentials.
    */
   it('github-get-org-team-members-all', function()
   {
      return githubInspect.getOrgTeamMembers().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-team-members-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgTeamMembers` with user credentials.
    */
   it('github-get-org-team-members-user', function()
   {
      return githubInspect.getOrgTeamMembers({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-team-members-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgTeams` without user credentials.
    */
   it('github-get-org-teams-all', function()
   {
      return githubInspect.getOrgTeams().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-teams-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgTeams` with user credentials.
    */
   it('github-get-org-teams-user', function()
   {
      return githubInspect.getOrgTeams({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-org-teams-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgs` without user credentials.
    */
   it('github-get-orgs-all', function()
   {
      return githubInspect.getOrgs().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-orgs-all.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getOrgs` with user credentials.
    */
   it('github-get-orgs-user', function()
   {
      return githubInspect.getOrgs({ credentials: userCredential }).then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-orgs-user.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });

   /**
    * Test `getRateLimit` without user credentials.
    */
   it('github-get-rate-limit-all', function()
   {
      return githubInspect.getRateLimit().then(function(data)
      {
         assert(typeof data === 'object');
         assert(typeof data.normalized === 'object');
         assert(typeof data.raw === 'object');

         // Delete any variable data.
         stripVariableData(data.normalized);

         var jsonText = fs.readFileSync('./test/fixture/github-get-rate-limit.json').toString();

         assert(JSON.stringify(data.normalized) === jsonText);
      });
   });
});