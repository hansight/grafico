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

  module.controller('DashboardCtrl', function(
    $scope, $route, ejsResource, fields, dashboard, alertSrv, esVersion, kbnVersion) {

    $scope.Math = Math;

    $scope.editor = {
      index: 0
    };

    // For moving stuff around the dashboard.

    angular.element(window).bind('resize', function(){
      $scope.$broadcast('render');
    });

    $scope.init = function() {
      $scope.config = config;
      $scope.kbnVersion = kbnVersion;
      // Make stuff, including lodash available to views
      $scope._ = _;
      $scope.dashboard = dashboard;
      $scope.dashAlerts = alertSrv;
      $scope.esVersion = esVersion;

      // Clear existing alerts
      alertSrv.clearAll();

      // Provide a global list of all seen fields
      $scope.fields = fields;
      //$scope.reset_row();
      $scope.reset_panel();

      $scope.ejs = ejsResource(config.elasticsearch);
    };

    $scope.isPanel = function(obj) {
      if(!_.isNull(obj) && !_.isUndefined(obj) && !_.isUndefined(obj.type)) {
        return true;
      } else {
        return false;
      }
    };

    //$scope.add_row = function(dash,row) {
    //  dash.rows.push(row);
    //};
    //
    //$scope.reset_row = function() {
    //  $scope.row = {
    //    title: '',
    //    height: '150px',
    //    editable: true
    //  };
    //};
    //
    //$scope.row_style = function(row) {
    //  return { 'min-height': row.collapse ? '5px' : row.height };
    //};

    $scope.panel_path = function(type) {
      if(type) {
        return 'app/panels/'+type.replace(".","/");
      } else {
        return false;
      }
    };

    $scope.edit_path = function(type) {
      var p = $scope.panel_path(type);
      if(p) {
        return p+'/editor.html';
      } else {
        return false;
      }
    };

    $scope.pulldownTabStyle = function(i) {
      var classes = ['bgPrimary','bgSuccess','bgWarning','bgDanger','bgInverse','bgInfo'];
      i = i%classes.length;
      return classes[i];
    };

    $scope.setEditorTabs = function(panelMeta) {
      $scope.editorTabs = ['General','Panel'];
      if(!_.isUndefined(panelMeta) && !_.isUndefined(panelMeta.editorTabs)) {
        $scope.editorTabs =  _.union($scope.editorTabs,_.pluck(panelMeta.editorTabs,'title'));
      }
      return $scope.editorTabs;
    };

    // This is whoafully incomplete, but will do for now
    $scope.parse_error = function(data) {
      var _error = data.match("nested: (.*?);");
      return _.isNull(_error) ? data : _error[1];
    };

    $scope.edit_panel = function(panel) {
      var gridster = $(".gridster ul").data('gridster');
      var elem = $("#" + panel.id);

      gridster.resize_widget(elem, 12, 6);
      panel.editMode = true;

      return true;
    }

    $scope.reset_panel = function(type) {
      var
          defaultSpan = 4;

        $scope.panel = {
          error   : false,
          /** @scratch /panels/1
           * span:: A number, 1-12, that describes the width of the panel.
           */
          span    : defaultSpan,
          /** @scratch /panels/1
           * editable:: Enable or disable the edit button the the panel
           */
          editable: true,
          /** @scratch /panels/1
           * type:: The type of panel this object contains. Each panel type will require additional
           * properties. See the panel types list to the right.
           */
          type    : type,

          gridsterOptions: {size_x: 2, size_y: 2}
        };

        $scope.panel.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
          var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
        });
      };

    $scope.close_edit = function() {
      $scope.$broadcast('render');
    };

    $scope.add_panel = function(panel) {
      $scope.dashboard.current.panels.push(panel);
    };


    $scope.init();
  });
});
