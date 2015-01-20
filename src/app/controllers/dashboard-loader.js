define([
        'angular',
        'lodash'
    ],
    function (angular, _) {
        'use strict';

        var module = angular.module('kibana.controllers');

        module.controller('dashLoader', function($scope, $http, timer, dashboard, alertSrv, $location) {
            $scope.loader = dashboard.current.loader;

            $scope.init = function() {
            };

            $scope.showDropdown = function(type) {
                if(_.isUndefined(dashboard.current.loader)) {
                    return true;
                }

                var _l = dashboard.current.loader;

                if(type === 'save') {
                    return (_l.save_local);
                }
            };


        });

    });
