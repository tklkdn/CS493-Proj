/* ----------------------------------------------------
Takamoto Kodani
Final Project
Controller functions for User resource
-----------------------------------------------------*/

const router = require('express').Router();
const models = require('../models');
const valid = require('../validators');

const USER = "User";

router.get('/:id', function(req, res){
    // Get a user
    models.get(req, USER)
    .then(user => res.status(200).json(user))
    .catch(err => valid.handleError(res, err));
});

router.get('/', function(req, res){
    // Get all users
    models.get_all_users(req, USER)
    .then(users => {
        users.map(user => {
            delete user.playlists;
            return user;
        })
        res.status(200).json(users)
    })
    .catch(err => valid.handleError(res, err));
});

router.post('/', function(req, res){
	valid.handleError(res, 405);
});

router.put('/:id', function(req, res){
    valid.handleError(res, 405);    
});

router.patch('/:id', function(req, res){
    valid.handleError(res, 405);    
});

router.delete('/:id', function(req, res){
    valid.handleError(res, 403);   
});

router.delete('/', function(req, res){
    valid.handleError(res, 405);    
});

module.exports = router;