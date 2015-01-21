'use strict';

angular.module('graph.controller', [
        'controllers'
    ])
    .constant("defaultDataUrl", "/multivariate.csv")
    .controller('graphController', function($scope, $rootScope, $http, defaultDataUrl) {
        // init
        $scope.data = [];
        $scope.error = false;
        $scope.loading = true;

        if (!$rootScope.metadata.length) {
            $http.get(defaultDataUrl)
                .success(function(data) {
                    // lint! here metadata cannot be automatically released when checkout to other tabs
                    // so, it grows larger and larger
                    $rootScope.metadata = data;
                    console.log($rootScope.metadata.length);
                })
                .error(function(error) {
                    $scope.error = error;
                    console.log(error);
                });
        }
        // parse

    });