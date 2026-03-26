const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a directory inside the project 
  // so Render can locate it during both build and runtime.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
