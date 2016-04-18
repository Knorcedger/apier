'use strict';

var router = require('router')();
var reqlog = require('reqlog');
var responseBuilder = require('apier-responsebuilder');
var dataParser = require('apier-dataparser');
var accessVerifier = require('apier-accessverifier');
var bodyParser = require('body-parser');
var permissioner = require('apier-permissioner');
var db = require('apier-database');
var schemaExtender = require('mongoose-schema-extender');

var jsonParser = bodyParser.json();

module.exports = apier;

/**
 * Create an apier app
 * @method apier
 * @param {object} config The app configuration
 * It must contain the following options
 * mongoUrl: String. The mongo url to connect to
 * handleErrors: Boolean. Define if the schemaExtender will handle the db errors
 * @return {Function} The app to use as server
 */
function apier(config) {
	// on server start..
	db.connect(config.mongoUrl);
	accessVerifier.init(config.access);
	schemaExtender.handleErrors = true;
	reqlog.info('apier initialized!!');

	var app = function(req, res) {
		// this is the final handler if no match found
		router(req, res, function(error) {
			if (error) {
				reqlog.error(error);
				responseBuilder.error(req, res, 'INTERNAL_SERVER_ERROR');
			} else {
				reqlog.info('NOT_FOUND:', req.method + ' ' + req.url);
				responseBuilder.error(req, res, 'NOT_FOUND');
			}
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
 * @param  {object}   options  It contains the following options
 * methods: Array. Can contain 'post', 'get', 'delete', 'put'
 * url: String. The matching url e.g. /users, /users/:id/update
 * middlewares: Array. The middlewares (functions) that will be called before the callback
 * permissions: Array (optional). Docs: https://github.com/Knorcedger/apier-permissioner
 * if no permissions given, 'null' (public service) is assumed
 * callback: Function. The callback function to execute
 */
function endpoint(options) {
	// find the middlewares
	options.permissions = options.permissions || ['null'];
	options.middlewares = options.middlewares || [];
	options.middlewares.unshift([permissioner(options.permissions)]);

	for (var i = 0, length = options.methods.length; i < length; i++) {
		var method = options.methods[i].toLowerCase();
		reqlog.log('setup endpoint', method + ' ' + options.url);

		router[method](options.url, options.middlewares,
		function(req, res) {
			routerCallback(req, res, options.callback);
		});
	}
}

/**
 * Set the statusCode. Must be done before sending the data
 * or 'OK' will be sent
 * @method setStatusCode
 * @param  {string} statusCode The statusCode to return
 */
function setStatusCode(statusCode) {
	reqlog.info('inside apier setStatusCode');
	this.req.response.meta.statusCode = statusCode;
}

/**
 * Just sends the response using this
 * @method send
 * @param  {any} data The data to return
 */
function send(data) {
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
		},
		setStatusCode: function(statusCode) {
			setStatusCode.call(this, statusCode);
		}
	};
	reqlog.info('inside routerCallback for endpoint: ', req.url);
	callback.call(innerSelf, req, res);
}
