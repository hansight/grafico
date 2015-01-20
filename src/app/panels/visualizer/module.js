/** @scratch /panels/5
 *
 * include::panels/text.asciidoc[]
 */

/** @scratch /panels/text/0
 * == text
 * Status: *Stable*
 *
 * The text panel is used for displaying static text formated as markdown, sanitized html or as plain
 * text.
 *
 */
define([
  'angular',
  'app',
  'lodash',
  'require'
],
function (angular, app, _, require) {
  'use strict';

  var module = angular.module('kibana.panels.visualizer', []);
  app.useModule(module);

  module.controller('visualizer', function($rootScope, $scope, $modal, $q, $compile, $timeout,
                                           fields, querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      status  : "Stable",
      description : "A static text panel that can use plain text, markdown, or (sanitized) HTML"
    };

    // Set and populate defaults
    var _d = {
      fields: [],
      xAxis:  [],
      yAxis:  []
    };
    _.defaults($scope.panel,_d);

    $scope.init = function() {
      $scope.fields = fields.list;

      $scope.list1 = [];
      $scope.list2 = [];
      $scope.list3 = [];
      $scope.list4 = [];

      $scope.list5 = [
        { 'title': 'Item 1', 'drag': true },
        { 'title': 'Item 2', 'drag': true },
        { 'title': 'Item 3', 'drag': true },
        { 'title': 'Item 4', 'drag': true },
        { 'title': 'Item 5', 'drag': true },
        { 'title': 'Item 6', 'drag': true },
        { 'title': 'Item 7', 'drag': true },
        { 'title': 'Item 8', 'drag': true }
      ];
    };



    // Limit items to be dropped in list1
    $scope.optionsList1 = {
      accept: function(dragEl) {
        if ($scope.list1.length >= 2) {
          return false;
        } else {
          return true;
        }
      }
    };
  });


});