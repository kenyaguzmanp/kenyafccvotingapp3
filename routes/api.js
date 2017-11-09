var express = require('express');
var router = express.Router({ caseSensitive: true });
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

var User = require('../models/user');
/*
var Poll = require('../models/polls');
*/

//Get all the polls in general
router.get('/', function(request, response){
    console.log("ENTRO A index");       
});

router.post('/register', function(request, response){
    if(request.body.name && request.body.password){
        var user = new User();
        user.name = request.body.name;
        user.password = bcrypt.hashSync(request.body.password, bcrypt.genSaltSync(10));
        user.save(function(err, document){
            if(err){
                return response.status(400).send(err)
            }else{
                var token = jwt.sign({
                    data: document
                }, process.env.secret, { expiresIn: 3600});
                return response.status(201).send(token);
            }
        });
    }else{
        return response.status(400).send({
            message: 'Invalid credentials supplied'
        })
    }
});

//verification of token
router.post('/verify', function(request, response){
    // console.log("el token en verify: ", request.body.token);
     if(!request.body.token){
         return response.status(400).send('No token has been provided');
     }
     jwt.verify(request.body.token, process.env.secret, function(err, decoded){
         if(err){
             return response.status(400).send('error with token')
         }
         return response.status(200).send(decoded)
     });
 });
 
 //login
 router.post('/login', function(request, response){
     if(request.body.name && request.body.password){
         User.findOne({ name: request.body.name }, function(err, user){
             if(err){
                 return response.status(400).send('An error has ocurred. lease try again.');
             }
             if(!user){
                 return response.status(404).send('No user registered with that credentials');
             }
             if(bcrypt.compareSync(request.body.password, user.password)){
                 var token = jwt.sign({
                     data: user
                 }, process.env.secret, { expiresIn: 3600})
                 return response.status(200).send(token);
             }
             return response.status(400).send('Invalid password');
         })
     }else{
         return response.status(400).send('Please enter valid credentials');
     }
 });

 //Authentication middleware
function authenticate(request, response, next){
    if(!request.headers.authorization){
        console.log("no ha token");
        return response.status(404).send('No token supplied')
    }
    if(request.headers.authorization.split(' ')[1]){
        var token = request.headers.authorization.split(' ')[1];
       // console.log("request authorization: ", request.headers);
       // console.log("token: " + token);
        jwt.verify(token, process.env.secret, function(err, decoded){
            if(err){
                console.log("error en jwt");
                return response.status(400).send(err)
            }
            console.log("continuig with middleware");
            next();
        })
    }
};



module.exports = router;