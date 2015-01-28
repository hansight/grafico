define([
  'angular',
  'jquery',
  'kbn',
  'lodash',
  'config',
  'moment',
  'modernizr',
  'filesaver',
  'blob'
],
function (angular, $, kbn, _, config, moment, Modernizr) {
  'use strict';

  var module = angular.module('kibana.services');

  module.service('dashboard', function(
    $routeParams, $http, $rootScope, $injector, $location, $timeout,
    ejsResource, timer, kbnIndex, alertSvc, datasources
  ) {
    // A hash of defaults to use when loading a dashboard

    var _default = {
      title: "GRAFICO DEFAULT",
      style: "light",
      editable: true,

      sources: [],
      panels: []
    };


    // Store a reference to this
    var self = this;
    var filterSrv, querySrv, datasource;

    this.state = _.clone(_default);
    this.panelTypes = [];

    $rootScope.$on('$routeChangeSuccess', function () {
      // Clear the current dashboard to prevent reloading
      if ($location.path() === '/connectionFailed') { return; }
      self.state = {};
      self.indices = [];

      route();
    });

    var route = function() {
      // Is there a dashboard type and id in the URL?
      if(!(_.isUndefined($routeParams.kbnType)) && !(_.isUndefined($routeParams.kbnId))) {
        var _type = $routeParams.kbnType;
        var _id = $routeParams.kbnId;

        switch(_type) {
        case ('file'):
          self.file_load(_id);
          break;
        default:
          $location.path(config.default_route);
        }
      // No dashboard in the URL
      } else {
        $location.path(config.default_route);
      }
    };

    // Since the dashboard is responsible for index computation, we can compute and assign the indices
    // here before telling the panels to refresh
    this.refresh = function() {
      //if(self.state.index.interval !== 'none') {
      //  if(_.isUndefined(filterSrv)) {
      //    return;
      //  }
      //  if(filterSrv.idsByType('time').length > 0) {
      //    var _range = filterSrv.timeRange('last');
      //    kbnIndex.indices(_range.from,_range.to,
      //      self.state.index.pattern,self.state.index.interval
      //    ).then(function (p) {
      //      if(p.length > 0) {
      //        self.indices = p;
      //      } else {
      //        // Option to not failover
      //        if(self.state.failover) {
      //          self.indices = [self.state.index.default];
      //        } else {
      //          // Do not issue refresh if no indices match. This should be removed when panels
      //          // properly understand when no indices are present
      //          alertSvc.set('No results','There were no results because no indices were found that match your'+
      //            ' selected time span','info',5000);
      //          return false;
      //        }
      //      }
      //      // Don't resolve queries until indices are updated
      //      querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
      //    });
      //  } else {
      //    if(self.state.failover) {
      //      self.indices = [self.state.index.default];
      //      querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
      //    } else {
      //      alertSvc.set("No time filter",
      //        'Timestamped indices are configured without a failover. Waiting for time filter.',
      //        'info',5000);
      //    }
      //  }
      //} else {
      //  self.indices = [self.state.index.default];
      //  querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
      //}
    };

    var setDefaults = function(dashboard) {
      _.defaults(dashboard, _default);
      _.defaults(dashboard.index, _default.index);
      _.defaults(dashboard.loader, _default.loader);
      return _.cloneDeep(dashboard);
    };

    this.loadDashboard = function(dashboard) {
      // Cancel all timers
      timer.cancel_all();

      // Make sure the dashboard being loaded has everything required
      dashboard = setDefaults(dashboard);

      // Set the current dashboar
      self.state = _.clone(dashboard);

      //// If not using time based indices, use the default index
      //if(dashboard.index.interval === 'none') {
      //  self.indices = [dashboard.index.default];
      //}

      // Delay this until we're sure that querySrv and filterSrv are ready
      $timeout(function() {
        //// Ok, now that we've setup the state dashboard, we can inject our services
        //if(!_.isUndefined(self.state.services.query)) {
        //  querySrv = $injector.get('querySrv');
        //  querySrv.init();
        //}
        //if(!_.isUndefined(self.state.services.filter)) {
        //  filterSrv = $injector.get('filterSrv');
        //  filterSrv.init();
        //}
        //TODO remove this
        if(!_.isUndefined(self.state.sources)) {
            datasources.sources = _.union(self.state.sources, datasources.sources);

            self.state.sources = undefined;
        }
      },0).then(function() {
        // Call refresh to calculate the indices and notify the panels that we're ready to roll
        self.refresh();
      });

      if(dashboard.refresh) {
        self.set_interval(dashboard.refresh);
      }

      // Set the available panels for the "Add Panel" drop down
      self.panelTypes = config.panel_types;

      //// Take out any that we're not allowed to add from the gui.
      //self.panelTypes = _.difference(self.panelTypes, config.hidden_panels);

      return true;
    };

    this.to_file = function() {
        //TODO temporary code to save data source to develoment
        self.state.sources = datasources.sources;
      var blob = new Blob([angular.toJson(self.state,true)], {type: "application/json;charset=utf-8"});
      // from filesaver.js
      window.saveAs(blob, self.state.title+"-"+new Date().getTime());
      return true;
    };

    var render_template = function(json,params) {
      var _r;
      _.templateSettings = {interpolate : /\{\{(.+?)\}\}/g};
      var template = _.template(json);
      var rendered = template({ARGS:params});
      try {
        _r = angular.fromJson(rendered);
      } catch(e) {
        _r = false;
      }
      return _r;
    };

    this.file_load = function(file) {
      return $http({
        url: "app/dashboards/"+file.replace(/\.(?!json)/,"/")+'?' + new Date().getTime(),
        method: "GET",
        transformResponse: function(response) {
          return render_template(response,$routeParams);
        }
      }).then(function(result) {
        if(!result) {
          return false;
        }
        self.loadDashboard(setDefaults(result.data));
        return true;
      },function() {
        alertSvc.set('Error',"Could not load <i>dashboards/"+file+"</i>. Please make sure it exists" ,'error');
        return false;
      });
    };

    this.formatDate = function(date, format) {
      format = format || 'YYYY-MM-DD HH:mm:ss';

      return this.timezone === 'browser' ?
          moment(date).format(format) :
          moment.utc(date).format(format);
    };

    this.start_scheduled_refresh = function (after_ms) {
      timer.cancel(self.refresh_timer);
      self.refresh_timer = timer.register($timeout(function () {
        self.start_scheduled_refresh(after_ms);
        self.refresh();
      }, after_ms));
    };

    this.cancel_scheduled_refresh = function () {
      timer.cancel(self.refresh_timer);
    };

    this.set_interval = function (interval) {
      //self.state.refresh = interval;
      //if (interval) {
      //  var _i = kbn.interval_to_ms(interval);
      //  this.start_scheduled_refresh(_i);
      //} else {
      //  this.cancel_scheduled_refresh();
      //}
    };

  });

});
