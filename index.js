'use strict';

var router = require('router')();
var reqlog = require('reqlog');
var responseBuilder = require('apier-responsebuilder');
var dataParser = require('apier-dataparser');
var accessVerifier = require('apier-accessverifier');
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();

module.exports = apier;

/**
 * Create an apier app
 * @method apier
 * @param {object} config The app configuration
 * @return {Function} The app to use as server
 */
function apier(config) {
	// on server start..
	accessVerifier.init(config);
	reqlog.info('apier initialized!!');

	var app = function(req, res) {
		// this is the final handler if no match found
		router(req, res, function() {
			reqlog.info('NOT_FOUND:', req.method + ' ' + req.url);
			responseBuilder.error(req, res, 'NOT_FOUND');
		});
	};

	app.endpoint = endpoint;

	return app;
}

// first, just log the request
router.use(function(req, res, next) {
	// add an empty line to easily see new requests in terminal
	reqlog.info('\n');
	reqlog.info('REQUEST:', req.method + ' ' + req.url);
	next();
});
router.use(test);
router.use(jsonParser);
router.use(dataParser);
router.use(responseBuilder.init);
router.use(accessVerifier.verify);
// when its an options request, just respond with 200
router.options('*', function(req, res) {
	reqlog.info('inside options');
	res.statusCode = 200;
	res.end();
});

/**
 * Create an endpoint
 * @method endpoint
 * @param  {array}   methods  The endpoint methods e.g. ['get'. 'post']
 * @param  {string}   url      The endpoint path e.g. '/users'
 * @param  {Function} callback The user defined callback
 */
function endpoint(methods, url, callback) {
	for (var i = 0, length = methods.length; i < length; i++) {
		var method = methods[i].toLowerCase();
		reqlog.log('setup endpoint', method + ' ' + url);
		router[method](url, function(req, res) {
			routerCallback(req, res, callback);
		});
	}
}

/**
 * Just sends the response using this
 * @method send
 * @param  {any} data The data to return
 */
function send(data) {
	reqlog.info('inside api send');
	responseBuilder.send(this.req, this.res, data);
}

/**
 * Defines the endpoint callback passed into the router
 *
 * create an object to apply as this in the callback
 * its used to be able to call the send function inside the callback
 * without having to also pass the req and res
 * @method routerCallback
 * @param  {object}       req      A request object
 * @param  {object}       res      A response object
 * @param  {Function}     callback The user defined endpoint callback
 */
function routerCallback(req, res, callback) {
	var innerSelf = {
		req: req,
		res: res,
		send: function(data) {
			send.call(this, data);
		}
	};
	reqlog.info('inside routerCallback for endpoint: ', req.url);
	callback.call(innerSelf, req, res);
}

/**
 * Dummy middleware
 * @method test
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 */
function test(req, res, next) {
	reqlog.log('inside test');

	next();
}
