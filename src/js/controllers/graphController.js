'use strict';

angular.module('graph.controller', [])
    .constant("defaultDataUrl", "/data.csv")
    .controller('graphController', function($scope, $http, defaultDataUrl) {
        // init
        $http.get(defaultDataUrl)
            .success(function(data) {
                $scope.metadata = data;
                console.log($scope.metadata.length);
            })
            .error(function(error) {
                $scope.error = error;
                console.log(error);
            });

        // parse

    });