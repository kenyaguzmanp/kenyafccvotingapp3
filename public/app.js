(function() {
    //building our module
    var app = angular.module('app', ['ngRoute', 'angular-jwt','ngTable', '720kb.socialshare', 'angularCSS']);

    app.run(function($http, $rootScope, $location, $window){

        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.localStorage.token;

        $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute){
            if(nextRoute.access !== undefined && nextRoute.access.restricted === true && !$window.localStorage.token){
                event.preventDefault();
                $location.path('/login');
            }
            if($window.localStorage.token && nextRoute.access.restricted === true){
                $http.post('/api/verify', {token: $window.localStorage.token})
                     .then(function(response){
                         console.log('Your token is valid');
                     }, function(err){
                         delete $window.localStorage.token;
                         $location.path('/login');
                     })
            }
        });
    });


    app.directive('customnavbar', function($location, $window) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},            
            templateUrl: './templates/customnavbar.html',
            controller: ['$scope', '$window', '$location', function CustomnavbarController($scope, $window, $location) {
                var vm = this;

                vm.profileButtons = true;
                
                $scope.logout = function (){
                    delete $window.localStorage.token;
                    $location.path('/login');
                }

              }]
            
          };
    });

    app.directive('customnavbar2', function($location, $window) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},            
            templateUrl: './templates/customnavbar2.html',
            controller: ['$scope', '$window', '$location', function Customnavbar2Controller($scope, $window, $location) {
                var vm = this;
                
                $scope.token = $window.localStorage.token;

              }]
          };
    });

    app.directive('loginregisterdiv', function($location, $window) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},            
            templateUrl: './templates/loginregisterdiv.html',
            css: './stylesheets/mainstyle.css'
          };
    });

    app.config(function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);

        //routes
        $routeProvider.when('/', {
            templateUrl: './templates/main.html',
            controller: 'MainController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/login', {
            templateUrl: './templates/login.html',
            controller: 'LoginController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/register', {
            templateUrl: './templates/register.html',
            controller: 'RegisterController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/polls', {
            templateUrl: './templates/polls.html',
            controller: 'PollsController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/polls/:id', {
            templateUrl: './templates/poll.html',
            controller: 'PollController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });

        $routeProvider.when('/profile', {
            templateUrl: './templates/profile.html',
            controller: 'ProfileController',
            controllerAs: 'vm',
            access: {
                restricted: true
            }
        });

        $routeProvider.otherwise('/');

    });

    //controllers
    app.controller('MainController', MainController);

    function MainController($location, $window, $http, NgTableParams, jwtHelper){
        var vm = this;
        vm.title = "Main";
        vm.polls = [];
        vm.poll = {
            options: [],
            name: '',
            userid: '',
            userName:''

        };
        vm.poll.options = [{
            name: '',
            votes: 0
        }];
        vm.tableData={};
        vm.pollsToTable=[];
        var pollToTable={
            idPoll: '',
            name: '',
            userid: '',
            userName: ''
        }
        
        vm.getAllPolls = function(){
            polls =[];
            $http.get('/api')
            .then(function(response){
                var dat = response.data;                
                vm.polls = dat.polls;
                vm.users = dat.users;                
                vm.tableData.polls = vm.polls;
                vm.tableData.users = vm.users;
                var pollTable=[];
                pollTable = vm.polls;
                    
                for(var d=0; d< vm.polls.length; d++){
                    for(var t=0; t< vm.users.length; t++){
                        if(vm.users[t]._id === vm.polls[d].user){
                            pollTable[d].userName = vm.users[t].name;                                
                        }                       
                    }
                }
                vm.tableParams = new NgTableParams({}, { dataset: pollTable});               
            }, function(err){
                console.log(err);
            })   
        }
                vm.getAllPolls()
        
        vm.goToThisPoll = function(thisPoll){             
            var id = thisPoll._id;
            vm.selectedPoll = thisPoll;
            $location.path("/polls/" + id);                      
        }
    }

    app.controller('LoginController', LoginController);

    function LoginController($location, $window, $http){
        var vm = this;
        vm.title = "Login";
        vm.error = '';
        vm.login = function(){
            if(vm.user){
               $http.post('/api/login', vm.user)
                    .then(function(response){
                        $window.localStorage.token = response.data;
                        $location.path('/profile');
                        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.localStorage.token;
                    }, function(err){
                        vm.error = err;
                    }) 
            }else{
                console.log('no credential suppield');
            }
        }
    }

    app.controller('RegisterController', RegisterController);

    function RegisterController($location, $window, $http, $scope){
        var vm = this;
        vm.title = "Register";
        vm.error= '';

        vm.register = function(){
            if(!vm.user){
                console.log("invalid user");
                return;
            }
            $http.post('/api/register', vm.user)
                 .then(function(response){
                     //storage on client side
                     $window.localStorage.token = response.data;
                     //redirect
                     $location.path('/profile');
                 }, function(err){
                     //vm.error = err.data.errmsg;
                     vm.error = "Sorry, this name is already taken";
                 });
                   
        }


    }

    app.controller('ProfileController', ProfileController);

    function ProfileController($location, $window, jwtHelper, $http){
        var vm = this;
        vm.title = "Profile";
        polls = [];
        vm.totalPolls;
        vm.user = null;
        var token = $window.localStorage.token;
        var payload = jwtHelper.decodeToken(token).data;
        if(payload){
            vm.user = payload;
        }
        var id = vm.user._id;
        
        vm.logOut = function(){
            console.log("logout");
            delete $window.localStorage.token;
            vm.user = null;
            $location.path('/login');
        }
        
        vm.myPolls = function(){
            $location.path('/polls');
        }


        vm.getAllPolls = function(){
            polls =[];
            $http.get('/api/polls')
                 .then(function(response){
                     var dat = response.data;
                     var cont= 0;
                     for(l=0; l< dat.length; l++){
                         if(dat[l].user === id){
                             cont++;
                            polls.push(dat[l]);
                         }
                     }
                     vm.polls = polls;
                     vm.totalPolls = vm.polls.length;
                 }, function(err){
                     console.log(err);
                 })   
        }
                vm.getAllPolls()

    }

    app.controller('PollsController', PollsController);

    function PollsController($location, $window, $http, jwtHelper, $scope){
        var vm = this;
        vm.title = "Polls";
        if($window.localStorage.token){
            var user = jwtHelper.decodeToken($window.localStorage.token);
            vm.userName = user.data.name
            var id = user.data._id;
            polls = [];
            vm.poll = {
                options: [],
                name: '',
                user: id
            };
            vm.poll.options = [{
                name: '',
                votes: 0
            }];
            vm.addOption =  function (){
                vm.poll.options.push({
                    name: '',
                    votes: 0
                });
            }

            vm.createMyPoll = function(){
                vm.create = true;
            }

            vm.logOut = function(){
                delete $window.localStorage.token;
                vm.user = null;
                $location.path('/login');
            }
    
            vm.getAllPolls = function(){
                polls =[];
                $http.get('/api/polls')
                     .then(function(response){
                         var dat = response.data;
                         var cont= 0;
                         for(l=0; l< dat.length; l++){
                             if(dat[l].user === id){
                                 cont++;
                                polls.push(dat[l]);
                             }
                         }
                         vm.polls = polls;
                     }, function(err){
                         console.log(err);
                     })   
            }
                    vm.getAllPolls()
    
            vm.addPoll = function(){            
                vm.create = false;
                if(!vm.poll){
                    console.log('Invalid data suplied');
                    return;
                }
                vm.poll.user = id;
                $http.post('/api/polls', vm.poll)
                     .then(function(response){
                         vm.poll = {};
                         vm.poll.options = [{
                            name: '',
                            votes: 0
                        }];
                         vm.getAllPolls();
                     }, function(err){
                         vm.poll = {};
                        console.log(err);
                     })
            }
    
            vm.goToThisPoll = function(thisPoll){             
                var id = thisPoll._id;
                vm.selectedPoll = thisPoll;
                $location.path("/polls/" + id);                      
            }
    
            vm.deleteThisPoll = function(thisPoll){
                if(confirm("Are you sure you want to delete this Poll?")){
                    vm.pollToDelete = thisPoll;
                    vm.pollToDelete.toDelete = true;                  
                    $http.post('/api/polls', vm.pollToDelete)
                        .then(function(response){
                            vm.poll = {};
                            vm.poll.options = [{
                               name: '',
                               votes: 0
                           }];
                            vm.getAllPolls();
                        }, function(err){
                            vm.poll = {};
                        console.log(err);
                    }) 
                }  
            }
        }
        else{
            $location.path('/login');
        }    
    }

    app.controller('PollController', PollController);

    function PollController($location, $window, $http, jwtHelper, $scope){
        var vm = this;
        vm.title = "Poll";
        vm.thisPollId = $location.path().slice(7);
        vm.voted = false;
        vm.otherOps = false;
        $http.get('/api/polls/' + vm.thisPollId)
            .then(function(response){
                vm.thisPollIs = response.data[0];
                vm.shareText = "Check out my new poll: '" + vm.thisPollIs.name + "'";
                $scope.url = 'https://kenyafccvotingapp2.herokuapp.com/polls/'+ vm.thisPollIs._id;
                vm.showTheChart();
            }, function(err){
                console.log(err);
            })

        vm.voteForThis = function(){
            if($window.localStorage.token){
                for(var j=0; j<vm.thisPollIs.options.length; j++){
                    if(vm.thisPollIs.options[j].name === $scope.selectedOption && vm.voted === false){
                        vm.thisPollIs.options[j].votes +=1;
                        vm.voted = "true";
                    }
                }
            }else{
                if(confirm("You need to be logged if you want to vote")){
                    $location.path('/login');
                }
            }
            
            
            $http.post('/api/polls/' + vm.thisPollId, vm.thisPollIs)
                .then(function(response){
                    //$window.localStorage.token = response.data;
                    //vm.thisPollIs = {};
                    //vm.getAllPolls();
                }, function(err){
                    //vm.poll = {};
                console.log(err);
                }) 
            vm.showTheChart();
        }
        
        vm.showTheChart = function(){
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart);
            var data =[['Option', 'Votes']];
            function drawChart() {
                for(var k=0; k<vm.thisPollIs.options.length; k++){
                    data[k+1] = [vm.thisPollIs.options[k].name, vm.thisPollIs.options[k].votes];
                }
            data = google.visualization.arrayToDataTable(data);        


            var options = {
                title: vm.thisPollIs.name
            };
                
            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
                
                chart.draw(data, options);
            }

        }
       

        vm.addOtherOptions = function (){
            console.log("añadir oras opciones");
            vm.otherOps = true;
        }

        vm.myPolls = function(){
            $location.path('/polls');
        }
        
        vm.addOptionToThisPoll = function(optionName){
            vm.newOption = {
                name: optionName,
                votes: 0
            };
            vm.addInput = true;
            vm.thisPollIs.options.push(vm.newOption);
 
            $http.post('/api/polls/' + vm.thisPollId, vm.thisPollIs)
                 .then(function(response){
                        
                  }, function(err){
                        
                    console.log(err);
                 })     
        }
        
        vm.logOut = function(){
            delete $window.localStorage.token;
            vm.user = null;
            $location.path('/login');
        }

    }

}())