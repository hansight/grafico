'use strict';

angular.module('search.controller', [])
    .controller('searchController', function($scope, ejsResource) {
        // var ejs = ejsResource('http://localhost:9200');
        var ejs = ejsResource({
            server: 'http://localhost:9200',
            headers: {
                'Access-Control-Request-Headers': 'accept, origin, authorization',
                'contentType': 'application/json; charset=UTF-8'
            }
        });
        var oQuery = ejs.QueryStringQuery().defaultField('Title');
        var client = ejs.Request()
            .indices('logstash-2014.10.08')
            .types('host');

        $scope.search = function() {
            $scope.results = client
                .query(oQuery.query($scope.queryTerm || '*'))
                .doSearch();
        };
    });