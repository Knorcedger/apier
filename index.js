'use strict';

var router = require('router')();
var reqlog = require('reqlog');
var responseBuilder = require('apier-responsebuilder');
var dataParser = require('apier-dataparser');

var middlewares = [test, responseBuilder.init, dataParser];
var self = this;

exports.init = function() {
	reqlog.info('apier initialized!!');
	var app = function(req, res) {
		// console.log('inside the app!');
		router(req, res, function() {});
		router.all('*', middlewares, function(req, res) {
			reqlog.info('inside all endpoint', req.url);
			responseBuilder.error(req, res, 'NOT_FOUND');
		});
	};

	return app;
};

exports.endpoint = function(methods, url, callback) {
	// create an object to apply as this in the callback
	// its used to be able to call the send function inside the callback
	// without having to also pass the req and res
	for (var i = 0, length = methods.length; i < length; i++) {
		var method = methods[i].toLowerCase();
		reqlog.info('setup endpoint', method + ' ' + url);
		router[method](url, middlewares, function(req, res) {
			routerCallback(req, res, callback);
		});
	}
};

exports.send = function(data) {
	reqlog.info('inside api send');
	responseBuilder.send(this.req, this.res, data);
};

/**
 * Defines the endpoint callback passed into the router
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
			self.send.call(this, data);
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
