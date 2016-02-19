/**
 * 000Init -- Bootstraps the testing process. Any previous coverage (./coverage) data is are deleted.
 */
var fs = require('fs-extra');

if (fs.existsSync('./coverage'))
{
   fs.removeSync('./coverage');
}