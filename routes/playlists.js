/* ----------------------------------------------------
Takamoto Kodani
Final Project
Controller functions for Playlist resource (protected)
-----------------------------------------------------*/

const router = require('express').Router();
const {Datastore} = require('@google-cloud/datastore');
const constants = require('../constants');
const models = require('../models');
const valid = require('../validators');

const datastore = new Datastore();

const PLAY = "Playlist";
const SONG = "Song";
const USER = "User";

router.use(valid.checkJwt);
router.use(valid.authenticateJwt);


// Get all playlists associated with user
router.get('/', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));

    models.get_all_page(req, PLAY, user.id)
    .then(playlists => res.status(200).json(playlists));
});

// Get a playlist
router.get('/:id', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Get a playlist
    models.get(req, PLAY)
    .then(playlist => {return valid.authorizeJwt(playlist, user);})
    .then(playlist => res.status(200).json(playlist))
    .catch(err => valid.handleError(res, err));
});

// Get all songs in a playlist
router.get('/:id/songs', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Get all songs from a playlist
    models.get(req, PLAY)
    .then(playlist => {return valid.authorizeJwt(playlist, user);})
	.then(playlist => {return models.get_all_songs(req, req.params.id);})
	.then(songs => res.status(200).json(songs))
	.catch(err => valid.handleError(res, err));
});

// Add a new playlist
router.post('/', function(req, res){
    // Validate playlist request data
    valid.playlistIsValid(req)
    // Get user
    .then(() => {return models.get_by_sub(req, USER, req.user.sub);})
    // Create playlist
    .then(user => {
        return models.post(
        {
            "name": req.body.name,
            "description": req.body.description,
            "created": new Date().toLocaleString(),
            "songs": [],
            "owner": user.id
        },
        PLAY)
    })
    .then(key => {return models.get(req, PLAY, key)})
    .then(playlist => res.status(201).json(playlist))
    .catch(err => valid.handleError(res, err));
});

// Edit a playlist - PUT
router.put('/:id', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Validate playlist request data
    await valid.playlistIsValid(req)
    .then(() => {return models.get(req, PLAY)})
    .then(playlist => {return valid.authorizeJwt(playlist, user);})
    // Edit playlist
    .then(playlist => {
        return models.put(req.params.id,
        {
            "name": req.body.name,
            "description": req.body.description,
            "created": playlist.created,
            "songs": playlist.songs,
            "owner": playlist.owner
        },
        PLAY)
    })
    .then(key => {return models.get(req, PLAY, key)})
    .then(playlist => res.status(200).json(playlist))
    .catch(err => valid.handleError(res, err))
});

// Edit a playlist - PATCH
router.patch('/:id', async function(req, res){
    const data = {
        "name": req.body.name,
        "description": req.body.description,
    }
    
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Validate playlist request data
    await valid.playlistIsValidForPatch(req)
    .then(() => {return models.get(req, PLAY)})
    .then(playlist => {return valid.authorizeJwt(playlist, user);})
    .then(playlist => {
        if (data.name === undefined) data.name = playlist.name;
        if (data.description === undefined) data.description = playlist.description;
        data.created = playlist.created;
        data.songs = playlist.songs;
        data.owner = playlist.owner;
    })
    // Edit playlist
    .then(() => {return models.put(req.params.id, data, PLAY)})
    .then(key => {return models.get(req, PLAY, key)})
    .then(playlist => res.status(200).json(playlist))
    .catch(err => valid.handleError(res, err))
});

// Add a song to a playlist
router.put('/:id/songs/:song_id', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Check playlist exists
	const playlist = await models.get(req, PLAY)
	.catch(err => valid.handleError(res, err));
    
	// Check song exists
	const key = datastore.key([SONG, parseInt(req.params.song_id)]);
	const song = await models.get(req, SONG, key)
	.catch(err => valid.handleError(res, err));
    
    await valid.authorizeJwt(playlist, user)
	// Check song is not in playlist
    .then(() => valid.songIsNotInPlaylist(playlist, song))
    // Add song to playlist and vice versa
	.then(() => models.addPlaylist(playlist, song))
	.then(() => {
		song.self = req.protocol + "://" + req.get('host') + 
					"/songs/" + song.id;
		return models.addSong(playlist, song);
	})
	.then(() => res.status(204).end())
	.catch(err => valid.handleError(res, err));
});

// Remove a song from a playlist
router.delete('/:id/songs/:song_id', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
	// Check playlist exists
	const playlist = await models.get(req, PLAY)
	.catch(err => valid.handleError(res, err));
	
	// Check song exists
	const key = datastore.key([SONG, parseInt(req.params.song_id)]);
	const song = await models.get(req, SONG, key)
	.catch(err => valid.handleError(res, err));
	
    await valid.authorizeJwt(playlist, user)
	// Check song is in playlist
    .then(() => valid.songIsInPlaylist(playlist, song))
    // Remove song from playlist and vice versa
	.then(() => models.removePlaylist(playlist, song))
	.then(() => {return models.removeSong(playlist, song)})
	.then(() => res.status(204).end())
	.catch(err => valid.handleError(res, err));
});

// Delete playlist
router.delete('/:id', async function(req, res){
    const user = await models.get_user(req, USER)
    .catch(err => valid.handleError(res, err));
    
    // Get playlist
    const playlist = await models.get(req, PLAY)
    .catch(err => valid.handleError(res, err));  
    
    await valid.authorizeJwt(playlist, user)
    // Get all songs from playlist and remove playlist from each
    .then(() => models.get_all_songs(req, req.params.id, true))
    .then(songs => songs.map(song => models.removePlaylist(playlist, song)))
    // Delete playlist
    .then(() => models.delete(req.params.id, PLAY))
    .then(() => res.status(204).end())
    .catch(err => valid.handleError(res, err));    
});

module.exports = router;