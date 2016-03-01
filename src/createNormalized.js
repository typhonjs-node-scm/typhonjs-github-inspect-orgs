/**
 * Normalizes raw GitHub query results.
 *
 * @param {Array<string>}  categories - Categories to normalize.
 * @param {Array<*>}       raw - Data to parse.
 * @returns {{}}
 */
export default function createNormalized(categories, raw)
{
   if (!Array.isArray(categories)) { throw new TypeError(`createNormalized error: 'categories' is not an 'array'.`); }
   if (typeof raw !== 'object') { throw new TypeError(`createNormalized error: 'raw' is not an 'object'.`); }

   return s_DEPTH_NORMALIZE(categories, raw, 0,
   {
      scm: 'github',
      categories: categories.join(':'),
      timestamp: new Date()
   });
}

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Provides a recursive function to normalize results.
 *
 * @param {Array<string>}  categories - Categories to normalize.
 * @param {Array<*>}       data - Data to parse.
 * @param {number}         depth - Current depth level.
 * @param {{}}             root - Initial object.
 * @returns {{}}
 */
const s_DEPTH_NORMALIZE = (categories, data, depth, root) =>
{
   const category = categories[depth];
   const nextCategory = categories.length > depth ? categories[depth + 1] : undefined;

   const sortFunction = s_GET_NORMALIZE_FUNCTION(category);

   const normalized = root ? root : {};

   normalized[category] = [];

   for (let cntr = 0; cntr < data.length; cntr++)
   {
      const results = sortFunction(data[cntr]);

      if (nextCategory && Array.isArray(data[cntr][nextCategory]))
      {
         const nextResults = s_DEPTH_NORMALIZE(categories, data[cntr][nextCategory], depth + 1);
         results[nextCategory] = nextResults ? nextResults[nextCategory] : [];
      }

      normalized[category].push(results);
   }

   return normalized;
};

const s_GET_NORMALIZE_FUNCTION = (category) =>
{
   let sortFunction;

   switch(category)
   {
      case 'collaborators':
      case 'contributors':
      case 'members':
         sortFunction = s_NORMALIZE_USER;
         break;

      case 'orgs':
         sortFunction = s_NORMALIZE_ORG;
         break;

      case 'owners':
         sortFunction = s_NORMALIZE_OWNER;
         break;

      case 'ratelimit':
         sortFunction = s_NORMALIZE_RATE_LIMIT;
         break;

      case 'repos':
         sortFunction = s_NORMALIZE_REPO;
         break;

      case 'stats':
         sortFunction = s_NORMALIZE_STATS;
         break;

      case 'teams':
         sortFunction = s_NORMALIZE_TEAM;
         break;

      default:
         throw new Error(`Unknown category: ${category}`);
   }

   return sortFunction;
};

/**
 * Returns a normalized version of a GitHub organization.
 *
 * @param {object}   org - Organization to parse.
 * @returns {{name: string, id: number, url: string, avatar_url: string, description: string}}
 */
const s_NORMALIZE_ORG = (org) =>
{
   const orgName = org.login ? org.login : '';

   return {
      name: orgName,
      id: org.id ? org.id : -1,
      url: `https://github.com/${orgName}`,
      avatar_url: org.avatar_url ? org.avatar_url : '',
      description: org.description ? org.description : ''
   };
};

/**
 * Returns a normalized version of a owner from the organizations configuration data.
 *
 * @param {object}   owner - Organization owner to parse.
 * @returns {{name: string}}
 */
const s_NORMALIZE_OWNER = (owner) =>
{
   const ownerName = owner.owner ? owner.owner : '';

   return { name: ownerName, url: `https://github.com/${ownerName}` };
};

/**
 * Returns a normalized version of a GitHub rate limit API response. The reset time is converted to milliseconds to
 * be compatible with JS Date usage.
 *
 * @param {object}   ratelimit - GitHub rate limit to parse.
 * @returns {{core: {limit: number, remaining: number, reset: number}, search: {limit: number, remaining: number, reset: number}}}
 */
const s_NORMALIZE_RATE_LIMIT = (ratelimit) =>
{
   return {
      core:
      {
         limit: ratelimit.resources.core.limit,
         remaining: ratelimit.resources.core.remaining,
         reset: ratelimit.resources.core.reset * 1000
      },

      search:
      {
         limit: ratelimit.resources.search.limit,
         remaining: ratelimit.resources.search.remaining,
         reset: ratelimit.resources.search.reset * 1000
      }
   };
};

/**
 * Returns a normalized version of a GitHub repo.
 *
 * @param {object}   repo - Repo to parse.
 * @returns {
 * {
 *    name: string,
 *    full_name: string,
 *    id: number,
 *    url: string,
 *    description: string,
 *    private: boolean,
 *    fork: boolean,
 *    created_at: string,
 *    updated_at: string,
 *    pushed_at: string,
 *    git_url: string,
 *    ssh_url: string,
 *    clone_url: string,
 *    stargazers_count: number,
 *    watchers_count: number,
 *    default_branch: string
 * }}
 */
const s_NORMALIZE_REPO = (repo) =>
{
   return {
      'name': repo.name ? repo.name : '',
      'full_name': repo.full_name ? repo.full_name : '',
      'id': repo.id ? repo.id : -1,
      'url': repo.html_url ? repo.html_url : '',
      'description': repo.description ? repo.description : '',
      'private': repo.private ? repo.private : false,
      'repo_files': repo.repo_files ? repo.repo_files : {},
      'fork': repo.fork ? repo.fork : false,
      'created_at': repo.created_at ? repo.created_at : '',
      'updated_at': repo.updated_at ? repo.updated_at : '',
      'pushed_at': repo.pushed_at ? repo.pushed_at : '',
      'git_url': repo.git_url ? repo.git_url : '',
      'ssh_url': repo.ssh_url ? repo.ssh_url : '',
      'clone_url': repo.clone_url ? repo.clone_url : '',
      'stargazers_count': repo.stargazers_count ? repo.stargazers_count : 0,
      'watchers_count': repo.watchers_count ? repo.watchers_count : 0,
      'default_branch': repo.default_branch ? repo.default_branch : ''
   };
};

/**
 * Returns a normalized version of a GitHub repo stats.
 *
 * Normalizes contributor, stargazer, and watchers users.
 *
 * @param {object}   stats - Repository stats to parse.
 * @returns {{}}
 */
const s_NORMALIZE_STATS = (stats) =>
{
   const normStats = {};

   if (stats.codeFrequency) { normStats.codeFrequency = stats.codeFrequency; }
   if (stats.commitActivity) { normStats.commitActivity = stats.commitActivity; }
   if (stats.participation) { normStats.participation = stats.participation; }
   if (stats.punchCard) { normStats.punchCard = stats.punchCard; }

   if (stats.contributors)
   {
      // Stats are being generated; must resubmit query.
      if (typeof stats.contributors === 'object') { normStats.contributors = stats.contributors; }

      // Must normalize authors
      if (Array.isArray(stats.contributors))
      {
         normStats.contributors = [];

         for (let cntr = 0; cntr < stats.contributors.length; cntr++)
         {
            const contributor = stats.contributors[cntr];
            if (contributor.author) { contributor.author = s_NORMALIZE_USER(contributor.author); }

            normStats.contributors.push(contributor);
         }
      }
   }

   if (stats.stargazers)
   {
      normStats.stargazers = [];

      for (let cntr = 0; cntr < stats.stargazers.length; cntr++)
      {
         normStats.stargazers.push(s_NORMALIZE_USER(stats.stargazers[cntr]));
      }
   }

   if (stats.watchers)
   {
      normStats.watchers = [];

      for (let cntr = 0; cntr < stats.watchers.length; cntr++)
      {
         normStats.watchers.push(s_NORMALIZE_USER(stats.watchers[cntr]));
      }
   }

   return normStats;
};

/**
 * Returns a normalized version of a GitHub team.
 *
 * @param {object}   team - Organization team to parse.
 * @returns {{name: string, id: number, privacy: string, permission: string, description: string}}
 */
const s_NORMALIZE_TEAM = (team) =>
{
   return {
      name: team.name ? team.name : '',
      id: team.id ? team.id : -1,
      privacy: team.privacy ? team.privacy : '',
      permission: team.permission ? team.permission : '',
      description: team.description ? team.description : ''
   };
};

/**
 * Returns a normalized version of a GitHub user.
 *
 * @param {object}   user - User to parse.
 * @returns {{name: string, id: number, url: string, avatar_url: string}}
 */
const s_NORMALIZE_USER = (user) =>
{
   return {
      name: user.login ? user.login : '',
      id: user.id ? user.id : -1,
      url: user.html_url ? user.html_url : '',
      avatar_url: user.avatar_url ? user.avatar_url : ''
   };
};