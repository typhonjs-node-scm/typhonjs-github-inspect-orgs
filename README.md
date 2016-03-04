![typhonjs-github-inspect-orgs](http://i.imgur.com/gb3o0ty.png)

[![NPM](https://img.shields.io/npm/v/typhonjs-github-inspect-orgs.svg?label=npm)](https://www.npmjs.com/package/typhonjs-github-inspect-orgs)
[![Code Style](https://img.shields.io/badge/code%20style-allman-yellowgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)
[![License](https://img.shields.io/badge/license-MPLv2-yellowgreen.svg?style=flat)](https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/typhonjs/TyphonJS.svg)](https://gitter.im/typhonjs/TyphonJS)

[![Build Status](https://travis-ci.org/typhonjs-node-scm/typhonjs-github-inspect-orgs.svg?branch=master)](https://travis-ci.org/typhonjs-node-scm/typhonjs-github-inspect-orgs)
[![Coverage](https://img.shields.io/codecov/c/github/typhonjs-node-scm/typhonjs-github-inspect-orgs.svg)](https://codecov.io/github/typhonjs-node-scm/typhonjs-github-inspect-orgs)
[![Dependency Status](https://www.versioneye.com/user/projects/56d1a9d1157a690037bbb70f/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56d1a9d1157a690037bbb70f)

A NPM module providing compound GitHub queries spanning multiple organizations /
users for many-repo projects such as TyphonJS. To support a many-repo / many-organization effort that may span one
or more organizations and repos on GitHub this module provides compound queries resolved via chained Promises.

Version 3.0 of the GitHub API is used for all queries. Please review the many options available at the GitHub API
documentation: https://developer.github.com/v3/

To configure GitHubInspectOrgs pass in an options hash to the constructor:
```
import GitHubInspectOrgs  from 'typhonjs-github-inspect-orgs';

const githubInspect = new GitHubInspectOrgs(
{
    organizations: [{ credential: <GITHUB PUBLIC TOKEN>, owner: <GITHUB USER NAME OWNING ORGANIZATIONS>,
                    regex: '^typhonjs' }],
});
```

Each hash entry in the organizations array must contain the following:
```
(string) credential -  A GitHub public access token that has `public_repo` and `read:org`.
(string) owner - The associated GitHub user name who owns one or more organizations.
(string) regex - A regular expression to scrape for all organizations from the owner account that match.
```

More than one object hash may be provided in the `organizations` array and the combined GitHub organizations will
provide the larger group of organizations queried by all methods provided by `GitHubInspectOrgs`.

Please note that if the credential token provided for a given set of organizations is not the owner of all
organizations queried then they may not be accessible in queries that investigate all organizations and will be
skipped. An example is `getCollaborators`.

Additional optional parameters to configure GitHubInspectOrgs include:
```
{boolean}   debug - Sets the Github API querying to debug / verbose mode; default (false)
{string}    host - The API host; default ('api.github.com') only change for enterprise API host, etc.
{string}    hostUrlPrefix - Sets the normalized GitHub host URL; default ('https://github.com/').
{string}    pathPrefix - Additional path for API end point; default ('').
{string}    rawUrlPrefix - Sets the raw GitHub host URL; default ('https://raw.githubusercontent.com/').
{integer}   timeout - TLS / HTTPS timeout for all requests in milliseconds ('120000' / 2 minutes).
{string}    `user-agent` - User agent string necessary for GitHub API; default ('typhonjs-github-inspect-orgs').
{boolean}   verbose - Logs any API request rejections usually oriented to credentials; default (false).
```

To query all TyphonJS organizations use the following configuration:
```
const githubInspect = new GitHubInspectOrgs(
{
   organizations: [{ credential: <ANY_GITHUB_PUBLIC_TOKEN>, owner: 'typhonrt', regex: '^typhonjs' }]
});
```

It should be noted that the main owner of the organization for a given team needs to have public access scope for
the team to be found. It should be noted that all private members (non-owners) are returned.

Please see [typhonjs-github-inspect-orgs-transform](https://www.npmjs.com/package/typhonjs-github-inspect-orgs-transform) for a NPM module which transforms the normalized data returned by GitHubInspectOrgs into `html`, `json`, `markdown` or `text`.

All queries return an object hash with normalized data and the raw data returned from the GitHub API. These keys are
`normalized` and `raw`.

The normalized data contains a few base fields including:
```
{string} scm - The source code management system used; default ('github').
{string} categories - A string of categories separated by `:`. Each category corresponds to a nested array in the
                      JSON object. One can split this category key to provide a way to walk through the JSON object.
{string} timestamp - The time the normalized JSON object was generated.
```

The remaining base fields include one or more array of array structures depending on the requested data. Please
review the documentation for each method provided for an example JSON response.

All methods take a hash of optional parameters. The two optional parameters that are supported include:
```
(string)          credential - A public access token with `public_repo` and `read:org` permissions for any GitHub
                               user which limits the responses to the organizations and other query data that this
                               particular user is a member of or has access to currently.

(Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
                              repos default branch (usually 'master') that are requested from
                              `https://raw.githubusercontent.com` and added to the respective repo in an hash
                              entry `repo_files` indexed by file path / name provided. This is useful for instance
                              with JS repos in requesting `package.json`, but any file can be requested. Each entry
                              in the `repo_files` hash is also a hash containing `statusCode` of the response and
                              `body` containing the contents of the file requested.
                               
(boolean)         verbose -   Overrides GitHubInspectOrgs verbose setting logging any API request rejections
                              usually oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

Please review the method documentation for examples of the normalized results expected from each compound query.
You may also review the [test/fixture](https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs/tree/master/test/fixture) directory for example responses for each method. This data is generated from the following configuration:
```
const githubInspect = new GitHubInspectOrgs(
{
   organizations: [{ credential: <ANY_GITHUB_PUBLIC_TOKEN>, owner: 'typhonjs-test', regex: '^test' }]
});
```

-----------------------

GitHubInspectOrgs method summary:

- [getCollaborators](#getCollaborators) - Returns all collaborators across all organizations.
- [getContributors](#getContributors) - Returns all contributors across all organizations.
- [getMembers](#getMembers) - Returns all organization members across all organizations.
- [getOrgMembers](#getOrgMembers) - Returns all members by organization across all organizations.
- [getOrgRepos](#getOrgRepos) - Returns all repos by organization across all organizations.
- [getOrgRepoCollaborators](#getOrgRepoCollaborators) - Returns all collaborators by repo by organization across all organizations.
- [getOrgRepoContributors](#getOrgRepoContributors) - Returns all contributors by repo by organization across all organizations.
- [getOrgRepoStats](#getOrgRepoStats) - Returns GitHub statistics by repo by organization across all organizations.
- [getOrgs](#getOrgs) - Returns all organizations.
- [getOrgTeams](#getOrgTeams) - Returns all teams by organization across all organizations.
- [getOwnerOrgs](#getOwnerOrgs) - Returns all organizations by organization owner.
- [getOwnerRateLimits](#getOwnerRateLimits) - Returns the current rate limits for all organization owners.
- [getOwners](#getOwners) - Returns all organization owners.
- [getUserFromCredential](#getUserFromCredential) - Returns the GitHub user who owns the provided credential.
- [getUserOwnsCredential](#getUserOwnsCredential) - Returns a boolean indicating the GitHub username owns the given credential.

-----------
<a name="getCollaborators"></a>
####getCollaborators

Returns all collaborators across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "collaborators",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "collaborators": [
     {
       "name": "typhonrt",
       "id": 311473,
       "url": "https:\/\/github.com\/typhonrt",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getContributors"></a>
####getContributors

Returns all contributors across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "contributors",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "contributors": [
     {
       "name": "typhonrt",
       "id": 311473,
       "url": "https:\/\/github.com\/typhonrt",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getMembers"></a>
####getMembers

Returns all organization members across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "members",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "members": [
     {
       "name": "typhonrt",
       "id": 311473,
       "url": "https:\/\/github.com\/typhonrt",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgMembers"></a>
####getOrgMembers

Returns all members by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:members",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "members": [
         {
           "name": "typhonjs-test",
           "id": 17188714,
           "url": "https:\/\/github.com\/typhonjs-test",
           "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgRepos"></a>
####getOrgRepos

Returns all repos by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string)          credential - A public access token for any GitHub user which limits the responses to the
                               organizations and other query data that this particular user is a member of or has
                               access to currently.

(Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
                              repos default branch (usually 'master') that are requested from
                              `https://raw.githubusercontent.com` and added to the respective repo in an hash
                              entry `repo_files` indexed by file path / name provided. This is useful for instance
                              with JS repos in requesting `package.json`, but any file can be requested. Each
                              entry in the `repo_files` hash is also a hash containing `statusCode` of the
                              response and `body` containing the contents of the file requested.

(boolean)         verbose -   Overrides GitHubInspectOrgs verbose setting logging any API request rejections
                              usually oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:repos",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "repos": [
         {
           "name": "test-repo1",
           "full_name": "test-org-typhonjs\/test-repo1",
           "id": 51677097,
           "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
           "description": "Just a test repo",
           "private": false,
           "repo_files": {},
           "fork": false,
           "created_at": "2016-02-14T03:01:24Z",
           "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
           "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "default_branch": "master"
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgRepoCollaborators"></a>
####getOrgRepoCollaborators

Returns all collaborators by repo by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string)          credential - A public access token for any GitHub user which limits the responses to the
                               organizations and other query data that this particular user is a member of or has
                               access to currently.

(Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
                              repos default branch (usually 'master') that are requested from
                              `https://raw.githubusercontent.com` and added to the respective repo in an hash
                              entry `repo_files` indexed by file path / name provided. This is useful for instance
                              with JS repos in requesting `package.json`, but any file can be requested. Each
                              entry in the `repo_files` hash is also a hash containing `statusCode` of the
                              response and `body` containing the contents of the file requested.

(boolean)         verbose -   Overrides GitHubInspectOrgs verbose setting logging any API request rejections
                              usually oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:repos:collaborators",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "repos": [
         {
           "name": "test-repo1",
           "full_name": "test-org-typhonjs\/test-repo1",
           "id": 51677097,
           "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
           "description": "Just a test repo",
           "private": false,
           "repo_files": {},
           "fork": false,
           "created_at": "2016-02-14T03:01:24Z",
           "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
           "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "default_branch": "master",
           "collaborators": [
             {
               "name": "typhonjs-test",
               "id": 17188714,
               "url": "https:\/\/github.com\/typhonjs-test",
               "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
             },
             // .... more data
           ]
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgRepoContributors"></a>
####getOrgRepoContributors

Returns all contributors by repo by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string)          credential - A public access token for any GitHub user which limits the responses to the
                               organizations and other query data that this particular user is a member of or has
                               access to currently.

(Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
                              repos default branch (usually 'master') that are requested from
                              `https://raw.githubusercontent.com` and added to the respective repo in an hash
                              entry `repo_files` indexed by file path / name provided. This is useful for instance
                              with JS repos in requesting `package.json`, but any file can be requested. Each
                              entry in the `repo_files` hash is also a hash containing `statusCode` of the
                              response and `body` containing the contents of the file requested.

(boolean)         verbose -   Overrides GitHubInspectOrgs verbose setting logging any API request rejections
                              usually oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:repos:contributors",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "repos": [
         {
           "name": "test-repo1",
           "full_name": "test-org-typhonjs\/test-repo1",
           "id": 51677097,
           "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
           "description": "Just a test repo",
           "private": false,
           "repo_files": {},
           "fork": false,
           "created_at": "2016-02-14T03:01:24Z",
           "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
           "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
           "default_branch": "master",
           "contributors": [
             {
               "name": "typhonjs-test",
               "id": 17188714,
               "url": "https:\/\/github.com\/typhonjs-test",
               "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
             },
             // .... more data
           ]
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgRepoStats"></a>
####getOrgRepoStats

Returns GitHub statistics by repo by organization across all organizations. Each repo will contain a `stats`
object hash with the categories defined below. Please be mindful of accessing this functionality as the GitHub API
is being queried directly and with excessive use rate limits will be reached.

@param {object}  options - Optional parameters.
```
Required:
(Array<String>)   categories - list of stats categories to query. May include:
   'all': A wildcard that includes all categories defined below.
   'codeFrequency': Get the number of additions and deletions per week.
   'commitActivity': Get the last year of commit activity data.
   'contributors': Get contributors list with additions, deletions & commit counts.
   'participation': Get the weekly commit count for the repository owner & everyone else.
   'punchCard': Get the number of commits per hour in each day.
   'stargazers': Get list GitHub users who starred repos.
   'watchers': Get list of GitHub users who are watching repos.

Optional:
(string)          credential - A public access token for any GitHub user which limits the responses to the
                               organizations and other query data that this particular user is a member of or has
                               access to currently.

(Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
                              repos default branch (usually 'master') that are requested from
                              `https://raw.githubusercontent.com` and added to the respective repo in an hash
                              entry `repo_files` indexed by file path / name provided. This is useful for instance
                              with JS repos in requesting `package.json`, but any file can be requested. Each
                              entry in the `repo_files` hash is also a hash containing `statusCode` of the
                              response and `body` containing the contents of the file requested.

(boolean)         verbose -   Overrides GitHubInspectOrgs verbose setting logging any API request rejections
                              usually oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

Version 3.0 of the GitHub API is used for all queries. Please review the repo statistics documentation for
a full description: https://developer.github.com/v3/repos/statistics/

It should be noted that the GitHub API caches statistic results and on the first query may not return results
on that query. In that case the query needs to be run again. A boolean `_resultsPending` is added to
`repo.stats[0]._resultsPending` in this case indicating that the query needs to be rerun.

The following is an abbreviated example response for the normalized data requested:
```
{
  "scm": "github",
  "categories": "orgs:repos:stats",
  "timestamp": "2016-02-27T10:31:51.979Z",
  "orgs": [
    {
      "name": "typhonjs-backbone",
      "id": 17154328,
      "url": "https://github.com/typhonjs-backbone",
      "avatar_url": "https://avatars.githubusercontent.com/u/17154328?v=3",
      "description": "",
      "repos": [
        {
          "name": "backbone-es6",
          "full_name": "typhonjs-backbone/backbone-es6",
          "id": 44065471,
          "url": "https://github.com/typhonjs-backbone/backbone-es6",
          "description": "A fork of Backbone converting it to ES6.",
          "private": false,
          "repo_files": {},
          "fork": false,
          "created_at": "2015-10-11T19:04:43Z",
          "updated_at": "2016-02-22T09:44:19Z",
          "pushed_at": "2016-02-12T17:34:02Z",
          "git_url": "git://github.com/typhonjs-backbone/backbone-es6.git",
          "ssh_url": "git@github.com:typhonjs-backbone/backbone-es6.git",
          "clone_url": "https://github.com/typhonjs-backbone/backbone-es6.git",
          "stargazers_count": 6,
          "watchers_count": 6,
          "default_branch": "master",
          "stats": [
            {
              "codeFrequency": [
                [1444521600,62981,-57],
                // .... more data
              ],
              "commitActivity": [
                {
                  "days": [0,0,0,0,0,0,0],
                  "total": 0,
                  "week": 1425171600
                },
                // .... more data
              ],
              "participation": {
                "all": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,29,15,13,16,3,1,0,0,0,9,0,1,2,7,15,3,2,0,0],
                "owner": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
              },
              "punchCard": [
                [0,0,0],
                // .... more data
              ],
              "contributors": [
                {
                  "total": 118,
                  "weeks": [
                    {
                      "w": 1444521600,
                      "a": 62957,
                      "d": 57,
                      "c": 8
                    },
                    // .... more data
                  ],
                  "author": {
                    "name": "typhonrt",
                    "id": 311473,
                    "url": "https://github.com/typhonrt",
                    "avatar_url": "https://avatars.githubusercontent.com/u/311473?v=3"
                  }
                },
                // .... more data
              ],
              "stargazers": [
                {
                  "name": "typhonrt",
                  "id": 311473,
                  "url": "https:\/\/github.com\/typhonrt",
                  "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
                },
                // .... more data
              ],
              "watchers": [
                {
                  "name": "typhonrt",
                  "id": 311473,
                  "url": "https:\/\/github.com\/typhonrt",
                  "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
                },
                // .... more data
              ]
            }
          ]
        },
        // .... more data
      ]
    },
    // .... more data
  ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgs"></a>
####getOrgs

Returns all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs"
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgTeams"></a>
####getOrgTeams

Returns all teams by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:teams",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "teams": [
         {
           "name": "cool-test-team",
           "id": 1927253,
           "privacy": "closed",
           "permission": "pull",
           "description": ""
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOrgTeamMembers"></a>
####getOrgTeamMembers

Returns all members by team by organization across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.

(boolean)   verbose - Overrides GitHubInspectOrgs verbose setting logging any API request rejections usually 
                      oriented to credentials; default (GitHubInspectOrgs->_verbose).
```

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:teams:members",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "orgs": [
     {
       "name": "test-org-typhonjs",
       "id": 17228306,
       "url": "https:\/\/github.com\/test-org-typhonjs",
       "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
       "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
       "teams": [
         {
           "name": "cool-test-team",
           "id": 1927253,
           "privacy": "closed",
           "permission": "pull",
           "description": "",
           "members": [
             {
               "name": "typhonjs-test",
               "id": 17188714,
               "url": "https:\/\/github.com\/typhonjs-test",
               "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
             },
             // .... more data
           ]
         },
         // .... more data
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOwnerOrgs"></a>
####getOwnerOrgs

Returns all organizations by organization owner.

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "orgs:teams",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "owners": [
     {
       "name": "typhonjs-test",
       "url": "https:\/\/github.com\/typhonjs-test",
       "orgs": [
         {
           "name": "test-org-typhonjs",
           "id": 17228306,
           "url": "https:\/\/github.com\/test-org-typhonjs",
           "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
           "description": "Just a test organization for testing typhonjs-github-inspect-orgs"
         },
         // more data...
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOwnerRateLimits"></a>
####getOwnerRateLimits

Returns the current rate limits for all organization owners.

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "owners:ratelimit",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "owners": [
     {
       "name": "typhonjs-test",
       "url": "https:\/\/github.com\/typhonjs-test",
       "ratelimit": [
         {
           "core": {
             "limit": 5000,
             "remaining": 4976,
             "reset": 1456571465000
           },
           "search": {
             "limit": 30,
             "remaining": 30,
             "reset": 1456571287000
           }
         }
       ]
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getOwners"></a>
####getOwners

Returns all organization owners.

The following is an abbreviated example response for the normalized data requested:
```
{
   "scm": "github",
   "categories": "owners",
   "timestamp": "2016-02-20T04:56:03.792Z",
   "owners": [
     {
       "name": "typhonjs-test",
       "url": "https:\/\/github.com\/typhonjs-test"
     },
     // .... more data
   ]
}
```

Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getUserFromCredential"></a>
####getUserFromCredential

Returns a the GitHub username who owns the provided credential.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.
```

The following is an example response for the normalized data requested:
```
{
  "scm": "github",
  "categories": "users",
  "timestamp": "2016-03-02T13:47:11.144Z",
  "users": [
    {
      "name": "typhonjs-test2",
      "id": 17558559,
      "url": "https:\/\/github.com\/typhonjs-test2",
      "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17558559?v=3"
    }
  ]
}
```
Returns `Promise` with an object hash containing `normalized` and `raw` entries.

-----------
<a name="getUserOwnsCredential"></a>
####getUserOwnsCredential

Returns a boolean indicating the GitHub username owns the given credential.

@param {object}  options - Optional parameters.
```
(string) userName - A GitHub username to match against the given credential owner.

(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.
```


Returns `Promise` with a boolean result
