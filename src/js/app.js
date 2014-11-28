'use strict';

angular.module('grafico', [
        'ngRoute',
        'controllers',
        'graph.controller',
        'monitor.controller',
        'search.controller',
        'elasticjs.service'
    ])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'partials/main.html',
            controller: 'mainController'
        });
        $routeProvider.when('/graph', {
            templateUrl: 'partials/graph.html',
            controller: 'graphController'
        });
        $routeProvider.when('/monitor', {
            templateUrl: 'partials/monitor.html',
            controller: 'monitorController'
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });
    }]);

