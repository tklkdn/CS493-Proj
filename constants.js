/* ----------------------------------------------------
Takamoto Kodani
Final Project
Error constants
-----------------------------------------------------*/

module.exports = {
	ERR: {
		B400: {
			"Error": "The request object contains invalid attribute(s)"
		},
        B401: {
            "Error": "Token is either missing or invalid"
        },
		B403: {
			"Error": "Request is not permitted"
		},
		B404: {
			"Error": "No item with this id exists"
		},
		B405: {
			"Error": "Items must be edited or deleted individually"
		},
		B406: {
			"Error": "Requested content type is not supported"
		},
		B415: {
			"Error": "Media type is not supported"
		}
	},
    OAUTH: {
        DOMAIN: "kodanit-cs493.us.auth0.com",
        CLIENT_ID: "Qo7FdpF7gfCRijrivCZ9FiiPBeP9KLov",
        CLIENT_SECRET: "xPVCHS52EhtCi0M1ELA8Ppsow0eo4MTAI_wB8cBC8BhQew4qSIQ3PpE0kGjU1AkB",
        CALLBACK_URL: "http://localhost:8080/oauth",
        RETURN_TO: "http://localhost:8080"
    }
};