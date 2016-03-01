'use strict';

import GitHubAPI        from 'github';
import request          from 'request';

import createNormalized from './createNormalized';

/**
 * GitHubInspectOrgs -- A NPM module providing compound GitHub queries spanning multiple organizations /
 * users for many-repo projects such as TyphonJS. To support a many-repo / many-organization effort that may span one
 * or more organizations and repos on GitHub this module provides compound queries resolved via chained Promises.
 *
 * Version 3.0 of the GitHub API is used for all queries. Please review the many options available at the GitHub API
 * documentation: https://developer.github.com/v3/
 *
 * To configure GitHubInspectOrgs pass in an options hash to the constructor:
 * ```
 * import GitHubInspectOrgs  from 'typhonjs-github-inspect-orgs';
 *
 * const githubInspect = new GitHubInspectOrgs(
 * {
 *     organizations: [{ credential: <GITHUB PUBLIC TOKEN>, owner: <GITHUB USER NAME OWNING ORGANIZATIONS>,
 *                     regex: '^typhonjs' }],
 * });
 * ```
 *
 * Each hash entry in the organizations array must contain the following:
 * ```
 * (string) credential -  A GitHub public access token that has `public_repo` and `read:org`.
 * (string) owner - The associated GitHub user name who owns one or more organizations.
 * (string) regex - A regular expression to scrape for all organizations from the owner account that match.
 * ```
 *
 * More than one object hash may be provided in the `organizations` array and the combined GitHub organizations will
 * provide the larger group of organizations queried by all methods provided by `GitHubInspectOrgs`.
 *
 * Please note that if the credential token provided for a given set of organizations is not the owner of all
 * organizations queried then they may not be accessible in queries that investigate all organizations and will be
 * skipped. An example is `getCollaborators`.
 *
 * Additional optional parameters to configure GitHubInspectOrgs include:
 * ```
 * {boolean}   debug - Sets the Github API querying to debug / verbose mode; default (false)
 * {string}    host - The API host; default ('api.github.com') only change for enterprise API host, etc.
 * {string}    hostUrlPrefix - Sets the normalized GitHub host URL; default (https://github.com/).
 * {string}    pathPrefix - Additional path for API end point; default ('').
 * {string}    rawUrlPrefix - Sets the raw GitHub host URL; default ('https://raw.githubusercontent.com/').
 * {number}    timeout - TLS / HTTPS time out for responses from GitHub; default (120000) seconds.
 * {string}    `user-agent` - User agent string necessary for GitHub API; default ('typhonjs-github-inspect-orgs').
 * ```
 *
 * To query all TyphonJS organizations use the following configuration:
 * ```
 * const githubInspect = new GitHubInspectOrgs(
 * {
 *    organizations: [{ credential: <ANY_GITHUB_PUBLIC_TOKEN>, owner: 'typhonrt', regex: '^typhonjs' }]
 * });
 * ```
 *
 * It should be noted that the main owner of the organization for a given team needs to have public access scope for
 * the team to be found. It should be noted that all private members (non-owners) are returned.
 *
 * Please see `typhonjs-github-inspect-orgs-transform`
 * (https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs-transform) for a NPM module which transforms
 * the normalized data returned by GitHubInspectOrgs into `html`, `json`, `markdown` or `text`.
 *
 * All queries return an object hash with normalized data and the raw data returned from the GitHub API. These keys are
 * `normalized` and `raw`.
 *
 * The normalized data contains a few base fields including:
 * ```
 * {string} scm - The source code management system used; default ('github').
 * {string} categories - A string of categories separated by `:`. Each category corresponds to a nested array in the
 *                       JSON object. One can split this category key to provide a way to walk through the JSON object.
 * {string} timestamp - The time the normalized JSON object was generated.
 * ```
 *
 * The remaining base fields include one or more array of array structures depending on the requested data. Please
 * review the documentation for each method provided for an example JSON response.
 *
 * All methods take a hash of optional parameters. The two optional parameters that are supported include:
 * ```
 * (string)          credential - A public access token with `public_repo` and `read:org` permissions for any GitHub
 *                                user which limits the responses to the organizations and other query data that this
 *                                particular user is a member of or has access to currently.
 *
 * (Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
 *                               repos default branch (usually 'master') that are requested from
 *                               `https://raw.githubusercontent.com` and added to the respective repo in an hash
 *                               entry `repo_files` indexed by file path / name provided. This is useful for instance
 *                               with JS repos in requesting `package.json`, but any file can be requested. Each entry
 *                               in the `repo_files` hash is also a hash containing `statusCode` of the response and
 *                               `body` containing the contents of the file requested.
 * ```
 *
 * Please review the method documentation for examples of the normalized results expected from each compound query.
 * You may also review the `test/fixture` directory of
 * https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs for example responses for each method.
 * This data is generated from the following configuration:
 * ```
 * const githubInspect = new GitHubInspectOrgs(
 * {
 *    organizations: [{ credential: <ANY_GITHUB_PUBLIC_TOKEN>, owner: 'typhonjs-test', regex: '^test' }]
 * });
 * ```
 */
export default class GitHubInspectOrgs
{
   /**
    * Initializes the GitHub API, creates the main lookup user credential and provides basic validation of the
    * organization / repos to process.
    *
    * @param {object}   options - Defines an object hash of required and optional parameters including the following:
    * ```
    * Required:
    * (Array<object>)   organizations - An array of object hashes containing the following:
    *    (string) credential - A GitHub public access token that has `public_repo` and `read:org`.
    *    (string) owner - The associated GitHub user name who owns one or more organizations.
    *    (string) regex - A regular expression to scrape for all organizations from the owner account that match.
    *
    * Optional:
    * (boolean)   debug - Sets GitHub API to debug mode; default (false).
    * (string)    host - Sets the GitHub API host; default (api.github.com).
    * (string)    hostUrlPrefix - Sets the normalized GitHub host URL; default ('https://github.com/').
    * (string)    pathPrefix - Additional prefix to add after host; default ('').
    * (string)    rawUrlPrefix - Sets the raw GitHub host URL; default ('https://raw.githubusercontent.com/').
    * (integer)   timeout - TLS / HTTPS timeout for all requests in milliseconds ('120000' / 2 minutes).
    * (integer)   `user-agent` - Custom user agent; default ('typhonjs-github-inspect-org').
    * ```
    */
   constructor(options = {})
   {
      if (typeof options !== 'object')
      {
         throw new TypeError(`ctor error: 'options' is not an 'object'.`);
      }

      if (!Array.isArray(options.organizations))
      {
         throw new TypeError(`ctor error: 'options.organizations' is not an 'array'.`);
      }

      /**
       * Stores the organization configurations followed by validation / initialization of data.
       *
       * Each entry is an object hash that stores an GitHub organization lookup with the following keys:
       * ```
       * (string) credential - A GitHub public access token (recommended) or `username:password`.
       * (string) owner - The GitHub user name of an organization owner.
       * (string) regex - A string converted into a RegExp which is applied against all organization names of the owner.
       * ```
       *
       * @type {Array<{}>}
       * @private
       */
      this._organizations = [];

      // Validate organizations array of object hashes containing owner / regex strings.
      for (let cntr = 0; cntr < options.organizations.length; cntr++)
      {
         const organization = options.organizations[cntr];
         const verifiedOrg = {};

         if (typeof organization !== 'object')
         {
            throw new TypeError(`ctor error: 'options.organizations' is not an 'object' at index: ${cntr}`);
         }

         if (typeof organization.credential !== 'string')
         {
            throw new TypeError(`ctor error: 'options.organizations.credential' is not a 'string' at index: ${cntr}`);
         }

         verifiedOrg.credential = s_CREATE_CREDENTIALS(organization.credential);

         if (typeof organization.owner !== 'string')
         {
            throw new TypeError(`ctor error: 'options.organizations.owner' is not a 'string' at index: ${cntr}`);
         }

         verifiedOrg.owner = organization.owner;

         if (typeof organization.regex !== 'string')
         {
            throw new TypeError(`ctor error: 'options.organizations.regex' is not a 'string' at index: ${cntr}`);
         }

         try
         {
            verifiedOrg.regex = new RegExp(organization.regex);
         }
         catch(err)
         {
            throw new Error(`ctor error: 'options.organizations.regex' is not a valid 'regex' at index: ${cntr}`);
         }

         this._organizations.push(verifiedOrg);
      }

      /**
       * An instance of the GitHub API imported from `github`.
       *
       * @type {object}
       * @private
       */
      this._githubAPI = new GitHubAPI(
      {
         version: '3.0.0',
         debug: options.debug || false,
         protocol: 'https',
         host: options.host || 'api.github.com',
         pathPrefix: options.pathPrefix || '',
         timeout: options.timeout || 120000,
         headers: { 'user-agent': options['user-agent'] || 'typhonjs-github-inspect-orgs' }
      });

      /**
       * Stores URL prefix options for normalized data or raw file downloading.
       *
       * @type {{hostUrlPrefix: (string), rawUrlPrefix: (string)}}
       * @private
       */
      this._optionsURL =
      {
         hostUrlPrefix: options.hostUrlPrefix || 'https://github.com/',
         rawUrlPrefix: options.rawUrlPrefix || 'https://raw.githubusercontent.com/'
      };

      /**
       * Stores the user agent for `raw.githubusercontent.com` requests.
       *
       * @type {{}}
       * @private
       */
      this._userAgent = { 'user-agent': options['user-agent'] || 'typhonjs-github-inspect-orgs' };
   }

   /**
    * Returns all collaborators across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "collaborators",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "collaborators": [
    *      {
    *        "name": "typhonrt",
    *        "id": 311473,
    *        "url": "https:\/\/github.com\/typhonrt",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getCollaborators(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getCollaborators error: 'options' is not an 'object'.`); }

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgRepoCollaborators(options).then((orgs) =>
         {
            const collaborators = [];
            const seenUsers = {};

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               if (org.repos)
               {
                  const repos = org.repos;
                  for (let cntr2 = 0; cntr2 < repos.length; cntr2++)
                  {
                     const repo = repos[cntr2];

                     if (repo.collaborators)
                     {
                        for (let cntr3 = 0; cntr3 < repo.collaborators.length; cntr3++)
                        {
                           const user = repo.collaborators[cntr3];

                           if (typeof seenUsers[user.login] === 'undefined')
                           {
                              collaborators.push(user);
                              seenUsers[user.login] = 1;
                           }
                        }
                     }
                  }
               }
            }

            // Sort by org name.
            collaborators.sort((a, b) => { return a.login.localeCompare(b.login); });

            return { normalized: createNormalized(['collaborators'], collaborators, this._optionsURL),
             raw: collaborators };
         });
      });
   }

   /**
    * Returns all contributors across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "contributors",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "contributors": [
    *      {
    *        "name": "typhonrt",
    *        "id": 311473,
    *        "url": "https:\/\/github.com\/typhonrt",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getContributors(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getContributors error: 'options' is not an 'object'.`); }

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgRepoContributors(options).then((orgs) =>
         {
            const contributors = [];
            const seenUsers = {};

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               if (org.repos)
               {
                  const repos = org.repos;

                  for (let cntr2 = 0; cntr2 < repos.length; cntr2++)
                  {
                     const repo = repos[cntr2];

                     if (repo.contributors)
                     {
                        for (let cntr3 = 0; cntr3 < repo.contributors.length; cntr3++)
                        {
                           const user = repo.contributors[cntr3];

                           if (typeof seenUsers[user.login] === 'undefined')
                           {
                              contributors.push(user);
                              seenUsers[user.login] = 1;
                           }
                        }
                     }
                  }
               }
            }

            // Sort by user name.
            contributors.sort((a, b) => { return a.login.localeCompare(b.login); });

            return { normalized: createNormalized(['contributors'], contributors, this._optionsURL),
             raw: contributors };
         });
      });
   }

   /**
    * Returns all organization members across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "members",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "members": [
    *      {
    *        "name": "typhonrt",
    *        "id": 311473,
    *        "url": "https:\/\/github.com\/typhonrt",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getMembers(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getMembers error: 'options' is not an 'object'.`); }

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgMembers(options).then((orgs) =>
         {
            const members = [];
            const seenUsers = {};

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               if (org.members)
               {
                  const users = org.members;

                  for (let cntr2 = 0; cntr2 < users.length; cntr2++)
                  {
                     const user = users[cntr2];

                     if (typeof seenUsers[user.login] === 'undefined')
                     {
                        members.push(user);
                        seenUsers[user.login] = 1;
                     }
                  }
               }
            }

            // Sort by user name.
            members.sort((a, b) => { return a.login.localeCompare(b.login); });

            return { normalized: createNormalized(['members'], members, this._optionsURL), raw: members };
         });
      });
   }

   /**
    * Returns all members by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:members",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "members": [
    *          {
    *            "name": "typhonjs-test",
    *            "id": 17188714,
    *            "url": "https:\/\/github.com\/typhonjs-test",
    *            "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgMembers(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getOrgMembers error: 'options' is not an 'object'.`); }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgs(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               (function(org)
               {
                  promises.push(new Promise((resolve, reject) =>
                  {
                     const github = s_AUTHENTICATE(githubAPI, org._credential);

                     github.orgs.getMembers({ org: org.login }, (err, members) =>
                     {
                        if (err)
                        {
                           reject(err);
                        }
                        else
                        {
                           // Sort by user name.
                           members.sort((a, b) => { return a.login.localeCompare(b.login); });

                           org.members = members;
                           resolve();
                        }
                     });
                  }));
               })(org);
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'members'], orgs, this._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns all repos by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string)          credential - A public access token for any GitHub user which limits the responses to the
    *                                organizations and other query data that this particular user is a member of or has
    *                                access to currently.
    *
    * (Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
    *                               repos default branch (usually 'master') that are requested from
    *                               `https://raw.githubusercontent.com` and added to the respective repo in an hash
    *                               entry `repo_files` indexed by file path / name provided. This is useful for instance
    *                               with JS repos in requesting `package.json`, but any file can be requested. Each
    *                               entry in the `repo_files` hash is also a hash containing `statusCode` of the
    *                               response and `body` containing the contents of the file requested.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:repos",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "repos": [
    *          {
    *            "name": "test-repo1",
    *            "full_name": "test-org-typhonjs\/test-repo1",
    *            "id": 51677097,
    *            "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
    *            "description": "Just a test repo",
    *            "private": false,
    *            "repo_files": {},
    *            "fork": false,
    *            "created_at": "2016-02-14T03:01:24Z",
    *            "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
    *            "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "default_branch": "master"
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgRepos(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getOrgRepos error: 'options' is not an 'object'.`); }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;
      const optionsURL = this._optionsURL;
      const userAgent = this._userAgent;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         // Defer to authenticated version if credentials exists
         if (options.credential) { return s_GET_ORG_REPOS_AUTH(this, options); }

         // Prevents nested queries from generating intermediate normalized data.
         options.normalize = false;

         return this.getOrgs(options).then((orgs) =>
         {
            const promises = [];
            const innerPromises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               (function(org)
               {
                  promises.push(new Promise((resolve, reject) =>
                  {
                     const github = s_AUTHENTICATE(githubAPI, org._credential);

                     github.repos.getFromOrg({ org: org.login }, (err, repos) =>
                     {
                        if (err)
                        {
                           reject(err);
                        }
                        else
                        {
                           // Sort by repo name.
                           repos.sort((a, b) => { return a.name.localeCompare(b.name); });

                           org.repos = repos;

                           // Processes any file download requests from options.repoFiles
                           s_CREATE_REPO_FILE_PROMISES(userAgent, innerPromises, repos, options, optionsURL);

                           resolve(repos);
                        }
                     });
                  }));
               })(org);
            }

            return Promise.all(promises).then(() =>
            {
               return Promise.all(innerPromises).then(() =>
               {
                  return normalize ? { normalized: createNormalized(['orgs', 'repos'], orgs, optionsURL),
                   raw: orgs } : orgs;
               });
            });
         });
      });
   }

   /**
    * Returns all collaborators by repo by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string)          credential - A public access token for any GitHub user which limits the responses to the
    *                                organizations and other query data that this particular user is a member of or has
    *                                access to currently.
    *
    * (Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
    *                               repos default branch (usually 'master') that are requested from
    *                               `https://raw.githubusercontent.com` and added to the respective repo in an hash
    *                               entry `repo_files` indexed by file path / name provided. This is useful for instance
    *                               with JS repos in requesting `package.json`, but any file can be requested. Each
    *                               entry in the `repo_files` hash is also a hash containing `statusCode` of the
    *                               response and `body` containing the contents of the file requested.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:repos:collaborators",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "repos": [
    *          {
    *            "name": "test-repo1",
    *            "full_name": "test-org-typhonjs\/test-repo1",
    *            "id": 51677097,
    *            "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
    *            "description": "Just a test repo",
    *            "private": false,
    *            "repo_files": {},
    *            "fork": false,
    *            "created_at": "2016-02-14T03:01:24Z",
    *            "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
    *            "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "default_branch": "master",
    *            "collaborators": [
    *              {
    *                "name": "typhonjs-test",
    *                "id": 17188714,
    *                "url": "https:\/\/github.com\/typhonjs-test",
    *                "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
    *              },
    *              // .... more data
    *            ]
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgRepoCollaborators(options = {})
   {
      if (typeof options !== 'object')
      {
         throw new TypeError(`getOrgRepoCollaborators error: 'options' is not an 'object'.`);
      }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgRepos(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
               {
                  const repo = org.repos[cntr2];

                  (function(org, repo)
                  {
                     promises.push(new Promise((resolve) =>
                     {
                        const github = s_AUTHENTICATE(githubAPI, org._credential);

                        github.repos.getCollaborators({ repo: repo.name, user: org.login }, (err, users) =>
                        {
                           if (err)
                           {
                              console.log(`Skipping repo '${repo.name}' as user must have push access to view
                               collaborators.`);
                              resolve(err);
                           }
                           else
                           {
                              // Sort by user name.
                              users.sort((a, b) => { return a.login.localeCompare(b.login); });

                              repo.collaborators = users;
                              resolve(users);
                           }
                        });
                     }));
                  })(org, repo);
               }
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'repos', 'collaborators'], orgs,
                this._optionsURL), raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns all contributors by repo by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string)          credential - A public access token for any GitHub user which limits the responses to the
    *                                organizations and other query data that this particular user is a member of or has
    *                                access to currently.
    *
    * (Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
    *                               repos default branch (usually 'master') that are requested from
    *                               `https://raw.githubusercontent.com` and added to the respective repo in an hash
    *                               entry `repo_files` indexed by file path / name provided. This is useful for instance
    *                               with JS repos in requesting `package.json`, but any file can be requested. Each
    *                               entry in the `repo_files` hash is also a hash containing `statusCode` of the
    *                               response and `body` containing the contents of the file requested.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:repos:contributors",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "repos": [
    *          {
    *            "name": "test-repo1",
    *            "full_name": "test-org-typhonjs\/test-repo1",
    *            "id": 51677097,
    *            "url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1",
    *            "description": "Just a test repo",
    *            "private": false,
    *            "repo_files": {},
    *            "fork": false,
    *            "created_at": "2016-02-14T03:01:24Z",
    *            "git_url": "git:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "ssh_url": "git@github.com:test-org-typhonjs\/test-repo1.git",
    *            "clone_url": "https:\/\/github.com\/test-org-typhonjs\/test-repo1.git",
    *            "default_branch": "master",
    *            "contributors": [
    *              {
    *                "name": "typhonjs-test",
    *                "id": 17188714,
    *                "url": "https:\/\/github.com\/typhonjs-test",
    *                "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
    *              },
    *              // .... more data
    *            ]
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgRepoContributors(options = {})
   {
      if (typeof options !== 'object')
      {
         throw new TypeError(`getOrgRepoContributors error: 'options' is not an 'object'.`);
      }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgRepos(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
               {
                  const repo = org.repos[cntr2];

                  (function(org, repo)
                  {
                     promises.push(new Promise((resolve) =>
                     {
                        const github = s_AUTHENTICATE(githubAPI, org._credential);

                        github.repos.getContributors({ repo: repo.name, user: org.login }, (err, users) =>
                        {
                           if (err)
                           {
                              resolve(err);
                           }
                           else
                           {
                              // Sort by user name.
                              users.sort((a, b) => { return a.login.localeCompare(b.login); });

                              repo.contributors = users;
                              resolve(users);
                           }
                        });
                     }));
                  })(org, repo);
               }
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'repos', 'contributors'], orgs,
                this._optionsURL), raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns GitHub statistics by repo by organization across all organizations. Each repo will contain a `stats`
    * object hash with the categories defined below. Please be mindful of accessing this functionality as the GitHub API
    * is being queried directly and with excessive use rate limits will be reached.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * Required:
    * (Array<String>)   categories - list of stats categories to query. May include:
    *    'all': A wildcard that includes all categories defined below.
    *    'codeFrequency': Get the number of additions and deletions per week.
    *    'commitActivity': Get the last year of commit activity data.
    *    'contributors': Get contributors list with additions, deletions & commit counts.
    *    'participation': Get the weekly commit count for the repository owner & everyone else.
    *    'punchCard': Get the number of commits per hour in each day.
    *    'stargazers': Get list GitHub users who starred repos.
    *    'watchers': Get list of GitHub users who are watching repos.
    *
    * Optional:
    * (string)          credential - A public access token for any GitHub user which limits the responses to the
    *                                organizations and other query data that this particular user is a member of or has
    *                                access to currently.
    *
    * (Array<string>)   repoFiles - An array of file paths / names used in repo oriented queries that is relative to the
    *                               repos default branch (usually 'master') that are requested from
    *                               `https://raw.githubusercontent.com` and added to the respective repo in an hash
    *                               entry `repo_files` indexed by file path / name provided. This is useful for instance
    *                               with JS repos in requesting `package.json`, but any file can be requested. Each
    *                               entry in the `repo_files` hash is also a hash containing `statusCode` of the
    *                               response and `body` containing the contents of the file requested.
    * ```
    *
    * Version 3.0 of the GitHub API is used for all queries. Please review the repo statistics documentation for
    * a full description: https://developer.github.com/v3/repos/statistics/
    *
    * It should be noted that the GitHub API caches statistic results and on the first query may not return results
    * on that query. In that case the query needs to be run again. A boolean `_resultsPending` is added to
    * `repo.stats[0]._resultsPending` in this case indicating that the query needs to be rerun.
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *   "scm": "github",
    *   "categories": "orgs:repos:stats",
    *   "timestamp": "2016-02-27T10:31:51.979Z",
    *   "orgs": [
    *     {
    *       "name": "typhonjs-backbone",
    *       "id": 17154328,
    *       "url": "https://github.com/typhonjs-backbone",
    *       "avatar_url": "https://avatars.githubusercontent.com/u/17154328?v=3",
    *       "description": "",
    *       "repos": [
    *         {
    *           "name": "backbone-es6",
    *           "full_name": "typhonjs-backbone/backbone-es6",
    *           "id": 44065471,
    *           "url": "https://github.com/typhonjs-backbone/backbone-es6",
    *           "description": "A fork of Backbone converting it to ES6.",
    *           "private": false,
    *           "repo_files": {},
    *           "fork": false,
    *           "created_at": "2015-10-11T19:04:43Z",
    *           "updated_at": "2016-02-22T09:44:19Z",
    *           "pushed_at": "2016-02-12T17:34:02Z",
    *           "git_url": "git://github.com/typhonjs-backbone/backbone-es6.git",
    *           "ssh_url": "git@github.com:typhonjs-backbone/backbone-es6.git",
    *           "clone_url": "https://github.com/typhonjs-backbone/backbone-es6.git",
    *           "stargazers_count": 6,
    *           "watchers_count": 6,
    *           "default_branch": "master",
    *           "stats": [
    *             {
    *               "codeFrequency": [
    *                 [1444521600,62981,-57],
    *                 // .... more data
    *               ],
    *               "commitActivity": [
    *                 {
    *                   "days": [0,0,0,0,0,0,0],
    *                   "total": 0,
    *                   "week": 1425171600
    *                 },
    *                 // .... more data
    *               ],
    *               "participation": {
    *                 "all": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,29,15,13,16,3,1,0,0,0,9,0,1,2,7,15,3,2,0,0],
    *                 "owner": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    *               },
    *               "punchCard": [
    *                 [0,0,0],
    *                 // .... more data
    *               ],
    *               "contributors": [
    *                 {
    *                   "total": 118,
    *                   "weeks": [
    *                     {
    *                       "w": 1444521600,
    *                       "a": 62957,
    *                       "d": 57,
    *                       "c": 8
    *                     },
    *                     // .... more data
    *                   ],
    *                   "author": {
    *                     "name": "typhonrt",
    *                     "id": 311473,
    *                     "url": "https://github.com/typhonrt",
    *                     "avatar_url": "https://avatars.githubusercontent.com/u/311473?v=3"
    *                   }
    *                 }
    *               ],
    *               "stargazers": [
    *                 {
    *                   "name": "typhonrt",
    *                   "id": 311473,
    *                   "url": "https:\/\/github.com\/typhonrt",
    *                   "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
    *                 }
    *               ],
    *               "watchers": [
    *                 {
    *                   "name": "typhonrt",
    *                   "id": 311473,
    *                   "url": "https:\/\/github.com\/typhonrt",
    *                   "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/311473?v=3"
    *                 }
    *               ]
    *             }
    *           ]
    *         },
    *         // .... more data
    *       ]
    *     },
    *     // .... more data
    *   ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgRepoStats(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getOrgRepoStats error: 'options' is not an 'object'.`); }

      let categories = options.categories || [];

      if (!Array.isArray(categories))
      {
         throw new TypeError(`getOrgRepoStats error: 'options.categories' is not an 'array'.`);
      }

      // Handle wildcard `all` setting all categories.
      if (categories.length === 1 && categories[0] === 'all')
      {
         categories =
          ['codeFrequency', 'commitActivity', 'contributors', 'participation', 'punchCard', 'stargazers', 'watchers'];
      }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgRepos(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               for (let cntr2 = 0; cntr2 < org.repos.length; cntr2++)
               {
                  const repo = org.repos[cntr2];

                  // All other compound data is wrapped in array, so wrap the stats object hash in an array.
                  repo.stats = [{}];

                  for (let cntr3 = 0; cntr3 < categories.length; cntr3++)
                  {
                     const category = categories[cntr3];

                     if (typeof s_STAT_CATEGORY_TO_FUNCT[category] === 'string')
                     {
                        (function(org, repo, category, functionName)
                        {
                           promises.push(new Promise((resolve, reject) =>
                           {
                              const github = s_AUTHENTICATE(githubAPI, org._credential);

                              github.repos[functionName]({ repo: repo.name, user: org.login }, (err, results) =>
                              {
                                 if (err) { reject(err); }
                                 else
                                 {
                                    // GitHub doesn't have cached results, so setting _resultsPending true indicates
                                    // that this query needs to be run again.
                                    if (typeof results === 'object' && results.meta)
                                    {
                                       repo.stats[0]._resultsPending = true;
                                    }
                                    repo.stats[0][category] = results;
                                    resolve(results);
                                 }
                              });
                           }));
                        })(org, repo, category, s_STAT_CATEGORY_TO_FUNCT[category]);
                     }
                     else { throw new Error(`getOrgRepoStats error: unknown category '${category}'.`); }
                  }
               }
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'repos', 'stats'], orgs, this._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs"
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgs(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getOrgs error: 'options' is not an 'object'.`); }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         // Defer to authenticated version if credentials exists
         if (options.credential) { return s_GET_ORGS_AUTH(this, options); }

         const promises = [];
         const results = [];

         for (let cntr = 0; cntr < this._organizations.length; cntr++)
         {
            (function(organization)
            {
               const orgCredential = organization.credential;

               promises.push(new Promise((resolve, reject) =>
               {
                  const github = s_AUTHENTICATE(githubAPI, orgCredential);

                  github.orgs.getFromUser({ user: organization.owner }, (err, orgs) =>
                  {
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        // Only add organizations that pass the `regex` test.
                        for (let cntr2 = 0; cntr2 < orgs.length; cntr2++)
                        {
                           const org = orgs[cntr2];

                           if (typeof org.login === 'string' && organization.regex.test(org.login))
                           {
                              org._credential = orgCredential;
                              results.push(org);
                           }
                        }

                        resolve();
                     }
                  });
               }));
            })(this._organizations[cntr]);
         }

         return Promise.all(promises).then(() =>
         {
            // Sort by org name.
            results.sort((a, b) => { return a.login.localeCompare(b.login); });

            return normalize ? { normalized: createNormalized(['orgs'], results, this._optionsURL), raw: results } :
             results;
         });
      });
   }

   /**
    * Returns all teams by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:teams",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "teams": [
    *          {
    *            "name": "cool-test-team",
    *            "id": 1927253,
    *            "privacy": "closed",
    *            "permission": "pull",
    *            "description": ""
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgTeams(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`getOrgTeams error: 'options' is not an 'object'.`); }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         // Defer to authenticated version if credentials exists
         if (options.credential) { return s_GET_ORG_TEAMS_AUTH(this, options); }

         // Prevents nested queries from generating intermediate normalized data.
         options.normalize = false;

         return this.getOrgs(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               (function(org)
               {
                  promises.push(new Promise((resolve) =>
                  {
                     const github = s_AUTHENTICATE(githubAPI, org._credential);

                     github.orgs.getTeams({ org: org.login }, (err, res) =>
                     {
                        if (err)
                        {
                           console.log(
                            `Skipping organization '${org.login}' as user does not have access to view teams.`);
                           resolve(err);
                        }
                        else
                        {
                           // Sort by team name.
                           res.sort((a, b) => { return a.name.localeCompare(b.name); });

                           org.teams = res;
                           resolve(res);
                        }
                     });
                  }));
               })(org);
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'teams'], orgs, this._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns all members by team by organization across all organizations.
    *
    * @param {object}  options - Optional parameters.
    * ```
    * (string) credential - A public access token for any GitHub user which limits the responses to the organizations
    *                       and other query data that this particular user is a member of or has access to currently.
    * ```
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:teams:members",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "orgs": [
    *      {
    *        "name": "test-org-typhonjs",
    *        "id": 17228306,
    *        "url": "https:\/\/github.com\/test-org-typhonjs",
    *        "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *        "description": "Just a test organization for testing typhonjs-github-inspect-orgs",
    *        "teams": [
    *          {
    *            "name": "cool-test-team",
    *            "id": 1927253,
    *            "privacy": "closed",
    *            "permission": "pull",
    *            "description": "",
    *            "members": [
    *              {
    *                "name": "typhonjs-test",
    *                "id": 17188714,
    *                "url": "https:\/\/github.com\/typhonjs-test",
    *                "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17188714?v=3"
    *              },
    *              // .... more data
    *            ]
    *          },
    *          // .... more data
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOrgTeamMembers(options = {})
   {
      if (typeof options !== 'object')
      {
         throw new TypeError(`getOrgTeamMembers error: 'options' is not an 'object'.`);
      }

      // If no explicit option to create normalized data is available default to true.
      const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

      const githubAPI = this._githubAPI;

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this, options).then(() =>
      {
         return this.getOrgTeams(options).then((orgs) =>
         {
            const promises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               const org = orgs[cntr];

               if (org.teams)
               {
                  for (let cntr2 = 0; cntr2 < org.teams.length; cntr2++)
                  {
                     const team = org.teams[cntr2];

                     (function(org, team)
                     {
                        promises.push(new Promise((innerResolve) =>
                        {
                           const github = s_AUTHENTICATE(githubAPI, org._credential);

                           github.orgs.getTeamMembers({ id: team.id }, (err, members) =>
                           {
                              if (err) { /* ... */ }
                              else
                              {
                                 team.members = members;
                              }
                              innerResolve();
                           });
                        }));
                     })(org, team);
                  }
               }
            }

            return Promise.all(promises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'teams', 'members'], orgs, this._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   }

   /**
    * Returns all organizations by organization owner.
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "orgs:teams",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "owners": [
    *      {
    *        "name": "typhonjs-test",
    *        "url": "https:\/\/github.com\/typhonjs-test",
    *        "orgs": [
    *          {
    *            "name": "test-org-typhonjs",
    *            "id": 17228306,
    *            "url": "https:\/\/github.com\/test-org-typhonjs",
    *            "avatar_url": "https:\/\/avatars.githubusercontent.com\/u\/17228306?v=3",
    *            "description": "Just a test organization for testing typhonjs-github-inspect-orgs"
    *          },
    *          // more data...
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOwnerOrgs()
   {
      const githubAPI = this._githubAPI;

      // Fail early if rate limit is reached or user authentication fails.
      return s_IS_RATE_LIMIT_REACHED(this).then(() =>
      {
         const promises = [];
         const owners = [];

         for (let cntr = 0; cntr < this._organizations.length; cntr++)
         {
            (function(organization)
            {
               const orgCredential = organization.credential;

               promises.push(new Promise((resolve, reject) =>
               {
                  const github = s_AUTHENTICATE(githubAPI, orgCredential);

                  github.orgs.getFromUser({ user: organization.owner }, (err, orgs) =>
                  {
                     if (err) { reject(err); }
                     else
                     {
                        const results = [];

                        // Only add organizations that pass the `regex` test.
                        for (let cntr2 = 0; cntr2 < orgs.length; cntr2++)
                        {
                           const org = orgs[cntr2];

                           if (typeof org.login === 'string' && organization.regex.test(org.login))
                           {
                              results.push(org);
                           }
                        }

                        // Sort by org name.
                        results.sort((a, b) => { return a.login.localeCompare(b.login); });

                        owners.push({ owner: organization.owner, orgs: results });

                        resolve();
                     }
                  });
               }));
            })(this._organizations[cntr]);
         }

         return Promise.all(promises).then(() =>
         {
            // Sort by owner name.
            owners.sort((a, b) => { return a.owner.localeCompare(b.owner); });

            return { normalized: createNormalized(['owners', 'orgs'], owners, this._optionsURL), raw: owners };
         });
      });
   }

   /**
    * Returns the current rate limits for all organization owners.
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "owners:ratelimit",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "owners": [
    *      {
    *        "name": "typhonjs-test",
    *        "url": "https:\/\/github.com\/typhonjs-test",
    *        "ratelimit": [
    *          {
    *            "core": {
    *              "limit": 5000,
    *              "remaining": 4976,
    *              "reset": 1456571465000
    *            },
    *            "search": {
    *              "limit": 30,
    *              "remaining": 30,
    *              "reset": 1456571287000
    *            }
    *          }
    *        ]
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOwnerRateLimits()
   {
      const githubAPI = this._githubAPI;

      const owners = [];
      const promises = [];

      for (let cntr = 0; cntr < this._organizations.length; cntr++)
      {
         const organization = this._organizations[cntr];

         (function(organization)
         {
            promises.push(new Promise((resolve, reject) =>
            {
               const github = s_AUTHENTICATE(githubAPI, organization.credential);

               github.misc.rateLimit({}, (err, result) =>
               {
                  if (err) { reject(err); }
                  else
                  {
                     owners.push({ owner: organization.owner, ratelimit: [result] });
                     resolve();
                  }
               });
            }));
         })(organization);
      }

      return Promise.all(promises).then(() =>
      {
         // Sort by owner name.
         owners.sort((a, b) => { return a.owner.localeCompare(b.owner); });

         return { normalized: createNormalized(['owners', 'ratelimit'], owners, this._optionsURL), raw: owners };
      });
   }

   /**
    * Returns all organization owners.
    *
    * The following is an abbreviated example response for the normalized data requested:
    * ```
    * {
    *    "scm": "github",
    *    "categories": "owners",
    *    "timestamp": "2016-02-20T04:56:03.792Z",
    *    "owners": [
    *      {
    *        "name": "typhonjs-test",
    *        "url": "https:\/\/github.com\/typhonjs-test"
    *      },
    *      // .... more data
    *    ]
    * }
    * ```
    *
    * @returns {Promise}
    */
   getOwners()
   {
      const normalized = createNormalized(['owners'], this._organizations, this._optionsURL);

      normalized.owners.sort((a, b) => { return a.name.localeCompare(b.name); });

      return Promise.resolve({ normalized, raw: normalized });
   }
}

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Defines a hash of statistic categories to function call.
 * @type {{codeFrequency: string, commitActivity: string, contributors: string, participation: string, punchCard: string, stargazers: string, watchers: string}}
 */
const s_STAT_CATEGORY_TO_FUNCT =
{
   codeFrequency: 'getStatsCodeFrequency',
   commitActivity: 'getStatsCommitActivity',
   contributors: 'getStatsContributors',
   participation: 'getStatsParticipation',
   punchCard: 'getStatsPunchCard',
   stargazers: 'getStargazers',
   watchers: 'getWatchers'
};

/**
 * Convenience method to create GitHub credentials as necessary and authenticate the gitHubAPI instance passing back
 * the instance of the API.
 *
 * @param {object}         githubAPI - An instance of the GitHub API.
 * @param {string|object}  credential - A string of containing a public access token or username:password or an
 *                                       existing GitHub object hash credential.
 *
 * @returns {object} GitHub API authenticated for the given credentials.
 */
const s_AUTHENTICATE = (githubAPI, credential) =>
{
   githubAPI.authenticate(s_CREATE_CREDENTIALS(credential));
   return githubAPI;
};

/**
 * Creates and verifies a GitHub login credential from a string that contains a public access token or a
 * username:password pattern. If an existing object hash is passed in it is validated for correctness.
 *
 * @param {string}   tokenOrPass - A string that contains a public access token or a username:password pattern.
 * @returns {*}
 */
const s_CREATE_CREDENTIALS = (tokenOrPass) =>
{
   let credential;

   // Create credentials object hash
   if (typeof tokenOrPass === 'string')
   {
      if (tokenOrPass === '') { throw new TypeError(`s_CREATE_CREDENTIALS error: 'tokenOrPass' is an empty string.`); }

      const splitIndex = tokenOrPass.indexOf(':');

      // Treat as username:password if tokenOrPass includes `:`.
      if (splitIndex >= 0)
      {
         const partials = tokenOrPass.split(':', 2);
         credential = { type: 'basic', username: partials[0], password: partials[1] };
      }
      else
      {
         credential = { type: 'oauth', token: tokenOrPass };
      }
   }
   else if (typeof tokenOrPass === 'object')  // Treat tokenOrPass as an already defined credential object hash.
   {
      credential = tokenOrPass;
   }
   else
   {
      throw new TypeError(`s_CREATE_CREDENTIALS error: 'tokenOrPass' is not an 'object' or a 'string'.`);
   }

   // Perform validation of the created credential.
   if (typeof credential !== 'object')
   {
      throw new TypeError(
       `s_CREATE_CREDENTIALS error: credentials were not created from 'tokenOrPass': ${tokenOrPass}`);
   }
   else
   {
      if (credential.type === 'basic')
      {
         if (typeof credential.username === 'undefined' || credential.password === null || credential.username === '')
         {
            throw new TypeError(`s_CREATE_CREDENTIALS error: 'credential.username' is undefined or empty.`);
         }

         if (typeof credential.password === 'undefined' || credential.password === null || credential.password === '')
         {
            throw new TypeError(`s_CREATE_CREDENTIALS error: 'credential.password' is undefined or empty.`);
         }
      }
      else if (credential.type === 'oauth')
      {
         if (typeof credential.token === 'undefined' || credential.token === null || credential.token === '')
         {
            throw new TypeError(`s_CREATE_CREDENTIALS error: 'credential.username' is undefined or empty.`);
         }
      }
      else
      {
         throw new TypeError(`s_CREATE_CREDENTIALS error: missing or unknown credential type: ${credential.type}`);
      }
   }

   return credential;
};

/**
 * If `options` includes a `repoFiles` entry that is an array of file paths these files will be requested from
 * `https://raw.githubusercontent.com/${repo.full_path}/${repo.default_branch}/${filePath}`. The requested file is
 * relative to the default branch (usually `master`) for all repos. Usually this request for JS repos will be for
 * `package.json`. Each repo will have the results stored in a hash entry `repo_files` which has entries under each
 * file path containing a hash including `statusCode` and `body`. Valid requests will have a `statusCode` of 200.
 * Usually invalid requests that don't exist will have a 404 statusCode. `body` is the text of the requested file.
 *
 * @param {object}   userAgent - A header object containing a user agent string; usually from `_userAgent`.
 * @param {Array}    promises - An array of promises to push file request Promises.
 * @param {Array}    repos - An array of repos to resolve requests against for all `repoFiles`.
 * @param {object}   options - Optional parameters which potentially contains the `repoFiles` array.
 * @param {object}   optionsURL - Optional URL parameters which potentially contains `rawUrlPrefix` string.
 */
const s_CREATE_REPO_FILE_PROMISES = (userAgent, promises, repos, options = {}, optionsURL = {}) =>
{
   if (typeof options !== 'object')
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'options' is not an 'object'.`);
   }

   if (typeof optionsURL !== 'object')
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'optionsURL' is not an 'object'.`);
   }

   // If there are no files to process exit early.
   if (typeof options.repoFiles === 'undefined') { return; }

   if (typeof userAgent !== 'object')
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'userAgent' is not an 'object'.`);
   }

   if (!Array.isArray(promises))
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'promises' is not an 'array'.`);
   }

   if (!Array.isArray(repos))
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'repos' is not an 'array'.`);
   }

   if (!Array.isArray(options.repoFiles))
   {
      throw new TypeError(`s_CREATE_REPO_FILE_PROMISES error: 'options.repoFiles' is not an 'array'.`);
   }

   if (options.repoFiles.length === 0) { return; }

   for (let cntr = 0; cntr < repos.length; cntr++)
   {
      const repo = repos[cntr];
      repo.repo_files = {};

      for (let cntr2 = 0; cntr2 < options.repoFiles.length; cntr2++)
      {
         const filePath = options.repoFiles[cntr2];

         (function(repo, filePath)
         {
            promises.push(new Promise((resolve) =>
            {
               const options =
               {
                  url: `${optionsURL.rawUrlPrefix}${repo.full_name}/${repo.default_branch}/${filePath}`,
                  headers: userAgent
               };

               request(options, (error, response, body) =>
               {
                  repo.repo_files[filePath] = { statusCode: response.statusCode, body };
                  resolve();
               });
            }));
         })(repo, filePath);
      }
   }
};

/**
 * Provides the module private version of `getOrgRepos` for a given user credentials. Please see `getOrgRepos`
 * documentation for an example of query results.
 *
 * @param {GitHubInspectOrgs} githubInspect - An instance of GitHubInspectOrgs.
 * @param {object}            options - Optional parameters.
 * @returns {Promise}
 */
const s_GET_ORG_REPOS_AUTH = (githubInspect, options = {}) =>
{
   if (typeof options !== 'object')
   {
      throw new TypeError(`s_GET_ORG_REPOS_AUTH error: 'options' is not an 'object'.`);
   }

   if (typeof options.credential !== 'string')
   {
      throw new TypeError(`s_GET_ORG_REPOS_AUTH error: 'options.credential' is required or is not a 'string'.`);
   }

   // If no explicit option to create normalized data is available default to true.
   const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   // Fail early if rate limit is reached or user authentication fails.
   return s_IS_RATE_LIMIT_REACHED(githubInspect, options).then(() =>
   {
      return s_GET_ORG_TEAMS_AUTH(githubInspect, options).then((orgs) =>
      {
         const promises = [];

         for (let cntr = 0; cntr < orgs.length; cntr++)
         {
            const duplicateReject = {};
            const org = orgs[cntr];

            org.repos = [];

            for (let cntr2 = 0; cntr2 < org.teams.length; cntr2++)
            {
               const team = org.teams[cntr2];

               (function(org, team)
               {
                  promises.push(new Promise((resolve, reject) =>
                  {
                     const github = s_AUTHENTICATE(githubInspect._githubAPI, org._credential);

                     github.orgs.getTeamRepos({ org: org.login, id: team.id }, (err, repos) =>
                     {
                        if (err)
                        {
                           reject(err);
                        }
                        else
                        {
                           for (let cntr3 = 0; cntr3 < repos.length; cntr3++)
                           {
                              const repo = repos[cntr3];

                              if (typeof duplicateReject[repo.name] === 'undefined')
                              {
                                 org.repos.push(repo);
                                 duplicateReject[repo.name] = 1;
                              }
                           }
                           resolve();
                        }
                     });
                  }));
               })(org, team);
            }
         }

         return Promise.all(promises).then(() =>
         {
            const innerPromises = [];

            for (let cntr = 0; cntr < orgs.length; cntr++)
            {
               // Sort by repo name.
               orgs[cntr].repos.sort((a, b) => { return a.name.localeCompare(b.name); });

               // Processes any file download requests from options.repoFiles
               s_CREATE_REPO_FILE_PROMISES(githubInspect._userAgent, innerPromises, orgs[cntr].repos, options,
                githubInspect._optionsURL);
            }

            return Promise.all(innerPromises).then(() =>
            {
               return normalize ? { normalized: createNormalized(['orgs', 'repos'], orgs, githubInspect._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   });
};

/**
 * Provides the module private version of `getOrgTeams` for a given user credentials. Please see `getOrgTeams`
 * documentation for an example of query results.
 *
 * @param {GitHubInspectOrgs} githubInspect - An instance of GitHubInspectOrgs.
 * @param {object}            options - Optional parameters.
 * @returns {Promise}
 */
const s_GET_ORG_TEAMS_AUTH = (githubInspect, options = {}) =>
{
   if (typeof options !== 'object')
   {
      throw new TypeError(`s_GET_ORG_TEAMS_AUTH error: 'options' is not an 'object'.`);
   }

   // If no explicit option to create normalized data is available default to true.
   const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   // Fail early if rate limit is reached or user authentication fails.
   return s_IS_RATE_LIMIT_REACHED(githubInspect, options).then(() =>
   {
      return s_GET_ORGS_AUTH(githubInspect, options).then((orgs) =>
      {
         const promises = [];
         const innerPromises = [];

         for (let cntr = 0; cntr < orgs.length; cntr++)
         {
            const org = orgs[cntr];
            org.teams = [];

            (function(org)
            {
               promises.push(new Promise((resolve, reject) =>
               {
                  const github = s_AUTHENTICATE(githubInspect._githubAPI, org._credential);

                  github.orgs.getTeams({ org: org.login }, (err, teams) =>
                  {
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        for (let cntr2 = 0; cntr2 < teams.length; cntr2++)
                        {
                           const team = teams[cntr2];

                           (function(org, team)
                           {
                              innerPromises.push(new Promise((innerResolve) =>
                              {
                                 const github = s_AUTHENTICATE(githubInspect._githubAPI, org._credential);

                                 github.orgs.getTeamMember(
                                 {
                                    org: org.login,
                                    user: org.auth_user.login,
                                    id: team.id
                                 },
                                 (err) =>
                                 {
                                    if (err) { /* ... */ }
                                    else { org.teams.push(team); }
                                    innerResolve();
                                 });
                              }));
                           })(org, team);
                        }

                        resolve();
                     }
                  });
               }));
            })(org);
         }

         return Promise.all(promises).then(() =>
         {
            return Promise.all(innerPromises).then(() =>
            {
               // Sort by team name.
               for (let cntr = 0; cntr < orgs.length; cntr++)
               {
                  orgs[cntr].teams.sort((a, b) => { return a.name.localeCompare(b.name); });
               }

               return normalize ? { normalized: createNormalized(['orgs', 'teams'], orgs, githubInspect._optionsURL),
                raw: orgs } : orgs;
            });
         });
      });
   });
};

/**
 * Provides the module private version of `getOrgs` for a given user credentials. Please see `getOrgs`
 * documentation for an example of query results.
 *
 * @param {GitHubInspectOrgs} githubInspect - An instance of GitHubInspectOrgs.
 * @param {object}            options - Optional parameters.
 * @returns {Promise}
 */
const s_GET_ORGS_AUTH = (githubInspect, options = {}) =>
{
   if (typeof options !== 'object') { throw new TypeError(`s_GET_ORGS_AUTH error: 'options' is not an 'object'.`); }

   if (typeof options.credential !== 'string')
   {
      throw new TypeError(`s_GET_ORGS_AUTH error: 'options.credential' is required or is not a 'string'.`);
   }

   // If no explicit option to create normalized data is available default to true.
   const normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Fail early if rate limit is reached or user authentication fails.
   return s_IS_RATE_LIMIT_REACHED(githubInspect, options).then(() =>
   {
      return new Promise((resolve, reject) =>
      {
         s_GET_USER(githubInspect, options.credential).then((user) =>
         {
            if (user === null)
            {
               reject('s_GET_ORGS_AUTH error: user authentication failed.');
            }
            else
            {
               // To avoid a loop we must not pass options and simply pass in a directives to not normalize data and
               // to skip the rate limit check.
               githubInspect.getOrgs({ normalize: false, skipRateLimitCheck: true }).then((orgs) =>
               {
                  const promises = [];
                  const results = [];

                  for (let cntr = 0; cntr < orgs.length; cntr++)
                  {
                     const org = orgs[cntr];

                     (function(org)
                     {
                        const github = s_AUTHENTICATE(githubInspect._githubAPI, org._credential);

                        promises.push(new Promise((innerResolve) =>
                        {
                           github.orgs.getMember({ org: org.login, user: user.login }, (err) =>
                           {
                              if (err) { /* .. */ }
                              else
                              {
                                 org.auth_user = user;
                                 results.push(org);
                              }
                              innerResolve();   // Required for Promise.all[] to resolve below.
                           });
                        }));
                     })(org);
                  }

                  Promise.all(promises).then(() =>
                  {
                     // Sort by org name.
                     results.sort((a, b) => { return a.login.localeCompare(b.login); });

                     resolve(normalize ? { normalized: createNormalized(['orgs'], results, githubInspect._optionsURL),
                      raw: results } : results);
                  });
               });
            }
         });
      });
   });
};

/**
 * Returns a given GitHub user from the provided credential.
 *
 * @param {GitHubInspectOrgs}  githubInspect - An instance of GitHubInspectOrgs
 * @param {string}             credential - A public access token for any GitHub user which limits the responses to the
 *                                          organizations and other query data that this particular user is a member of
 *                                          or has access to currently.
 *
 * @returns {Promise} -- Always resolves; if authentication fails null is returned otherwise user JSON.
 */
const s_GET_USER = (githubInspect, credential) =>
{
   if (typeof credential === 'object') { credential = credential.credential; }

   if (typeof credential !== 'string') { throw new TypeError(`s_GET_USER error: 'credential' is not a 'string'.`); }

   return new Promise((resolve) =>
   {
      const github = s_AUTHENTICATE(githubInspect._githubAPI, credential);

      github.user.get({}, (err, res) =>
      {
         if (err) { resolve(null); }
         else { resolve(res); }
      });
   });
};

/**
 * Returns false if the rate limit for GitHub API access is not reached. If exceeded then the promise is rejected.
 *
 * @param {GitHubInspectOrgs} githubInspect - An instance of GitHubInspectOrgs.
 * @param {object}            options - Optional parameters.
 *
 * @returns {Promise}
 */
const s_IS_RATE_LIMIT_REACHED = (githubInspect, options = {}) =>
{
   if (typeof options !== 'object')
   {
      throw new TypeError(`s_IS_RATE_LIMIT_REACHED error: 'options' is not an 'object'.`);
   }

   // Early out if `skipRateLimitCheck` is set.
   if (typeof options.skipRateLimitCheck === 'boolean' && options.skipRateLimitCheck)
   {
      return Promise.resolve(false);
   }

   return new Promise((resolve, reject) =>
   {
      const promises = [];

      for (let cntr = 0; cntr < githubInspect._organizations.length; cntr++)
      {
         const organization = githubInspect._organizations[cntr];

         (function(organization)
         {
            promises.push(new Promise((innerResolve) =>
            {
               const github = s_AUTHENTICATE(githubInspect._githubAPI, organization.credential);

               github.misc.rateLimit({}, (err, res) =>
               {
                  if (err) { reject(`s_IS_RATE_LIMIT_REACHED: unknown error - ${err}`); }
                  else
                  {
                     if (typeof res === 'object' && res.resources && res.resources.core &&
                      res.resources.core.remaining)
                     {
                        const remaining = res.resources.core.remaining;
                        if (remaining <= 0)
                        {
                           reject(`GitHub API rate limit reached for organization owner: '${organization.owner}
                               '; please try again at: '${new Date(res.resources.core.reset * 1000)}.`);
                        }
                     }

                     innerResolve();
                  }
               });
            }));
         })(organization);
      }

      return Promise.all(promises).then(() =>
      {
         options.skipRateLimitCheck = true;
         resolve(false);
      });
   });
};