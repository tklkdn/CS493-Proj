# Music Playlist: API Spec

CS 493: Cloud Application Development  
Application URL/Account Creation or Login URL:  
[https://kodanit-cs493-proj.appspot.com](https://kodanit-cs493-proj.appspot.com)

## Index
[Data Model](#data-model)  
[Get a User](#get-a-user)  
[List All Users](#list-all-users)  
[Create a Playlist](#create-a-playlist)  
[Get a Playlist](#get-a-playlist)  
[List All Playlists](#list-all-playlists)  
[Edit a Playlist - PUT](#edit-a-playlist---put)  
[Edit a Playlist - PATCH](#edit-a-playlist---patch)  
[Delete a Playlist](#delete-a-playlist)  
[Create a Song](#create-a-song)  
[Get a Song](#get-a-song)  
[List All Songs](#list-all-songs)  
[Edit a Song - PUT](#edit-a-song---put)  
[Edit a Song - PATCH](#edit-a-song---patch)  
[Delete a Song](#delete-a-song)  
[Add a Song to a Playlist](#add-a-song-to-a-playlist)  
[Remove a Song from a Playlist](#remove-a-song-from-a-playlist)  
[Failure Response Reference](#failure-response-reference)  

## Data Model
### User
|Property Name|Notes|
|--|--|
|id|User's unique identifier. Generated automatically|
|oauth_id|User's OAuth 2.0 ID. Used to associate user with Auth0 account but currently serves no other purpose.|
|name|Username of email address used for OAuth login.|
|playlists|Array of playlists belonging to the user. If user does not have a playlist, array is empty.|

### Playlist
|Property Name|Notes|
|--|--|
|id|The ID of the playlist. Generated automatically.|
|name|The name of the playlist.|
|description|The description of the playlist.|
|created|Datetime playlist was created. Automatically timestamped.|
|songs|Array of songs added to the playlist. If no song is added, array is empty.|
|owner|The user that the playlist belongs to.|

### Song
|Property Name|Notes|
|--|--|
|id|The ID of the song. Generated automatically.|
|title|The title of the song.|
|artist|The artist of the song.|
|length|The length of the song in seconds.|
|playlists|Array of playlists that the song is added to. If the song is not added to any playlist, the array is empty.|

There are three kinds of entities in the data model: User, Playlist, and Song.

A playlist is created by a user and includes songs that are added by, and only by, said user. When a song is added to a playlist, an object consisting of the song’s properties is added to the playlist’s songs property as an array element. At the same time, an object consisting of the playlist’s properties is added to the song’s playlists property, also as an array element.

A user is created automatically by signing in for the first time through the account creation/login webpage specified above. User properties are populated from the token generated from the Auth0 service and cannot be modified after the entity is added to the datastore. The application also does not currently facilitate the deletion of a user entity.

The song entity is not related to any user, but every playlist entity is related to a single user. As such, the playlist resource is protected and requires OAuth 2.0 authorization for creation, modification, and deletion. Creating a playlist will add it to the user’s playlists property as an array element and set the playlist’s owner property to the user’s id value. 

When making a request related to the playlist entity, a JWT belonging to the user making the request is required as a bearer token to authenticate and authorize the request. The application will use this token to retrieve the user’s unique identifier—namely, the id property—from the datastore and verify if the user is authorized to fulfill the request. (The id property is generated automatically when the entity is initially created in the datastore.)

## Get a User
Allows you to get an existing user.

    GET /users/:user_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|user_id|String|ID of the user|
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|404 Not Found|No item with this id exists|

## List All Users
Lists all users.

    GET /users

### Request
##### Path Parameters
None
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||

## Create a Playlist
Allows you to create a new playlist. Requires a valid JWT token.

    POST /playlists

### Request
##### Path Parameters
None
##### Request Body
Required
##### Request Body Format
JSON
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|name|String|The name of the playlist.|Yes|
|description|String|The description of the playlist.|Yes|
##### Request Body Example
    {
      "name": "Focus",
      "type": "Music to listen to while studying"
    }
 - Double quote and backslash characters used within the name attribute or type attribute must be escaped with a backslash character.
 - An attribute string may not contain more than 1500 characters.
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|201 Created||
|Failure|400 Bad Request|Any of the following reasons will cause the playlist to not be created, and 400 status code to be returned: If the request is missing either of the 2 required attributes; if there are any extraneous attributes; if there are more than 2 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|401 Unauthorized|Attempting to create a new playlist with a missing or invalid token will return a 401 status code.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the playlist will not be created.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the playlist will not be created.|

 - Datastore will automatically generate an ID and store it with the entity being created. The app will send back this value in the response body as shown in the example.
 - The `created` attribute will be automatically timestamped on the date and time that the playlist is created.
 - The `songs` attribute will be created automatically as an empty array. It will store any songs added to the playlist as objects.
 - The `owner` attribute will be automatically set to the ID of the authenticated user who creates the playlist.
 - The `self` attribute will contain the live link to the REST resource corresponding to this playlist. In other words, this is the URL to get this newly created playlist.

## Get a Playlist
Allows you to get an existing playlist. Requires a valid JWT token.

    GET /playlists/:playlist_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|404 Not Found|No playlist with this playlist_id exists|

## List All Playlists
Lists all playlists associated with a user in paginated format. Returns no more than 5 playlists per page. Requires a valid JWT token.

    GET /playlists

### Request
##### Path Parameters
None
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||

 - If there are more than 5 results, the response will include a next link that gets the next 5 results, unless there are no more pages of results left.
 - The `total_items` property refers to the total number of playlists belonging to the user.

## Edit a Playlist - PUT
Allows you to edit a boat. All attributes specified below are required. Requires a valid JWT token.

    PUT /playlists/:playlist_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
##### Request Body
Required
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|name|String|The name of the playlist.|Yes|
|description|String|The description of the playlist.|Yes|
##### Request Body Example

    {
      "name": "Focus",
      "type": "Music to listen to while juggling"
    }

### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|400 Bad Request|Any of the following reasons will cause the playlist to not be modified, and 400 status code to be returned: If the request is missing either of the 2 required attributes; if there are any extraneous attributes; if there are more than 2 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|401 Unauthorized|Attempting to edit a playlist with a missing or invalid token will return a 401 status code.|
|Failure|403 Forbidden|User is not authorized to edit the playlist.|
|Failure|404 Not Found|No playlist with this playlist_id exists.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the playlist will not be modified.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the playlist will not be modified.|

## Edit a Playlist - PATCH
Allows you to edit a subset of attributes of a playlist. Any attributes unspecified in the request body will remain unchanged. Requires a valid JWT token.

    PATCH /playlists/:playlist_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
##### Request Body
Required
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|name|String|The name of the playlist.|No|
|description|String|The description of the playlist.|No|
##### Request Body Example

    {
      "type": "Music to listen to while juggling"
    }

### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|400 Bad Request|Any of the following reasons will cause the playlist to not be modified, and 400 status code to be returned: If there are any extraneous attributes; if there are more than 2 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|401 Unauthorized|Attempting to edit a playlist with a missing or invalid token will return a 401 status code.|
|Failure|403 Forbidden|User is not authorized to edit the playlist.|
|Failure|404 Not Found|No playlist with this playlist_id exists.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the playlist will not be modified.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the playlist will not be modified.|

## Delete a Playlist
Allows you to delete a playlist. If there are songs added to the playlist, deleting the playlist will remove the playlist from all the songs. Requires a valid JWT token.

    DELETE /playlists/:playlist_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
##### Request Body
None
### Response
##### Response Body Format
Success: No body
Failure: JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|204 No Content||
|Failure|404 Not Found|No playlist with this playlist_id exists.|

## Create a Song
Allows you to create a new song.

    POST /songs

### Request
##### Path Parameters
None
##### Request Body
Required
##### Request Body Format
JSON
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|title|String|The title of the song.|Yes|
|artist|String|The artist of the song.|Yes|
|length|Integer|The length of the song in seconds.|Yes|
##### Request Body Example

    {
      "title": "Rapper’s Delight",
      "artist": "The Sugarhill Gang",
      "length": 875
    }

 - Double quote and backslash characters used within the name attribute or type attribute must be escaped with a backslash character.
 - An attribute string may not contain more than 1500 characters.
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|201 Created||
|Failure|400 Bad Request|Any of the following reasons will cause the song to not be created, and 400 status code to be returned: If the request is missing any of the 3 required attributes; if there are any extraneous attributes; if there are more than 3 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the playlist will not be created.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the playlist will not be created.|

 - Datastore will automatically generate an ID and store it with the entity being created. The app will send back this value in the response body as shown in the example.
 - The playlists attribute will be created automatically as an empty array. It will store all the playlists that have added the song.
 - The `self` attribute will contain the live link to the REST resource corresponding to this song. In other words, this is the URL to get this newly created song.

## Get a Song
Allows you to get an existing song.

    GET /songs/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|song_id|String|ID of the song|
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|404 Not Found|No song with this song_id exists|

## List All Songs
Lists all the songs in paginated format. Returns no more than 5 songs per page.

    GET /songs

### Request
##### Path Parameters
None
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||

 - If there are more than 5 results, the response will include a next link that gets the next 5 results, unless there are no more pages of results left.
 - The `total_items` property refers to the total number of songs in the datastore.

## Edit a Song - PUT
Allows you to edit a song. All attributes specified below are required.

    PUT /song/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|song_id|String|ID of the song|
##### Request Body
Required
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|title|String|The title of the song.|Yes|
|artist|String|The artist of the song.|Yes|
|length|Integer|The length of the song in seconds.|Yes|
##### Request Body Example

    {
      "title": "Song 3",
      "artist": "Blur",
      "length": 122
    }

### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|400 Bad Request|Any of the following reasons will cause the song to not be modified, and 400 status code to be returned: If the request is missing any of the 3 required attributes; if there are any extraneous attributes; if there are more than 3 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|404 Not Found|No song with this song_id exists.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the song will not be modified.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the song will not be modified.|

## Edit a Song - PATCH
Allows you to edit a subset of attributes of a song. Any attributes unspecified in the request body will remain unchanged.

    PATCH /songs/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|song_id|String|ID of the song|
##### Request Body
Required
##### Request JSON Attributes
|Name|Type|Description|Required?|
|--|--|--|--|
|title|String|The title of the song.|No|
|artist|String|The artist of the song.|No|
|length|Integer|The length of the song in seconds.|No|
##### Request Body Example

    {
      "title": "Song 3”
    }

### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|400 Bad Request|Any of the following reasons will cause the song to not be modified, and 400 status code to be returned: If there are any extraneous attributes; if there are more than 3 attributes; if the JSON syntax in the request is invalid; if the data type of the attribute is invalid; if an attribute string contains unescaped characters; and if an attribute string contains more than 1500 characters.|
|Failure|404 Not Found|No song with this song_id exists.|
|Failure|406 Not Acceptable|If the client does not accept a valid content type, the song will not be modified.|
|Failure|415 Unsupported Media Type|If the client sends a request formatted with an invalid content type, the song will not be modified.|

## Delete a Song
Allows you to delete a song. If the song being deleted is in a playlist, the song will be removed from the playlist automatically.

    DELETE /songs/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|song_id|String|ID of the song|
##### Request Body
None
### Response
##### Response Body Format
Success: No body
Failure: JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|204 No Content||
|Failure|404 Not Found|No song with this song_id exists.|

## Add a Song to a Playlist
Assigns a load to a boat. Requires a valid JWT token.

    PUT /playlists/:playlist_id/songs/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
|song_id|String|ID of the song|
##### Request Body
None
### Response
No body
##### Response Body Format
Success: No body 
Failure: JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|204 No Content|Succeeds only if: a playlist exists with this playlist_id; a song exists with this song_id; the same song with the same song_id is not already in the playlist; and the request is made by the owner of the playlist|
|Failure|401 Unauthorized|A missing or invalid token will return a 401 status code.|
|Failure|403 Forbidden|Either the user is not authorized or the song is already added to the playlist.|
|Failure|404 Not Found|No playlist with this playlist_id exists and/or no song with this song_id exits.|

## Remove a Song from a Playlist
Removes a song from a playlist. Requires a valid JWT token.

    DELETE /playlists/:playlist_id/songs/:song_id

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
|song_id|String|ID of the song|
##### Request Body
None
### Response
No body
##### Response Body Format
Success: No body 
Failure: JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|204 No Content|Succeeds only if: a playlist exists with this playlist_id; a song exists with this song_id; the song with this song_id is in the playlist; and the request is made by the owner of the playlist|
|Failure|401 Unauthorized|A missing or invalid token will return a 401 status code.|
|Failure|403 Forbidden|Either the user is not authorized or the song is not in the playlist.|
|Failure|404 Not Found|No playlist with this playlist_id exists and/or no song with this song_id exits.|

## List All Songs in a Playlist
Lists all songs in a playlist that is associated with a user. Requires a valid JWT token.

    GET /playlists/:playlist_id/songs

### Request
##### Path Parameters
|Name|Type|Description|
|--|--|--|
|playlist_id|String|ID of the playlist|
##### Request Body
None
### Response
##### Response Body Format
JSON
##### Response Statuses
|Outcome|Status Code|Notes|
|--|--|--|
|Success|200 OK||
|Failure|404 Not Found|No playlist with this playlist_id exists|

## Failure Response Reference

### Status: 400 Bad Request

    {    
    "Error":  "The request object contains invalid attribute(s)"
    }

### Status: 401 Unauthorized

    {    
    "Error":  "Token is either missing or invalid"
    }

### Status: 403 Forbidden
The 403 status code may occur when a user attempts to modify or delete another user’s playlist. It may also occur when a user attempts to add song that already exists in their playlist or to remove a song that does not exist in their playlist.

    {    
    "Error":  "Request is not permitted"
    }

### Status: 404 Not Found

    {    
    "Error":  "No item with this id exists"
    }

### Status: 405 Method Not Allowed

    {    
    "Error":  "Items must be edited or deleted individually"
    }

### Status: 406 Not Acceptable

    {    
    "Error":  "Requested content type is not supported"
    }


