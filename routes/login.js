/* ----------------------------------------------------
Takamoto Kodani
Final Project
Controller functions for Auth0 webpage
Some of the code in this section is based on Auth0
node.js tutorial example:
https://auth0.com/docs/quickstart/webapp/nodejs
-----------------------------------------------------*/

const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const crypto = require('crypto');
const url = require('url');
const querystring = require('querystring');

const constants = require('../constants');
const models = require('../models');
const valid = require('../validators');

router.use(express.json());
router.use(session({
           resave: false,
           saveUninitialized: false,
           secret: randStr(16),
           cookie: {}}));

passport.use(new Auth0Strategy({
    domain: constants.OAUTH.DOMAIN,
    clientID: constants.OAUTH.CLIENT_ID,
    clientSecret: constants.OAUTH.CLIENT_SECRET,
    callbackURL: constants.OAUTH.CALLBACK_URL
    },
    (accessToken, refreshToken, extraParams, profile, done) => {
        profile.id_token = extraParams.id_token;
        return done(null, profile);
    }
));
router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

const USER = "User";


// Generate random alphanumeric string
// https://stackoverflow.com/a/27747377
function randStr(len){
    return crypto.randomBytes(len).toString("hex");
}

// Redirect user if not logged in
function secured(req, res, next){
    if (req.user) {return next();}
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
}

router.get('/', function(req, res){
    // Show welcome page
    res.render('home');
});

router.get('/login', passport.authenticate('auth0', {
    scope: 'openid profile'
    }), function(req, res){
    // Redirect to Auth0 login page
    res.redirect('/');
});

router.get('/oauth', function(req, res, next){
    passport.authenticate('auth0', function(err, user, info){
        if (err) {return next(err);}
        if (!user) {return res.redirect('/');}
        // Log in user
        req.logIn(user, function(err){
            if (err) {return next(err);}
            // Add user to datastore if user does not exist
            models.get_by_sub(req, USER, req.user.id)
            .then(user => {
                if (user === undefined) {
                    return models.post(
                    {
                        "oauth_id": req.user.id,
                        "name": req.user.nickname,
                        "playlists": [],
                    },
                    USER)
                    .catch(err => Promise.reject(err));
                } else {
                    return user;
                }
            })
            .then(user => res.redirect('profile'))
            .catch(err => {
                valid.handleError(res, 500);
            });
        });
    })(req, res, next);
});

router.get('/profile', secured, function(req, res){
    // Show user info page
    const context = {};
    models.get_by_sub(req, USER, req.user.id)
    .then(user => {return models.fromDatastore(req, user);})
    .then(user => {
        context.id = models.fromDatastore(req, user).id;
        context.name = req.user.nickname;
        context.jwt = req.user.id_token;
        res.render('profile', context);
    })
    .catch(err => valid.handleError(res, err));
})

router.get('/logout', function(req, res){
    // Log out user
    req.logout();
    let logoutURL = new url.URL(
        `https://${constants.OAUTH.DOMAIN}/v2/logout`
    );
    let searchStr = querystring.stringify({
        client_id: constants.OAUTH.CLIENT_ID,
        returnTo: constants.OAUTH.RETURN_TO
    })
    logoutURL.search = searchStr;
    res.redirect(logoutURL);
});

module.exports = router;