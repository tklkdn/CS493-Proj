/* ----------------------------------------------------
Takamoto Kodani
Final Project
Validation functions
-----------------------------------------------------*/

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const constants = require('./constants');

module.exports = {
	// General error handling
	handleError: function(res, err){
		if (res.headersSent) return;
		switch (err) {
			case 400:
				res.status(400).json(constants.ERR.B400);
				break;
            case 401:
                res.status(401).json(constants.ERR.B401);
                break;
			case 403:
				res.status(403).json(constants.ERR.B403);
				break;
			case 404:
				res.status(404).json(constants.ERR.B404);
				break;
			case 405:
				res.status(405).json(constants.ERR.B405);
				break;
			case 406:
				res.status(406).json(constants.ERR.B406);
				break;
			case 415:
				res.status(415).json(constants.ERR.B415);
				break;
			default:
				console.log(err);
		}
	},
	
	// From lecture
	checkJwt: jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${constants.OAUTH.DOMAIN}/.well-known/jwks.json`
        }),
        // Validate the audience and the issuer.
        issuer: `https://${constants.OAUTH.DOMAIN}/`,
        algorithms: ['RS256'],
        credentialsRequired: true
    }),
    
    // Error handling for jwt function
    authenticateJwt: function(err, req, res, next){
        if (err.name === "UnauthorizedError" || req.user === undefined) {
			module.exports.handleError(res, 401);
		} else {
			next();
		}
    },
    
    authorizeJwt: function(playlist, user){
        if (playlist.owner !== user.id) {
            return Promise.reject(403);
        } else {
            return Promise.resolve(playlist);
        }
    },
	
    // Middleware for validating JSON syntax
    // https://edstem.org/us/courses/5176/discussion/410097
    validateJson: function(err, req, res, next){
        if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
            module.exports.handleError(res, 400);
        }
        next();
    },
    
	// Middleware for validating requested MIME type
	reqIsValid: function(req, res, next){
		if (!req.accepts("application/json")) {
			module.exports.handleError(res, 406);
		}
		next();
	},

	// Validates playlist req data (post/put)
	playlistIsValid: function(req){
		if (req.body.name === undefined ||
            req.body.description === undefined)
        {
			return Promise.reject(400);
		}
		return module.exports.playlistTypesAreValid(req);
	},

	// Validates playlist req data for patch method
	playlistIsValidForPatch: function(req){
		const keys = Object.keys(req.body);
		const filteredKeys = keys.filter(k => {
			return k !== "name" && k !== "description";
		});
		if (filteredKeys.length > 0) {
			return Promise.reject(400);
		}
		if (Object.keys(req.body).length > 2 ||
			Object.keys(req.body).length <= 0
		) {
			return Promise.reject(400);
		}
		return module.exports.playlistTypesAreValid(req);
	},

	// Validates playlist request data types
	playlistTypesAreValid: function(req){
		if ((typeof req.body.name != "string" &&
             typeof req.body.name != "undefined") ||
			(typeof req.body.description != "string" &&
             typeof req.body.description != "undefined")
		) {
			return Promise.reject(400);
		}
		if ((req.body.name != undefined && req.body.name.length > 1500) || 
			(req.body.description != undefined && req.body.description.length > 1500)
        ) {
			return Promise.reject(400);
		}
		
		return Promise.resolve();
	},

    // Validates song req data (post/put)
	songIsValid: function(req){
		if (req.body.title === undefined ||
            req.body.artist === undefined ||
			req.body.length === undefined
            ) {
			return Promise.reject(400);
		}
		return module.exports.songTypesAreValid(req);
	},

	// Validates song req data for patch method
	songIsValidForPatch: function(req){
		const keys = Object.keys(req.body);
		const filteredKeys = keys.filter(k => {
			return k !== "title" && k !== "artist" && k !== "length";
		});
		if (filteredKeys.length > 0) {
			return Promise.reject(400);
		}
		if (Object.keys(req.body).length > 4 ||
			Object.keys(req.body).length <= 0
		) {
			return Promise.reject(400);
		}
		return module.exports.songTypesAreValid(req);
	},

	// Validates song request data types
	songTypesAreValid: function(req){
		if ((typeof req.body.title != "string" &&
             typeof req.body.title != "undefined") ||
            (typeof req.body.artist != "string" &&
             typeof req.body.artist != "undefined") ||
            (typeof req.body.length != "number" &&
             typeof req.body.length != "undefined")
		) {
			return Promise.reject(400);
		}
		if ((req.body.title != undefined && req.body.title.length > 1500) ||
            (req.body.artist != undefined && req.body.artist.legnth > 1500) ||
            (req.body.length != undefined && req.body.length < 0)
        ) {
			return Promise.reject(400);
		}
		
		return Promise.resolve();
	},

	/* Checks if song is not in playlist */
	songIsNotInPlaylist: function(playlist, song){
        if (playlist === undefined || song === undefined) {
            return Promise.reject(404);
        }
        if (playlist.songs.some(s => {
            return s.id === song.id;
        })) {
            return Promise.reject(403);
        } else {
            return Promise.resolve(true);
        }
	},
    
    /* Checks if song is in playlist */
	songIsInPlaylist: function(playlist, song){
        if (playlist === undefined || song === undefined) {
            return Promise.reject(404);
        }
        if (playlist.songs.some(s => {
            return s.id === song.id;
        })) {
            return Promise.resolve(true);
        } else {
            return Promise.reject(404);
        }
	}

};