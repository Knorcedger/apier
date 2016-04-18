# apier [![Build Status](https://travis-ci.org/Knorcedger/apier.png?branch=master)](https://travis-ci.org/Knorcedger/APIer)

Creating APIs can&#39;t be easier.

apier (all lowercase) is a framework that allows the super easy creation of APIs.  
It is opinionated based on my experiences with APIs the last 3 years and the structure is inspired by the Foursquare API.

## Demo
I created a demo app in the [apier-demo](https://github.com/Knorcedger/apier-demo) repo. Follow the instructions there to setup it up on your own, or just browse the code.

## Features

- Easy Setup
- Uses standard Node.js style urls  
- Uses Mongoose Schemas
- Easily support multiple HTTP methods
- endpoint access based on user roles and public services
- Supports middlewares
- Build-in validation system

### Setup
The setup and initial configuration is super easy.

```js
var http = require('http');
var apier = require('apier');

// create and configure an apier app
var app = apier({
	mongoUrl: 'mongodb://yourdatabaseurl',
	access: {
		'verifyOrigin': true,
		'apikeys': [{
			'origin': 'http://localhost:3000',
			'key': '1234'
		}]
	},
	handleErrors: true
});

// require the endpoint files
require('./v1/authentications/login.js')(app);

// start the server
http.createServer(app).listen(2000, function() {
	console.log('Server started on port 3000');
});
```

### URLs
The [Express.js router](https://www.npmjs.com/package/router) is used
internally, and so apier supports all the url formats you are used to

### Mongoose schemas
apier uses Mongoose to interact with the database. In the future, those will be
 inside the apier, but right now, you have to create your Mongoose Schemas
 based on the [example found here](https://github.com/Knorcedger/apier-demo/blob/master/schemas/userSchema.js), which is not that different from the usual mongoose schemas you know, you just have to copy paste the methods found below tha actual schema, and replace 'user' with your schema name.

 Also, note the permissions static, that identifies which user roles can see
 each schema attribute. [Permissions explained here](https://github.com/Knorcedger/apier-permissioner)

### API Endpoints
The following is an example of how we create an API endpoint (a service).

```js
app.endpoint({
	methods: ['get', 'post'],
	url: '/users/:id/update',
	permissions: ['member'],
	middlewares: [validate],
	callback: function(req, res) {
		main(req, res, this);
	}
});
```

In that example we setup the update service of a user with the specified id (1234)  
e.g. service url: 'http://localhost:2000/users/1234/update'

We accept both GET and POST requests.

Only logged in users that are identified with user role 'member' (admin can see anything)
can access that service. Don't confuse this with the [schema attributes](#mongoose-schema), it's the same logic though.

We will use the validate middleware (explained below) or any other middleware.

And finally assign a callback. We pass 'this' as well to use it to send back data.

### Validations
The validations system is better [explained here](https://github.com/Knorcedger/apier-validationsrunner). So, go check it out, but you can decide not to use it, since it's just a middleware, add your own :)

## Roadmap
* Make the schemas easier to create by doing most of the heavy lifting inside apier.

## Tests

```sh
npm install
npm test
```

## License

MIT
