(function() {
    //building our module
    var app = angular.module('app', ['ngRoute', 'angular-jwt','ngTable', '720kb.socialshare']);

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
                console.log("inside the customnavbar controller");
                console.log("ocal storage ", $location.path());

                vm.profileButtons = true;
                
                vm.ex = "example";
                $scope.logout = function (){
                    console.log("has dado click en logout");
                    delete $window.localStorage.token;
                    $location.path('/login');
                }

              }]
            
            /*            
            link: function($scope, element, attrs) {
                $scope.logout= function() {
                    console.log('inside click logout');
                    delete $window.localStorage.token;
                    $location.path('/login');
                }
            }*/
          };
    });

    app.directive('customnavbar2', function($location, $window) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {},            
            templateUrl: './templates/customnavbar2.html'
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
        console.log('in main controller');
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
                console.log("dat ", dat[0]);
                
                vm.polls = dat.polls;
                vm.users = dat.users;

                
                vm.tableData.polls = vm.polls;
                vm.tableData.users = vm.users;
                var pollTable=[];
                pollTable = vm.polls;
                //pollTable[0].userName = 'Bruno';
                    
                for(var d=0; d< vm.polls.length; d++){
                    //console.log("poll ", vm.polls[d].name);
                    for(var t=0; t< vm.users.length; t++){
                        //console.log("usuario: " + vm.users[t].name);
                        if(vm.users[t]._id === vm.polls[d].user){
                            //console.log("el ususario: " + vm.users[t].name + "tiene el poll " + vm.polls[d].name + "en el indice: "+ d);
                            pollTable[d].userName = vm.users[t].name;
                                
                        }
                       
                    }
                }

                //console.log("vm.pollsTable ", pollTable);
                
                vm.tableParams = new NgTableParams({}, { dataset: pollTable});
                //console.log("vm.tableParams ", vm.tableParams);                
            }, function(err){
                console.log("error en el get");
                console.log(err);
            })   
        }
                vm.getAllPolls()
        
        vm.goToThisPoll = function(thisPoll){             
            console.log("the poll you selected: " , thisPoll);
            var id = thisPoll._id;
            console.log("id " + id);
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
                     console.log("error: ", err); 
                 });
                   
        }


    }

    app.controller('ProfileController', ProfileController);

    function ProfileController($location, $window, jwtHelper){
        var vm = this;
        vm.title = "Profile";
        console.log("en controller de profile");

        vm.user = null;
        var token = $window.localStorage.token;
        var payload = jwtHelper.decodeToken(token).data;
        if(payload){
            vm.user = payload;
        }
        
        vm.logOut = function(){
            console.log("logout");
            delete $window.localStorage.token;
            vm.user = null;
            $location.path('/login');
        }
        
        vm.myPolls = function(){
            console.log('Dentro de ProfileController.vm.myPolls')
            $location.path('/polls');
        }
    }

    app.controller('PollsController', PollsController);

    function PollsController($location, $window, $http, jwtHelper, $scope){
        var vm = this;
        vm.title = "Polls";
        if($window.localStorage.token){
            var user = jwtHelper.decodeToken($window.localStorage.token);
            vm.userName = user.data.name
            console.log("user is ", vm.userName);
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
                console.log("vas a crear un poll");
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
                         //console.log("data "  +dat);
                         for(l=0; l< dat.length; l++){
                             if(dat[l].user === id){
                                 cont++;
                                polls.push(dat[l]);
                             }
                         }
                         //console.log("el id del usuario" , user);
                         console.log("los polls del ususario son: ", polls);
                         //vm.polls = response.data;
                         vm.polls = polls;
                     }, function(err){
                         console.log("error en el get");
                         console.log(err);
                     })   
            }
                    vm.getAllPolls()
    
            vm.addPoll = function(){
                
                vm.create = false;
                console.log("en add new poll");
                if(!vm.poll){
                    console.log('Invalid data suplied');
                    return;
                }
                vm.poll.user = id;
                $http.post('/api/polls', vm.poll)
                     .then(function(response){
                         vm.poll = {};
                         //vm.poll.options = [];
                         vm.poll.options = [{
                            name: '',
                            votes: 0
                        }];
                         console.log("EN POST NEW POLL");
                         vm.getAllPolls();
                     }, function(err){
                         vm.poll = {};
                        console.log(err);
                     })
                     console.log("el poll creado ", vm.poll);
                      
                     console.log("los polls del ususario son: ", vm.polls); 
            }
    
            vm.goToThisPoll = function(thisPoll){             
                console.log("the poll you selected: " , thisPoll);
                var id = thisPoll._id;
                console.log("id " + id);
                vm.selectedPoll = thisPoll;
                $location.path("/polls/" + id);                      
            }
    
            vm.deleteThisPoll = function(thisPoll){
                if(confirm("Are you sure you want to delete this Poll?")){
                    console.log("you want to delete this: " , thisPoll);
                    vm.pollToDelete = thisPoll;
                    vm.pollToDelete.toDelete = true;                  
                    $http.post('/api/polls', vm.pollToDelete)
                        .then(function(response){
                            vm.poll = {};
                            //vm.poll.options = [];
                            vm.poll.options = [{
                               name: '',
                               votes: 0
                           }];
                            vm.getAllPolls();
                        }, function(err){
                            vm.poll = {};
                        console.log(err);
                    }) 
                    
                   //vm.getAllPolls()
    
                }  

            }
        }//fin de si es usuario
        else{
            console.log("no es usuario");
            $location.path('/login');
        }
        

    }//fin del controlador de polls

    app.controller('PollController', PollController);

    function PollController($location, $window, $http, jwtHelper, $scope){
        var vm = this;
        vm.title = "Poll";
        vm.thisPollId = $location.path().slice(7);
        vm.voted = false;
        vm.otherOps = false;
        //console.log("usuario: ", vm.userName);
        

        console.log("Entro al controlador del POll");
        console.log("vm.thisPollId " + vm.thisPollId);
        //console.log("con este usuario ", user);
        
        $http.get('/api/polls/' + vm.thisPollId)
            .then(function(response){
                console.log("response del poll en general ", response);
                console.log("data del poll: ", response.data[0]);
                vm.thisPollIs = response.data[0];
                vm.shareText = "Check out my new poll: '" + vm.thisPollIs.name + "'";
                $scope.url = 'https://kenyafccvotingapp-kenyaguzmanp.c9users.io/polls/'+ vm.thisPollIs._id;
                console.log("usuario en el get del poll " , vm.thisPollIs.user);
                vm.showTheChart();
            }, function(err){
                console.log(err);
            })

        
             
            console.log('vm.thispollis ' , vm.thisPollIs);  
        vm.voteForThis = function(){
            console.log('you voted for: ' + $scope.selectedOption);
            //console.log("esta autorizado para votar? ", id);
            if($window.localStorage.token){
                console.log("puede votar");
                for(var j=0; j<vm.thisPollIs.options.length; j++){
                    if(vm.thisPollIs.options[j].name === $scope.selectedOption && vm.voted === false){
                        console.log("indice donde esta la opcion seleccionada es " + j);
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
       // vm.showTheChart();

        vm.addOtherOptions = function (){
            console.log("añadir oras opciones");
            vm.otherOps = true;
        }

        vm.myPolls = function(){
            $location.path('/polls');
        }
        
        vm.addOptionToThisPoll = function(optionName){
            console.log("quieres agregar otra opcion: ", optionName);
            console.log("quieres modificar el poll ", vm.thisPollId);
            console.log("con la info que es: ", vm.thisPollIs);
            vm.newOption = {
                name: optionName,
                votes: 0
            };
            vm.addInput = true;
            console.log("new option: ", vm.newOption);
            vm.thisPollIs.options.push(vm.newOption);
                
            console.log("ahora el nuevo poll es ", vm.thisPollIs);
            console.log("a ver ID", vm.thisPollId);
            $http.post('/api/polls/' + vm.thisPollId, vm.thisPollIs)
                 .then(function(response){
                        console.log("response del post de addOption", response);
                        //$window.localStorage.token = response.data;
                        //vm.thisPollIs = {};
                        //vm.getAllPolls();
                  }, function(err){
                        //vm.poll = {};
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