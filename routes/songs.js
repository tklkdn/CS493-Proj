/* ----------------------------------------------------
Takamoto Kodani
Final Project
Controller functions for Song resource
-----------------------------------------------------*/

const router = require('express').Router();
const constants = require('../constants');
const models = require('../models');
const valid = require('../validators');

const SONG = "Song";


router.get('/', function(req, res){
    models.get_all_page(req, SONG)
    .then(songs => res.status(200).json(songs));
});

router.get('/:id', function(req, res){
    models.get(req, SONG)
    .then(song => res.status(200).json(song))
    .catch(err => valid.handleError(res, err));
});

router.post('/', function(req, res){
    // Validate song request data
    valid.songIsValid(req)
    // Create song
    .then(() => {
        return models.post(
        {
            "title": req.body.title,
            "artist": req.body.artist,
            "length": req.body.length,
            "playlists": []
        },
        SONG)
    })
    .then(key => {return models.get(req, SONG, key)})
    .then(song => res.status(201).json(song))
    .catch(err => valid.handleError(res, err));
});

router.put('/:id', function(req, res){
    // Validate song request data
    valid.songIsValid(req)
    .then(() => {return models.get(req, SONG)})
    // Edit song
    .then(song => {
        return models.put(req.params.id,
        {
            "title": req.body.title,
            "artist": req.body.artist, 
            "length": req.body.length,
            "playlists": song.playlists
        },
        SONG)
    })
    .then(key => {return models.get(req, SONG, key)})
    .then(boat => {
        res.status(200).json(boat);
    })
    .catch(err => valid.handleError(res, err))
});

router.patch('/:id', function(req, res){
    const data = {
        "title": req.body.title,
        "artist": req.body.artist,
        "length": req.body.length
    }
    
    // Validate song request data
    valid.songIsValidForPatch(req)
    .then(() => {return models.get(req, SONG)})
    .then(song => {
        if (data.title === undefined) data.title = song.title;
        if (data.artist === undefined) data.artist = song.artist;
        if (data.length === undefined) data.length = song.length;
        data.playlists = song.playlists;
    })
    // Edit song
    .then(() => {return models.put(req.params.id, data, SONG)})
    .then(key => {return models.get(req, SONG, key)})
    .then(song => res.status(200).json(song))
    .catch(err => valid.handleError(res, err))
});

router.delete('/:id', async function(req, res){
    // Get song
    const song = await models.get(req, SONG)
    .catch(err => valid.handleError(res, err));
    
    // Remove song from playlists containing song
    await models.get_all_playlists(req, req.params.id)
    .then(playlists => playlists.map(playlist => models.removeSong(playlist, song)))
    // Delete song
    .then(() => models.delete(req.params.id, SONG))
    .then(() => res.status(204).end())
    .catch(err => valid.handleError(res, err));    
});

module.exports = router;