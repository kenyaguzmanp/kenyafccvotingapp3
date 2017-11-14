var express = require('express');
var router = express.Router({ caseSensitive: true });
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

var User = require('../models/user');
var Poll = require('../models/polls');


//Get all the polls in general
router.get('/', function(request, response){
    console.log("ENTRO A index");
    var allPolls =[];
    var allUsers = [];
    var allData={};


    Poll.find({}, function(err, polls){
        if(err){
            return response.status(400).send(err)
        }
        if(polls.length < 1){
            return response.status(400).send('No polls added yet')
        }
        allPolls = polls;
        allData.polls = allPolls;
        
        User.find({}, function(err, users){
            if(err){
                return response.status(400).send(err)
            }
            if(users.length < 1){
                return response.status(400).send('No polls added yet')
            }
            allUsers = users;
            allData.users = allUsers;
            return response.status(200).send(allData)
        })
        
    })
           
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

 router.get('/profile', authenticate, function(request, response){
    var pollsToSend =[];
    var pollsUser=[];
    if(response.req.headers.authorization){
        console.log("autorizado");
    }

    Poll.find({}, function(err, polls){
        if(err){
            return response.status(400).send(err)
        }
        if(polls.length < 1){
            return response.status(400).send('No polls added yet')
        }
        pollsToSend = polls;
        return response.status(200).send(polls)
    }) 
});


//Get all the polls
router.get('/polls', authenticate, function(request, response){
    var pollsToSend =[];
    var pollsUser=[];
    if(response.req.headers.authorization){
        console.log("autorizado");
    }

    Poll.find({}, function(err, polls){
        if(err){
            return response.status(400).send(err)
        }
        if(polls.length < 1){
            return response.status(400).send('No polls added yet')
        }
        pollsToSend = polls;
        return response.status(200).send(polls)
    }) 
});

//CReate a new poll
router.post('/polls', authenticate, function(request, response){
    if(!request.body.options || !request.body.name){
        return response.status(400).send('No poll data supplied');
    }
    if(!request.body.toDelete){
        var poll = new Poll();
        poll.name = request.body.name;
        poll.options = request.body.options;
        poll.user = request.body.user;

        poll.save(function(err, res){
            if(err){
                return response.status(400).send(err)
            }
            return response.status(201).send(res)
        });
    }else{
        var pollToDeleteId = request.body._id;
        Poll.remove({ _id: pollToDeleteId}, function(err, pol){
            if(err){
                return response.status(400).send(err)
            }
            return response.status(200).send(pol);
        })
    }
    
});


router.post('/polls/:id', function(request, response){
    var pollToUpdateId = request.body._id;
    var optionsToUpdate = request.body.options;
    
    Poll.update({ _id: pollToUpdateId},{ $set: {options : optionsToUpdate}}, function(err, response){
        if(err){
            return response.status(400).send(err)
        }
    }) 
    

});



router.get('/polls/:id', function(request, response){
    var polToSend={};
    var idPoll = request.params.id;
    var idUser = "";
    var completePoll = {};

    Poll.find({ _id: idPoll}, function(err, pol){
        console.log("buscando en la BD");
        if(err){
            return response.status(400).send(err)
        }
        polToSend = pol[0];
        idUser = polToSend.user;
        User.find({ _id: idUser}, function(err, user){
            if(err){
                return response.status(400).send(err)
            }
            polToSend.userName = user[0].name;
            completePoll =[{
                "userName": user[0].name,
                "_id": polToSend._id,
                "user": polToSend.user,
                "options": polToSend.options,
                "name": polToSend.name
            }];
            return response.status(200).send(completePoll);
        })
    })

});



 //Authentication middleware
function authenticate(request, response, next){
    if(!request.headers.authorization){
        return response.status(404).send('No token supplied')
    }
    if(request.headers.authorization.split(' ')[1]){
        var token = request.headers.authorization.split(' ')[1];
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