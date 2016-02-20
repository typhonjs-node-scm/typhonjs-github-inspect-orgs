/**
 * typhonjs-github-inspect-orgs -- A NPM module providing compound GitHub queries spanning multiple organizations /
 * users for many-repo projects such as TyphonJS. To support a many-repo / many-organization project that may span one
 * or more organizations and repos on GitHub this module provides compound queries resolved via chained Promises.
 *
 * To configure GithubInspect pass in an options hash to the constructor:
 * ```
 * var GithubInspect  = require('typhonjs-github-inspect-orgs');
 *
 * var githubInspect = new GithubInspect(
 * {
 *     organizations: [{ credential: <GITHUB PUBLIC TOKEN>, owner: <GITHUB USER NAME FOR TOKEN>, regex: '^typhonjs' }],
 * });
 * ```
 *
 * `organizations` - Is an array of object hashes containing a public access token (credential), the associated owner
 * name of the credential (owner) and a regular expression (regex) to scrape for all organizations from the owner
 * account that match. More than one object hash may be provided in the `organizations` array and the combined found
 * GitHub organizations will provide the group of organizations queried.
 *
 * Additional optional parameters to configure GithubInspect include:
 * {boolean}   debug - Sets the Github API querying to debug / verbose mode; default (false)
 * {string}    host - The API host; default ('api.github.com') only change for enterprise API host, etc.
 * {string}    pathPrefix - Additional path for API end point; default ('').
 * {number}    timeout - TLS / HTTPS time out for responses from GitHub; default (120000) seconds.
 * {string}    `user-agent` - User agent string necessary for GitHub API; default ('typhonjs-github-inspect-orgs').
 *
 * It should be noted that the main owner of the organization for a given team needs to have public access scope for
 * the team to be found. It should be noted that all private members (non-owners) are returned.
 *
 *
 *
 *
 * Please see `typhonjs-github-inspect-orgs-transform`
 * (https://github.com/typhonjs-node-scm/typhonjs-github-inspect-orgs-transform) for a NPM module which transforms
 * the normalized data returned by GithubInspect into `html`, `json`, `markdown` or `text`.
 *
 * All queries return an object hash with normalized data and the raw data returned from the GitHub API. These keys are
 * `normalized` and `raw`.
 *
 * The normalized data contains a few base fields including:
 * {string} scm - The source code management system used; default ('github').
 * {string} categories - A string of categories separated by `:`. Each category corresponds to a nested array in the
 *                       JSON object. One can split this category key to provide a way to walk through the JSON object.
 * {string} timestamp - The time the normalized JSON object was generated.
 *
 * The remaining base fields include one or more array of array stuctures depending on the requested data.
 *
 * All user data (collaborator, contributor, member) provides the following fields (Example from `getCollaborators`):
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
 *      }
 *    ]
 * }
 * ```
 */

var GitHubAPI =         require('github');
var Promise =           require('bluebird');

var createNormalized =  require('./createNormalized');

// Defines a hash of statistic categories to function call.
var s_STAT_CATEGORY_TO_FUNCT = {
   codeFrequency: 'getStatsCodeFrequency',
   commitActivity: 'getStatsCommitActivity',
   contributors: 'getStatsContributors',
   participation: 'getStatsParticipation',
   punchCard: 'getStatsPunchCard',
   stargazers: 'getStargazers',
   watchers: 'getWatchers'
};

/**
 * Initializes the GitHub API, creates the main lookup user credential and provides basic validation of the
 * organization / repos to process.
 *
 * @param {object}   options - Defines an object hash of required and optional parameters including the following:
 * ```
 * (Array<object>)   organizations - An array of object hashes containing `owner` and `regex` strings.
 *
 * (boolean)   debug - (optional) Sets GitHub API to debug mode; default (false).
 * (string)    host - (optional) Sets the GitHub API host; default (api.github.com).
 * (string)    pathPrefix - (optional) Additional prefix to add after host; default ('').
 * (integer)   timeout - (optional) TLS / HTTPS timeout for all requests in milliseconds ('120000' / 2 minutes).
 * (integer)   `user-agent` - (optional) Custom user agent; default ('typhonjs-github-inspect-org').
 * ```
 */
function GithubInspect(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('initialize error: options is not an `object`.'); }

   if (!Array.isArray(options.organizations))
   {
      throw new TypeError('initialize error: options.organizations is not an `array`.');
   }

   this.organizations = options.organizations;

   // Validate organizations array of object hashes containing owner / regex strings.
   for (var cntr = 0; cntr < this.organizations.length; cntr++)
   {
      var organization = this.organizations[cntr];

      if (typeof organization !== 'object')
      {
         throw new TypeError('initialize error: options.organizations is not an `object` at index: ' + cntr);
      }

      if (organization.credential)
      {
         organization.credential = this.createCredentials(organization.credential);
      }

      if (typeof organization.owner !== 'string')
      {
         throw new TypeError('initialize error: options.organizations.owner is not an `string` at index: ' + cntr);
      }

      if (typeof organization.regex !== 'string')
      {
         throw new TypeError('initialize error: options.organizations.prefix is not an `regex` at index: ' + cntr);
      }

      organization.regex = new RegExp(organization.regex);
   }

   this.githubAPI = new GitHubAPI(
   {
      version: '3.0.0',
      debug: options.debug || false,
      protocol: 'https',
      host: options.host || 'api.github.com',
      pathPrefix: options.pathPrefix || '',
      timeout: options.timeout || 120000,
      headers: { 'user-agent': options['user-agent'] || 'typhonjs-github-inspect-orgs' }
   });
}

/**
 * Convenience method to create GitHub credentials as necessary and authenticate the gitHubAPI instance passing back
 * the instance of the API.
 *
 * @param {string|object}  credentials - A string of containing a public access token or username:password or an
 *                                       existing GitHub object hash credential.
 *
 * @returns {object} GitHub API authenticated for the given credentials.
 */
GithubInspect.prototype.authenticate = function authenticate(credentials)
{
   this.githubAPI.authenticate(this.createCredentials(credentials));
   return this.githubAPI;
};

/**
 * Creates and verifies a GitHub login credential from a string that contains a public access token or a
 * username:password pattern. If an existing object hash is passed in it is validated for correctness.
 *
 * @param {string}   tokenOrPass - A string that contains a public access token or a username:password pattern.
 * @returns {*}
 */
GithubInspect.prototype.createCredentials = function createCredentials(tokenOrPass)
{
   var credential;

   // Create credentials object hash
   if (typeof tokenOrPass === 'string')
   {
      if (tokenOrPass === '') { throw new TypeError('createCredentials error: tokenOrPass is an empty string.'); }

      var splitIndex = tokenOrPass.indexOf(':');

      // Treat as username:password if tokenOrPass includes `:`.
      if (splitIndex >= 0)
      {
         var partials = tokenOrPass.split(':', 2);
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
      throw new TypeError('createCredential error: tokenOrPass is not an `object` or a `string`.');
   }

   // Perform validation of the created credential.
   if (typeof credential !== 'object')
   {
      throw new TypeError('createCredentials error: credentials were not created from `tokenOrPass`: ' + tokenOrPass);
   }
   else
   {
      if (credential.type === 'basic')
      {
         if (typeof credential.username === 'undefined' || credential.password === null || credential.username === '')
         {
            throw new TypeError('createCredentials error: credentials.username is undefined or empty.');
         }

         if (typeof credential.password === 'undefined' || credential.password === null || credential.password === '')
         {
            throw new TypeError('createCredentials error: credentials.password is undefined or empty.');
         }
      }
      else if (credential.type === 'oauth')
      {
         if (typeof credential.token === 'undefined' || credential.token === null || credential.token === '')
         {
            throw new TypeError('createCredentials error: credentials.username is undefined or empty.');
         }
      }
      else
      {
         throw new TypeError('createCredentials error: missing or unknown credential type: ' + credential.type);
      }
   }

   return credential;
};

/**
 * Returns all TyphonJS collaborators.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getCollaborators = function getCollaborators(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getCollaborators error: options is not an `object`.'); }

   var self = this;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgRepoCollaborators(options).then(function(orgs)
      {
         var collaborators = [];
         var seenUsers = {};

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            if (org.repos)
            {
               var repos = org.repos;
               for (var cntr2 = 0; cntr2 < repos.length; cntr2++)
               {
                  var repo = repos[cntr2];

                  if (repo.collaborators)
                  {
                     for (var cntr3 = 0; cntr3 < repo.collaborators.length; cntr3++)
                     {
                        var user = repo.collaborators[cntr3];

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
         collaborators.sort(function(a, b) { return a.login.localeCompare(b.login); });

         return { normalized: createNormalized(['collaborators'], collaborators), raw: collaborators };
      });
   });
};

/**
 * Returns all TyphonJS contributors.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getContributors = function getContributors(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getContributors error: options is not an `object`.'); }

   var self = this;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgRepoContributors(options).then(function(orgs)
      {
         var contributors = [];
         var seenUsers = {};

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            if (org.repos)
            {
               var repos = org.repos;
               for (var cntr2 = 0; cntr2 < repos.length; cntr2++)
               {
                  var repo = repos[cntr2];

                  if (repo.contributors)
                  {
                     for (var cntr3 = 0; cntr3 < repo.contributors.length; cntr3++)
                     {
                        var user = repo.contributors[cntr3];

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
         contributors.sort(function(a, b) { return a.login.localeCompare(b.login); });

         return { normalized: createNormalized(['contributors'], contributors), raw: contributors };
      });
   });
};

/**
 * Returns all members.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getMembers = function getMembers(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getMembers error: options is not an `object`.'); }

   var self = this;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgMembers(options).then(function(orgs)
      {
         var members = [];
         var seenUsers = {};

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            if (org.members)
            {
               var users = org.members;
               for (var cntr2 = 0; cntr2 < users.length; cntr2++)
               {
                  var user = users[cntr2];

                  if (typeof seenUsers[user.login] === 'undefined')
                  {
                     members.push(user);
                     seenUsers[user.login] = 1;
                  }
               }
            }
         }

         // Sort by user name.
         members.sort(function(a, b) { return a.login.localeCompare(b.login); });

         return { normalized: createNormalized(['members'], members), raw: members };
      });
   });
};

/**
 * Returns all TyphonJS organizations.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOrgs = function getOrgs(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgs error: options is not an `object`.'); }

   var self = this;

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      // Defer to authenticated version if credentials exists
      if (options.credentials) { return self.getOrgsAuth(options); }

      var promises = [];
      var results = [];

      for (var cntr = 0; cntr < self.organizations.length; cntr++)
      {
         (function(organization)
         {
            var orgCredential = organization.credential;

            promises.push(new Promise(function(resolve, reject)
            {
               var github = self.authenticate(orgCredential);

               github.orgs.getFromUser({ user: organization.owner }, function(err, orgs)
               {
                  if (err)
                  {
                     reject(err);
                  }
                  else
                  {
                     // Only add organizations that pass the `regex` test.
                     for (var cntr2 = 0; cntr2 < orgs.length; cntr2++)
                     {
                        var org = orgs[cntr2];

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
         })(self.organizations[cntr]);
      }

      return Promise.all(promises).then(function()
      {
         // Sort by org name.
         results.sort(function(a, b) { return a.login.localeCompare(b.login); });

         return normalize ? { normalized: createNormalized(['orgs'], results), raw: results } : results;
      });
   });
};

/**
 * Returns all TyphonJS organizations that an authenticated user is a part of presently.
 *
 * @param {object}   options - Optional parameters:
 *                   {
 *                      user: string [name:password] or [oAuth token] -- Authenticates user and only returns orgs that
 *                      the user belongs to presently.
 *                   }
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOrgsAuth = function getOrgsAuth(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgsAuth error: options is not an `object`.'); }

   if (typeof options.credentials !== 'string')
   {
      throw new TypeError('getOrgsAuth error: options.credentials is required or is not a `string`.');
   }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return new Promise(function(resolve, reject)
      {
         self.getUser(options.credentials).then(function(user)
         {
            if (user === null)
            {
               reject('getOrgsAuth error: user authentication failed.');
            }
            else
            {
               // To avoid a loop we must not pass options and simply pass in a directives to not normalize data and
               // to skip the rate limit check.
               self.getOrgs({ normalize: false, skipRateLimitCheck: true }).then(function(orgs)
               {
                  var promises = [];
                  var results = [];

                  for (var cntr = 0; cntr < orgs.length; cntr++)
                  {
                     var org = orgs[cntr];

                     (function(org)
                     {
                        var github = self.authenticate(org._credential);
                        promises.push(new Promise(function(innerResolve)
                        {
                           github.orgs.getMember({ org: org.login, user: user.login }, function(err)
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

                  Promise.all(promises).then(function()
                  {
                     // Sort by org name.
                     results.sort(function(a, b) { return a.login.localeCompare(b.login); });

                     resolve(normalize ? { normalized: createNormalized(['orgs'], results), raw: results } : results);
                  });
               });
            }
         });
      });
   });
};

/**
 *
 * @param options
 * @returns {*}
 */
GithubInspect.prototype.getOrgMembers = function getOrgMembers(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgMembers error: options is not an `object`.'); }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgs(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            (function(org)
            {
               promises.push(new Promise(function(resolve, reject)
               {
                  var github = self.authenticate(org._credential);

                  github.orgs.getMembers({ org: org.login }, function(err, members)
                  {
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        // Sort by user name.
                        members.sort(function(a, b) { return a.login.localeCompare(b.login); });

                        org.members = members;
                        resolve();
                     }
                  });
               }));
            })(org);
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'members'], orgs), raw: orgs } : orgs;
         });
      });
   });
};

GithubInspect.prototype.getOrgRepos = function getOrgRepos(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgRepos error: options is not an `object`.'); }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      // Defer to authenticated version if credentials exists
      if (options.credentials) { return self.getOrgReposAuth(options); }

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      return self.getOrgs(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            (function(org)
            {
               promises.push(new Promise(function(resolve, reject)
               {
                  var github = self.authenticate(org._credential);
                  github.repos.getFromOrg({ org: org.login }, function(err, repos)
                  {
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        // Sort by org name.
                        repos.sort(function(a, b) { return a.name.localeCompare(b.name); });

                        org.repos = repos;
                        resolve(repos);
                     }
                  });
               }));
            })(org);
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'repos'], orgs), raw: orgs } : orgs;
         });
      });
   });
};

GithubInspect.prototype.getOrgReposAuth = function getOrgReposAuth(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgReposAuth error: options is not an `object`.'); }

   if (typeof options.credentials !== 'string')
   {
      throw new TypeError('getOrgReposAuth error: options.credentials is required or is not a `string`.');
   }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgTeamsAuth(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var duplicateReject = {};
            var org = orgs[cntr];

            org.repos = [];

            for (var cntr2 = 0; cntr2 < org.teams.length; cntr2++)
            {
               var team = org.teams[cntr2];

               (function(org, team)
               {
                  promises.push(new Promise(function(resolve, reject)
                  {
                     var github = self.authenticate(org._credential);

                     github.orgs.getTeamRepos({ org: org.login, id: team.id }, function(err, repos)
                     {
                        if (err)
                        {
                           reject(err);
                        }
                        else
                        {
                           for (var cntr3 = 0; cntr3 < repos.length; cntr3++)
                           {
                              var repo = repos[cntr3];

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

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'repos'], orgs), raw: orgs } : orgs;
         });
      });
   });
};

/**
 * Returns all TyphonJS organizations / repos / collaborators.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOrgRepoCollaborators = function getOrgRepoCollaborators(options)
{
   options = options || {};

   if (typeof options !== 'object')
   {
      throw new TypeError('getOrgRepoCollaborators error: options is not an `object`.');
   }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgRepos(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];

               (function(org, repo)
               {
                  promises.push(new Promise(function(resolve)
                  {
                     var github = self.authenticate(org._credential);

                     github.repos.getCollaborators({ repo: repo.name, user: org.login }, function(err, users)
                     {
                        if (err)
                        {
                           console.log('Skipping repo ' + repo.name
                            + ' as user must have push access to view collaborators.');
                           resolve(err);
                        }
                        else
                        {
                           // Sort by user name.
                           users.sort(function(a, b) { return a.login.localeCompare(b.login); });

                           repo.collaborators = users;
                           resolve(users);
                        }
                     });
                  }));
               })(org, repo);
            }
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'repos', 'collaborators'], orgs), raw: orgs } :
             orgs;
         });
      });
   });
};

/**
 * Returns all TyphonJS organizations / repos / contributors.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOrgRepoContributors = function getOrgRepoContributors(options)
{
   options = options || {};

   if (typeof options !== 'object')
   {
      throw new TypeError('getOrgRepoContributors error: options is not an `object`.');
   }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgRepos(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];

               (function(org, repo)
               {
                  promises.push(new Promise(function(resolve)
                  {
                     var github = self.authenticate(org._credential);

                     github.repos.getContributors({ repo: repo.name, user: org.login }, function(err, users)
                     {
                        if (err)
                        {
                           resolve(err);
                        }
                        else
                        {
                           // Sort by user name.
                           users.sort(function(a, b) { return a.login.localeCompare(b.login); });

                           repo.contributors = users;
                           resolve(users);
                        }
                     });
                  }));
               })(org, repo);
            }
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'repos', 'contributors'], orgs), raw: orgs } :
             orgs;
         });
      });
   });
};

/**
 * Returns TyphonJS organizations / repos / stats. Each repo will contain a `stats` object hash with the categories
 * defined below. Please be mindful of accessing this functionality as the GitHub API is being queried directly and
 * with excessive use rate limits will be reached. In the future there will be a cached web service.
 *
 * @param {object}   options - Optional parameters:
 * ```
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
 * (string) credentials - A GitHub public access token or username:password combination which limits the stats
 * collection to just the repos accessible by the given user.
 * ```
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOrgRepoStats = function getOrgRepoStats(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgRepoStats error: options is not an `object`.'); }

   var categories = options.categories || [];

   if (!Array.isArray(categories))
   {
      throw new TypeError('getOrgRepoStats error: options.categories is not an `array`.');
   }

   // Handle wildcard `all` setting all categories.
   if (categories.length === 1 && categories[0] === 'all')
   {
      categories =
       ['codeFrequency', 'commitActivity', 'contributors', 'participation', 'punchCard', 'stargazers', 'watchers'];
   }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgRepos(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            for (var cntr2 = 0; cntr2 < org.repos.length; cntr2++)
            {
               var repo = org.repos[cntr2];

               // All other compound data is wrapped in array, so wrap the stats object hash in an array.
               repo.stats = [{}];

               for (var cntr3 = 0; cntr3 < categories.length; cntr3++)
               {
                  var category = categories[cntr3];

                  if (typeof s_STAT_CATEGORY_TO_FUNCT[category] === 'string')
                  {
                     (function(org, repo, category, functionName)
                     {
                        promises.push(new Promise(function(resolve, reject)
                        {
                           var github = self.authenticate(org._credential);

                           github.repos[functionName]({ repo: repo.name, user: org.login }, function(err, results)
                           {
                              if (err) { reject(err); }
                              else
                              {
                                 // GitHub doesn't have cached results, so setting _resultsPending true indicates that
                                 // this query needs to be run again.
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
               }
            }
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'repos', 'stats'], orgs), raw: orgs } : orgs;
         });
      });
   });
};

GithubInspect.prototype.getOrgTeams = function getOrgTeams(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgTeams error: options is not an `object`.'); }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      // Defer to authenticated version if credentials exists
      if (options.credentials) { return self.getOrgTeamsAuth(options); }

      // Prevents nested queries from generating intermediate normalized data.
      options.normalize = false;

      return self.getOrgs(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            (function(org)
            {
               promises.push(new Promise(function(resolve)
               {
                  var github = self.authenticate(org._credential);
                  github.orgs.getTeams({ org: org.login }, function(err, res)
                  {
                     if (err)
                     {
                        console.log('Skipping organization ' + org.login
                         + ' as user does not have access to view teams.');
                        resolve(err);
                     }
                     else
                     {
                        // Sort by team name.
                        res.sort(function(a, b) { return a.name.localeCompare(b.name); });

                        org.teams = res;
                        resolve(res);
                     }
                  });
               }));
            })(org);
         }

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'teams'], orgs), raw: orgs } : orgs;
         });
      });
   });
};

GithubInspect.prototype.getOrgTeamsAuth = function getOrgTeamsAuth(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgTeamsAuth error: options is not an `object`.'); }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgsAuth(options).then(function(orgs)
      {
         var promises = [];
         var innerPromises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];
            org.teams = [];

            (function(org)
            {
               promises.push(new Promise(function(resolve, reject)
               {
                  var github = self.authenticate(org._credential);
                  github.orgs.getTeams({ org: org.login }, function(err, teams)
                  {
                     if (err)
                     {
                        reject(err);
                     }
                     else
                     {
                        for (var cntr2 = 0; cntr2 < teams.length; cntr2++)
                        {
                           var team = teams[cntr2];

                           (function(org, team)
                           {
                              innerPromises.push(new Promise(function(innerResolve)
                              {
                                 github = self.authenticate(org._credential);
                                 github.orgs.getTeamMember(
                                  {
                                     org: org.login,
                                     user: org.auth_user.login,
                                     id: team.id
                                  },
                                  function(err)
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

         return Promise.all(promises).then(function()
         {
            return Promise.all(innerPromises).then(function()
            {
               // Sort by team name.
               for (var cntr = 0; cntr < orgs.length; cntr++)
               {
                  orgs[cntr].teams.sort(function(a, b) { return a.name.localeCompare(b.name); });
               }

               return normalize ? { normalized: createNormalized(['orgs', 'teams'], orgs), raw: orgs } : orgs;
            });
         });
      });
   });
};

GithubInspect.prototype.getOrgTeamMembers = function getOrgTeamMembers(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getOrgTeamMembers error: options is not an `object`.'); }

   // If no explicit option to create normalized data is available default to true.
   var normalize = typeof options.normalize === 'boolean' ? options.normalize : true;

   // Prevents nested queries from generating intermediate normalized data.
   options.normalize = false;

   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached(options).then(function()
   {
      return self.getOrgTeams(options).then(function(orgs)
      {
         var promises = [];

         for (var cntr = 0; cntr < orgs.length; cntr++)
         {
            var org = orgs[cntr];

            if (org.teams)
            {
               for (var cntr2 = 0; cntr2 < org.teams.length; cntr2++)
               {
                  var team = org.teams[cntr2];

                  (function(org, team)
                  {
                     promises.push(new Promise(function(innerResolve)
                     {
                        var github = self.authenticate(org._credential);
                        github.orgs.getTeamMembers({ id: team.id }, function(err, members)
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

         return Promise.all(promises).then(function()
         {
            return normalize ? { normalized: createNormalized(['orgs', 'teams', 'members'], orgs), raw: orgs } :
             orgs;
         });
      });
   });
};

/**
 * Returns all organizations by owner.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.getOwnerOrgs = function getOwnerOrgs()
{
   var self = this;

   // Fail early if rate limit is reached or user authentication fails.
   return this.isRateLimitReached().then(function()
   {
      var promises = [];
      var owners = [];

      for (var cntr = 0; cntr < self.organizations.length; cntr++)
      {
         (function(organization)
         {
            var orgCredential = organization.credential;

            promises.push(new Promise(function(resolve, reject)
            {
               var github = self.authenticate(orgCredential);

               github.orgs.getFromUser({ user: organization.owner }, function(err, orgs)
               {
                  if (err)
                  {
                     reject(err);
                  }
                  else
                  {
                     var results = [];

                     // Only add organizations that pass the `regex` test.
                     for (var cntr2 = 0; cntr2 < orgs.length; cntr2++)
                     {
                        var org = orgs[cntr2];
                        if (typeof org.login === 'string' && organization.regex.test(org.login)) { results.push(org); }
                     }

                     // Sort by org name.
                     results.sort(function(a, b) { return a.login.localeCompare(b.login); });

                     owners.push({ owner: organization.owner, orgs: results });

                     resolve();
                  }
               });
            }));
         })(self.organizations[cntr]);
      }

      return Promise.all(promises).then(function()
      {
         // Sort by owner name.
         owners.sort(function(a, b) { return a.owner.localeCompare(b.owner); });

         return { normalized: createNormalized(['owners', 'orgs'], owners), raw: owners };
      });
   });
};

/**
 * Returns a given GitHub user from the provided credentials.
 *
 * @returns {Promise} -- Always resolves; if authentication fails null is returned otherwise user JSON.
 */
GithubInspect.prototype.getOwnerRateLimits = function getOwnerRateLimits(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('getRateLimit error: options is not an `object`.'); }

   var self = this;

   var owners = [];
   var promises = [];

   for (var cntr = 0; cntr < self.organizations.length; cntr++)
   {
      var organization = self.organizations[cntr];

      (function(organization)
      {
         promises.push(new Promise(function(resolve, reject)
         {
            var github = self.authenticate(organization.credential);
            github.misc.rateLimit({}, function(err, result)
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

   return Promise.all(promises).then(function()
   {
      // Sort by owner name.
      owners.sort(function(a, b) { return a.owner.localeCompare(b.owner); });

      return { normalized: createNormalized(['owners', 'ratelimit'], owners), raw: owners };
   });
};

/**
 * Returns all organization owners
 *
 * @returns {Promise} --
 */
GithubInspect.prototype.getOwners = function getOwners()
{
   var normalized = createNormalized(['owners'], this.organizations);

   normalized.owners.sort(function(a, b) { return a.name.localeCompare(b.name); });

   return Promise.resolve({ normalized: normalized, raw: normalized });
};

/**
 * Returns a given GitHub user from the provided credentials.
 *
 * @param {string}   credentials -
 *
 * @returns {Promise} -- Always resolves; if authentication fails null is returned otherwise user JSON.
 */
GithubInspect.prototype.getUser = function getUser(credentials)
{
   if (typeof credentials === 'object') { credentials = credentials.credentials; }

   if (typeof credentials !== 'string') { throw new TypeError('getUser error: credentials is not a `string`.'); }

   var self = this;

   return new Promise(function(resolve)
   {
      var github = self.authenticate(credentials);
      github.user.get({}, function(err, res)
      {
         if (err) { resolve(null); }
         else { resolve(res); }
      });
   });
};

/**
 * Returns false if the rate limit for GitHub API access is not reached. If exceeded then the promise is rejected.
 *
 * @returns {Promise}
 */
GithubInspect.prototype.isRateLimitReached = function isRateLimitReached(options)
{
   options = options || {};

   if (typeof options !== 'object') { throw new TypeError('isRateLimitReached error: options is not an `object`.'); }

   // Early out if `skipRateLimitCheck` is set.
   if (typeof options.skipRateLimitCheck === 'boolean' && options.skipRateLimitCheck) { return Promise.resolve(false); }

   var self = this;

   return new Promise(function(resolve, reject)
   {
      var promises = [];

      for (var cntr = 0; cntr < self.organizations.length; cntr++)
      {
         var organization = self.organizations[cntr];

         (function(organization)
         {
            promises.push(new Promise(function(innerResolve)
            {
               var github = self.authenticate(organization.credential);
               github.misc.rateLimit({}, function(err, res)
               {
                  if (err) { reject('isRateLimitReached: unknown error - ' + err); }
                  else
                  {
                     if (typeof res === 'object' && res.resources && res.resources.core && res.resources.core.remaining)
                     {
                        var remaining = res.resources.core.remaining;
                        if (remaining <= 0)
                        {
                           reject('GitHub API rate limit reached for organization owner: `' + organization.owner
                            + '`; please try again at: ' + new Date(res.resources.core.reset * 1000));
                        }
                     }

                     innerResolve();
                  }
               });
            }));
         })(organization);
      }

      return Promise.all(promises).then(function()
      {
         options.skipRateLimitCheck = true;
         resolve(false);
      });
   });
};

module.exports = GithubInspect;