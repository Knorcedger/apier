var router = require('router')();
var reqlog = require('reqlog');
var responseBuilder = require('apier-responsebuilder');

exports.init = function() {
	reqlog.info('apier initialized!!');
	var app = function(req, res) {
		// console.log('inside the app!');
		router(req, res, function() {});
	};

	return app;
};

exports.endpoint = function(url, callback) {
	reqlog.info('setup endpoint', url);
	// create an object to apply as this in the callback
	// its used to be able to call the send function inside the callback
	// without having to also pass the req and res
	var self = this;
	router.get(url, [test, responseBuilder.init], function(req, res) {
		var innerSelf = {
			req: req,
			res: res,
			send: function(data) {
				self.send.call(this, data);
			}
		};
		reqlog.info('inside endpoint', req.url);
		callback.call(innerSelf, req, res);
	});
};

exports.send = function(data) {
	reqlog.info('inside api send');
	responseBuilder.send(this.req, this.res, data);
};

function test(req, res, next) {
	reqlog.log('inside test');

	next();
}
