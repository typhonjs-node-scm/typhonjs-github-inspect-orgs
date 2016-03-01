![typhonjs-github-inspect-orgs](http://i.imgur.com/gb3o0ty.png)

[![NPM](https://img.shields.io/npm/v/typhonjs-github-inspect-orgs.svg?label=npm)](https://www.npmjs.com/package/typhonjs-github-inspect-orgs)
[![Code Style](https://img.shields.io/badge/code%20style-allman-yellowgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)
[![License](https://img.shields.io/badge/license-MPLv2-yellowgreen.svg?style=flat)](https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/typhonjs/TyphonJS.svg)](https://gitter.im/typhonjs/TyphonJS)

[![Build Status](https://travis-ci.org/typhonjs-node-scm/typhonjs-github-inspect-orgs.svg?branch=master)](https://travis-ci.org/typhonjs-node-scm/typhonjs-github-inspect-orgs)
[![Codecov](https://img.shields.io/codecov/c/github/typhonjs-node-scm/typhonjs-github-inspect-orgs.svg)](https://codecov.io/github/typhonjs-node-scm/typhonjs-github-inspect-orgs)
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
{string}    pathPrefix - Additional path for API end point; default ('').
{number}    timeout - TLS / HTTPS time out for responses from GitHub; default (120000) seconds.
{string}    `user-agent` - User agent string necessary for GitHub API; default ('typhonjs-github-inspect-orgs').
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

GitHubInspectOrgs Method summary:

- [getCollaborators](#getCollaborators)
- [getContributors](#getContributors)
 
-----------
<a name="getCollaborators"></a>
####getCollaborators

Returns all collaborators across all organizations.

@param {object}  options - Optional parameters.
```
(string) credential - A public access token for any GitHub user which limits the responses to the organizations
                      and other query data that this particular user is a member of or has access to currently.
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
