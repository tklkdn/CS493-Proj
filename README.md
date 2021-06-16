# Final Project: API Spec

CS 493: Cloud Application Development

Application URL/Account Creation or Login URL:

[https://kodanit-cs493-proj.appspot.com](https://kodanit-cs493-proj.appspot.com)

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
|user_id|String|ID of the user. |
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
##### Response Examples
*Success*

    Status: 200 OK
    {
      "id": "123456789",
      "name": "kodanit",
      "oauth_id": "987654321",
      "playlists": [],
      "self": "https://kodanit-cs493-proj.appspot.com/users/123456789"
    }

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
##### Response Examples

    Status: 200 OK
    [
    {
      "id": "123456789",
      "name": "bonnie",
      "self": "https://kodanit-cs493-proj.appspot.com/users/123456789"
    },
    {
      "id": "987654321",
      "name": "clyde",
      "self": "https://kodanit-cs493-proj.appspot.com/users/987654321"
    }
    ]


