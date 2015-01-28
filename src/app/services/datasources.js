define([
    'angular',
    'lodash',
    'config',
    'kbn'
], function (angular, _, config, kbn) {
    'use strict';

    var module = angular.module('kibana.services');

    module.service('datasources', function(ejsResource, $rootScope, $timeout) {

        // Save a reference to this
        var self = this;
        this.sources = [];


        // Call this whenever we need to reload the important stuff
        this.init = function() {
            self.types = config.datasource_types;

        };


        self.init();
    });

});
