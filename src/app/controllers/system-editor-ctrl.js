define([
        'angular',
        'config',
        'lodash',
        'services/all',
        'jquery.gridster'
    ],
    function (angular, config, _) {
        "use strict";

        var module = angular.module('kibana.controllers');

        module.controller('SystemEditorCtrl', function($scope, $injector) {

            $scope.editor = {
                index: 0
            };

            $scope.init = function() {
                //$scope.types = datasources.types;
                //
                //$scope.sources = datasources.sources;
                //
                //
                $scope.selectedDatasource = $scope.datasources.sources.length > 0? $scope.datasources.sources[0] : undefined;
            };

            //$scope.close_edit = function() {
            //    $scope.$broadcast('render');
            //};
            //
            //$scope.datasource_path = function(type) {
            //    if(type) {
            //        return 'app/datasources/'+type.replace(".","/");
            //    } else {
            //        return false;
            //    }
            //};
            //
            //$scope.edit_path = function(type) {
            //    var p = $scope.datasource_path(type);
            //    if(p) {
            //        return p + '/editor.html';
            //    } else {
            //        return false;
            //    }
            //};

            $scope.addSource = function(type) {
                $scope.require(['datasources/' + type +'/module'], function () {
                    var factory = $injector.get(type);

                    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
                        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                        return v.toString(16);
                    });
                    var name = type + ' #' + $scope.datasources.sources.length;

                    var ds = factory.create(id, name);

                    $scope.datasources.sources.push(ds);
                    $scope.selectedDatasource = ds;
                });
            }

            //$scope.select = function(id) {
            //    $scope.selected = id;
            //}

            $scope.removeSelected = function() {
                var sources = $scope.datasources.sources;

                var i = sources.indexOf($scope.selectedDatasource);
                if(i != -1) {
                    sources.splice(i, 1);

                    $scope.selectedDatasource = sources.length > i? sources[i] : (sources.length > i-1?  sources[i-1]: undefined);
                }
            }

            $scope.init();
        });
    });
