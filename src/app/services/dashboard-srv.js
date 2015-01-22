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
    ejsResource, timer, kbnIndex, alertSrv, esVersion, esMinVersion
  ) {
    // A hash of defaults to use when loading a dashboard

    var _dash = {
      title: "",
      style: "light",
      editable: true,
      failover: false,
      panel_hints: true,
      rows: [],
      pulldowns: [

      ],
      nav: [
        {
          type: 'timepicker'
        }
      ],
      services: {},
      loader: {
        save_local: true,
        save_temp: true,
        save_temp_ttl_enable: true,
        save_temp_ttl: '30d',
        hide: false
      },
      index: {
        interval: 'none',
        pattern: '_all',
        default: 'INDEX_MISSING',
        warm_fields: true
      },
      refresh: false,

      panels: []
    };

    // An elasticJS client to use
    var ejs = ejsResource(config.elasticsearch);

    // Store a reference to this
    var self = this;
    var filterSrv,querySrv;

    this.current = _.clone(_dash);
    this.last = {};
    this.availablePanels = [];

    $rootScope.$on('$routeChangeSuccess', function () {
      // Clear the current dashboard to prevent reloading
      if ($location.path() === '/connectionFailed') { return; }
      self.current = {};
      self.indices = [];
      esVersion.isMinimum().then(function(isMinimum) {
        if(_.isUndefined(isMinimum)) {
          return;
        }
        if(isMinimum) {
          route();
        } else {
          alertSrv.set('Upgrade Required',"Your version of Elasticsearch is too old. Kibana requires" +
            " Elasticsearch " + esMinVersion + " or above.", "error");
        }
      });
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
        case('script'):
          self.script_load(_id);
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
      if(self.current.index.interval !== 'none') {
        if(_.isUndefined(filterSrv)) {
          return;
        }
        if(filterSrv.idsByType('time').length > 0) {
          var _range = filterSrv.timeRange('last');
          kbnIndex.indices(_range.from,_range.to,
            self.current.index.pattern,self.current.index.interval
          ).then(function (p) {
            if(p.length > 0) {
              self.indices = p;
            } else {
              // Option to not failover
              if(self.current.failover) {
                self.indices = [self.current.index.default];
              } else {
                // Do not issue refresh if no indices match. This should be removed when panels
                // properly understand when no indices are present
                alertSrv.set('No results','There were no results because no indices were found that match your'+
                  ' selected time span','info',5000);
                return false;
              }
            }
            // Don't resolve queries until indices are updated
            querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
          });
        } else {
          if(self.current.failover) {
            self.indices = [self.current.index.default];
            querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
          } else {
            alertSrv.set("No time filter",
              'Timestamped indices are configured without a failover. Waiting for time filter.',
              'info',5000);
          }
        }
      } else {
        self.indices = [self.current.index.default];
        querySrv.resolve().then(function(){$rootScope.$broadcast('refresh');});
      }
    };

    var dash_defaults = function(dashboard) {
      _.defaults(dashboard,_dash);
      _.defaults(dashboard.index,_dash.index);
      _.defaults(dashboard.loader,_dash.loader);
      return _.cloneDeep(dashboard);
    };

    this.dash_load = function(dashboard) {
      // Cancel all timers
      timer.cancel_all();

      // Make sure the dashboard being loaded has everything required
      dashboard = dash_defaults(dashboard);

      // If not using time based indices, use the default index
      if(dashboard.index.interval === 'none') {
        self.indices = [dashboard.index.default];
      }

      // Set the current dashboard
      self.current = _.clone(dashboard);

      // Delay this until we're sure that querySrv and filterSrv are ready
      $timeout(function() {
        // Ok, now that we've setup the current dashboard, we can inject our services
        if(!_.isUndefined(self.current.services.query)) {
          querySrv = $injector.get('querySrv');
          querySrv.init();
        }
        if(!_.isUndefined(self.current.services.filter)) {
          filterSrv = $injector.get('filterSrv');
          filterSrv.init();
        }
      },0).then(function() {
        // Call refresh to calculate the indices and notify the panels that we're ready to roll
        self.refresh();
      });

      if(dashboard.refresh) {
        self.set_interval(dashboard.refresh);
      }

      // Set the available panels for the "Add Panel" drop down
      self.availablePanels = _.difference(config.panel_names,
        _.pluck(_.union(self.current.nav,self.current.pulldowns),'type'));

      // Take out any that we're not allowed to add from the gui.
      self.availablePanels = _.difference(self.availablePanels,config.hidden_panels);

      return true;
    };




    this.to_file = function() {
      var blob = new Blob([angular.toJson(self.current,true)], {type: "application/json;charset=utf-8"});
      // from filesaver.js
      window.saveAs(blob, self.current.title+"-"+new Date().getTime());
      return true;
    };

    this.set_default = function(route) {
      return false;
    };

    this.purge_default = function() {
      return false;
    };

    // TOFIX: Pretty sure this breaks when you're on a saved dashboard already
    this.share_link = function(title,type,id) {
      return {
        location  : window.location.href.substr(0, window.location.href.indexOf('#')),
        type      : type,
        id        : id,
        link      : window.location.href.substr(0, window.location.href.indexOf('#'))+"#dashboard/"+type+"/"+encodeURIComponent(id),
        title     : title
      };
    };

    var renderTemplate = function(json,params) {
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
          return renderTemplate(response,$routeParams);
        }
      }).then(function(result) {
        if(!result) {
          return false;
        }
        self.dash_load(dash_defaults(result.data));
        return true;
      },function() {
        alertSrv.set('Error',"Could not load <i>dashboards/"+file+"</i>. Please make sure it exists" ,'error');
        return false;
      });
    };

    this.script_load = function(file) {
      return $http({
        url: "app/dashboards/"+file.replace(/\.(?!js)/,"/"),
        method: "GET",
        transformResponse: function(response) {
          /*jshint -W054 */
          var _f = new Function('ARGS','kbn','_','moment','window','document','angular','require','define','$','jQuery',response);
          return _f($routeParams,kbn,_,moment);
        }
      }).then(function(result) {
        if(!result) {
          return false;
        }
        self.dash_load(dash_defaults(result.data));
        return true;
      },function() {
        alertSrv.set('Error',
          "Could not load <i>scripts/"+file+"</i>. Please make sure it exists and returns a valid dashboard" ,
          'error');
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
      self.current.refresh = interval;
      if (interval) {
        var _i = kbn.interval_to_ms(interval);
        this.start_scheduled_refresh(_i);
      } else {
        this.cancel_scheduled_refresh();
      }
    };


  });

});
