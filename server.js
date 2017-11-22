//create db connection string
var db = process.env.MONGODB_URI;

//create a port for the server to listen on
var port =  process.env.PORT;

//load router
var router = require('./routes/api');

//load the node modules
var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');

//create express application
var app= express(); 

//load the environment variables
dotenv.config({ verbose: true});

//conect to mongo
/*
mongoose.connect(db, function(err){
    if(err){
        console.log(err);
    }
});
*/

mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;

//listen to mongoose connection events
mongoose.connection.on('connected', function(){
    console.log('Succesfully connected to: ' + db);
});

mongoose.connection.on('disconnected', function(){
    console.log('Succesfully disconnected from: ' + db);
});

mongoose.connection.on('error', function(){
    console.log('error connecting to db');
});

//configure express middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.use('/api', router);
app.get("*", function(request, response){
    response.sendFile(__dirname + '/public/index.html');
});

//start our server
app.listen(port, function(){
    console.log('Listening on ' + port);
});
