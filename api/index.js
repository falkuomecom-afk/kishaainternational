'use strict';
/**
 * Vercel Serverless Function entry point for Kishaa International.
 * Wraps and delegates all incoming requests to the Express application.
 */
const app = require('../src/server');

module.exports = (req, res) => {
  return app(req, res);
};
