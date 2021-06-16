/* ----------------------------------------------------
Takamoto Kodani
Final Project
Main server file
-----------------------------------------------------*/

const express = require('express');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});

const constants = require('./constants');
const models = require('./models');
const valid = require('./validators');

const app = express();
app.use(express.json());
app.enable('trust proxy');
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(valid.reqIsValid);

app.put(['/playlists', '/songs'], function(req, res){
    valid.handleError(res, 405);    
});

app.patch(['/playlists', '/songs'], function(req, res){
    valid.handleError(res, 405);    
});

app.delete(['/playlists', '/songs'], function(req, res){
    valid.handleError(res, 405);    
});

// Routes
app.use('/', require('./routes/login'));
app.use('/users', require('./routes/users'));
app.use('/playlists', require('./routes/playlists'));
app.use('/songs', require('./routes/songs'));

app.use(valid.validateJson);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});