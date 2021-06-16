/* ----------------------------------------------------
Takamoto Kodani
Final Project
Model functions
-----------------------------------------------------*/

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();

module.exports = {

	/* Add ID and self to entity */
	fromDatastore: function(req, item){
        if (item === undefined) {
            return item;
        }
		item.id = item[Datastore.KEY].id;
		item.self = req.protocol + "://" + req.get('host') + req.baseUrl + "/" + item.id;
		return item;
	},
	
	/* Create new entity */
	post: function(attrib, kind){
		var key = datastore.key(kind);
		return datastore.save({"key":key, "data":attrib})
        .then(() => {return key});
	},

	/* Get an entity */
	get: function(req, kind, keyParam=null){
		var key;
		if (keyParam != null) {
			// If key provided as a param, use that
			key = keyParam;
		} else {
			// Otherwise create key from id in req
			key = datastore.key([kind, parseInt(req.params.id)]);
		}
		return datastore.get(key)
		.then(entity => {
            if (entity[0] === undefined) return Promise.reject(404);
            return module.exports.fromDatastore(req, entity[0]);
        })
		.catch(err => {return Promise.reject(404)});
	},
    
    /* Get user entity by sub value */
    get_by_sub: function(req, kind, id){
        const q = datastore.createQuery(kind);
        q.filter("oauth_id", id);
        return datastore.runQuery(q)
        .then(users => {return module.exports.fromDatastore(req, users[0][0]);})
        .catch(err => {return undefined;})
    },
    
    /* Get user entity */
    get_user: function(req, kind){
        return module.exports.get_by_sub(req, kind, req.user.sub)
        .then(user => {return module.exports.fromDatastore(req, user);})
        .catch(err => {return Promise.reject(404)});    
    },
    
    /* Get all entities from a kind */
	get_all_users: function(req, kind){
		const q = datastore.createQuery(kind);
		return datastore.runQuery(q).then((entities) => {
			return entities[0].map((entity) => {
				delete entity["oauth_id"];
                delete entity["playlist"];
                return module.exports.fromDatastore(req, entity);
			});
		});
	},
    
    /* Get all entities from a kind - paginated */
	get_all_page: function(req, kind, user_id = null){
		let q = datastore.createQuery(kind).limit(5);
        if (user_id !== null) q.filter("owner", user_id);
		const results = {};
		if (Object.keys(req.query).includes("cursor")){
			q = q.start(req.query.cursor);
		}
		return datastore.runQuery(q).then(async function(entities){
			results.items = entities[0].map(entity => {
                if (entity.playlists){
                    delete entity.playlists;
                }
				return module.exports.fromDatastore(req, entity);
			});
			if (entities[1].moreResults !== datastore.NO_MORE_RESULTS) {
				results.next = req.protocol + "://" + req.get("host") + 
							   req.baseUrl + "?cursor=" + entities[1].endCursor;
			}
			results.total_items = await module.exports.get_total(req, kind, user_id);
            return results;
		})
		.catch(err => {return Promise.reject(404)});
	},
    
    /* Get total number of entities in a collection */
    get_total: function(req, kind, user_id = null){
        const q = datastore.createQuery(kind).select('__key__');
        if (user_id !== null) q.filter("owner", user_id);
        return datastore.runQuery(q).then(entities => {
            return entities[0].length;
        })
        .catch(err => {return Promise.reject(404)});
    },

    /* Get all songs from a given playlist */
	get_all_songs: function(req, playlist_id, includePlaylist = false){
		const q = datastore.createQuery("Song");
		q.filter("playlists.id", playlist_id);
		return datastore.runQuery(q)
		.then(songs => {
			return songs[0].map(song => {
				const s = module.exports.fromDatastore(req, song);
				s.self = req.protocol + "://" + req.get('host') + 
						 "/songs/" + song.id;
                if (!includePlaylist) delete s.playlists;
				return s;
			});
		})
		.catch(err => {return Promise.reject(404)});
	},
    
    /* Get all playlists associated with song */
    get_all_playlists: function(req, song_id){
		const q = datastore.createQuery("Playlist");
		q.filter("songs.id", song_id);
		return datastore.runQuery(q)
		.then(playlists => {
			return playlists[0].map(playlist => {
				const p = module.exports.fromDatastore(req, playlist);
				p.self = req.protocol + "://" + req.get('host') + 
						 "/playlists/" + playlist.id;
				return p;
			});
		})
		.catch(err => {return Promise.reject(404)});        
    },

	/* Update an entity */
	put: function(id, attrib, kind){
		const key = datastore.key([kind, parseInt(id,10)]);
		return datastore.save({"key":key, "data":attrib})
		.then(() => {return key})
		.catch(err => {return Promise.reject(404)});
	},

	/* Delete an entity */
	delete: function(id, kind){
		const key = datastore.key([kind, parseInt(id,10)]);
		return datastore.delete(key);
	},
	
	/* Add playlist to song */
	addPlaylist: function(playlist, song){
        const plArr = song.playlists;
		const pl = {
			"id": playlist.id,
			"name": playlist.name,
			"self": playlist.self
		};
        plArr.push(pl);
		return module.exports.put(
			song.id,
			{
				"title": song.title,
				"artist": song.artist,
				"length": song.length,
                "playlists": plArr
			},
			"Song"
		).then((key) => {return key});
	},
	
	/* Add song to playlist */
	addSong: function(playlist, song){
		const songArr = playlist.songs;
		const s = {
			"id": song.id,
            "title": song.title,
			"self": song.self
		};
		songArr.push(s);
		return module.exports.put(
			playlist.id,
			{
				"name": playlist.name,
				"description": playlist.description,
				"created": playlist.created,
                "owner": playlist.owner,
                "songs": songArr
			},
			"Playlist"
		).then((key) => {return key})
	},
    
    /* Remove playlist from song */
	removePlaylist: function(playlist, song){
        const plArr = song.playlists.filter(pl => {return pl.id !== playlist.id});
		return module.exports.put(
			song.id,
			{
				"title": song.title,
				"artist": song.artist,
				"length": song.length,
                "playlists": plArr
			},
			"Song"
		).then((key) => {return key});
	},
    
    /* Remove song from playlist */
	removeSong: function(playlist, song){
		const songArr = playlist.songs.filter(s => {return s.id !== song.id});
		return module.exports.put(
			playlist.id,
			{
				"name": playlist.name,
				"description": playlist.description,
				"created": playlist.created,
                "owner": playlist.owner,
                "songs": songArr
			},
			"Playlist"
		).then((key) => {return key});
	}

}