var express = require('express');
var router = express.Router({ caseSensitive: true });
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
/*
var User = require('../models/user');
var Poll = require('../models/polls');
*/

//Get all the polls in general
router.get('/', function(request, response){
    console.log("ENTRO A index");       
});

module.exports = router;