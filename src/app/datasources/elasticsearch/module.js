define([
        'angular',
        'app',
        'lodash',
        'require',
        'moment'
    ],
function (angular, app, _, require, moment) {
    'use strict';

    var module = angular.module('kibana.panels.visualizer', []);
    app.useModule(module);

    module.factory('elasticsearch', function($http, alertSvc, ejsResource) {
        var factory = {};

        factory.create = function(id, name) {
            var ds = {
                id: id,
                name: name,
                type: 'elasticsearch',

                address: 'http://localhost:9200',

                // default settings
                index: {
                    interval: 'day',
                    pattern: '[logs_]YYYYMMDD',
                    type: '*'
                },

                time_options  : ['5m','15m','1h','6h','12h','24h','2d','7d','30d','60d','90d','365d'],
                refresh_intervals : ['Off', '5s','10s','30s','1m','5m','15m','30m','1h','2h','1d'],
                refresh_interval: '1m',

                timefield     : '@timestamp',

                daterange : {
                    startDate: moment().subtract(1, 'day'),
                    endDate: moment()
                }
            };

            ds.indices = [];
            ds.possible = [];

            ds.set_interval = function(interval) {
                this.refresh_interval = interval;
            }

            ds.get_interval = function() {
                return this.refresh_interval;
            }

            /* This is a simplified version of elasticsearch's date parser */
            ds.parseDate = function(text) {
                if(_.isDate(text)) {
                    return text;
                }
                var time,
                    mathString = "",
                    index,
                    parseString;
                if (text.substring(0,3) === "now") {
                    time = new Date();
                    mathString = text.substring("now".length);
                } else {
                    index = text.indexOf("||");

                    if (index === -1) {
                        parseString = text;
                        mathString = ""; // nothing else
                    } else {
                        parseString = text.substring(0, index);
                        mathString = text.substring(index + 2);
                    }
                    // We're going to just require ISO8601 timestamps, k?
                    time = new Date(parseString);
                }

                if (!mathString.length) {
                    return time;
                }

                //return [time,parseString,mathString];
                return ds.parseDateMath(mathString, time);
            };

            ds.parseDateMath = function(mathString, time, roundUp) {
                var dateTime = moment(time);
                for (var i = 0; i < mathString.length; ) {
                    var c = mathString.charAt(i++),
                        type,
                        num,
                        unit;
                    if (c === '/') {
                        type = 0;
                    } else if (c === '+') {
                        type = 1;
                    } else if (c === '-') {
                        type = 2;
                    } else {
                        return false;
                    }

                    if (isNaN(mathString.charAt(i))) {
                        num = 1;
                    } else {
                        var numFrom = i;
                        while (!isNaN(mathString.charAt(i))) {
                            i++;
                        }
                        num = parseInt(mathString.substring(numFrom, i),10);
                    }
                    if (type === 0) {
                        // rounding is only allowed on whole numbers
                        if (num !== 1) {
                            return false;
                        }
                    }
                    unit = mathString.charAt(i++);
                    switch (unit) {
                        case 'y':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('year') : dateTime.startOf('year');
                            } else if (type === 1) {
                                dateTime.add('years',num);
                            } else if (type === 2) {
                                dateTime.subtract('years',num);
                            }
                            break;
                        case 'M':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('month') : dateTime.startOf('month');
                            } else if (type === 1) {
                                dateTime.add('months',num);
                            } else if (type === 2) {
                                dateTime.subtract('months',num);
                            }
                            break;
                        case 'w':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('week') : dateTime.startOf('week');
                            } else if (type === 1) {
                                dateTime.add('weeks',num);
                            } else if (type === 2) {
                                dateTime.subtract('weeks',num);
                            }
                            break;
                        case 'd':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('day') : dateTime.startOf('day');
                            } else if (type === 1) {
                                dateTime.add('days',num);
                            } else if (type === 2) {
                                dateTime.subtract('days',num);
                            }
                            break;
                        case 'h':
                        case 'H':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('hour') : dateTime.startOf('hour');
                            } else if (type === 1) {
                                dateTime.add('hours',num);
                            } else if (type === 2) {
                                dateTime.subtract('hours',num);
                            }
                            break;
                        case 'm':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('minute') : dateTime.startOf('minute');
                            } else if (type === 1) {
                                dateTime.add('minutes',num);
                            } else if (type === 2) {
                                dateTime.subtract('minutes',num);
                            }
                            break;
                        case 's':
                            if (type === 0) {
                                roundUp ? dateTime.endOf('second') : dateTime.startOf('second');
                            } else if (type === 1) {
                                dateTime.add('seconds',num);
                            } else if (type === 2) {
                                dateTime.subtract('seconds',num);
                            }
                            break;
                        default:
                            return false;
                    }
                }
                return dateTime.toDate();
            };

            ds.validateAddress = function() {
                ds.summary = {};

                if (ds.address.length == 0)
                    return ds.summary;

                ds.ejs = ejsResource(ds.address);

                var later = ejs.client.get("/",
                    undefined, undefined, function (data, p) {
                        if (p === 404) {
                            return ds.summary;
                        } else if (p === 0) {
                            alertSvc.set('Error',"Could not contact Elasticsearch at "+ejs.config.server+
                            ". Please ensure that Elasticsearch is reachable from your system." ,'error');
                        } else {
                            alertSvc.set('Error',"Could not reach " + ejs.config.server + ". If you"+
                            " are using a proxy, ensure it is configured correctly",'error');
                        }
                        return ds.summary;
                    });

                return later.then(function(p) {
                    ds.summary = p;

                    console.log(ds.summary);

                    ds.refreshIndices();

                    return ds.summary;
                });

            }

            ds.refreshIndices = function() {
                ds.indices = [];

                var later = ejs.client.get("/_aliases?ignore_unavailable=true&ignore_missing=true",
                    undefined, undefined, function (data, p) {
                        if (p === 404) {
                            return ds.indices;
                        }
                        else if(p === 0) {
                            alertSvc.set('Error',"Could not contact Elasticsearch at "+ejs.config.server+
                            ". Please ensure that Elasticsearch is reachable from your system." ,'error');
                        } else {
                            alertSvc.set('Error',"Could not reach " + ejs.config.server + ". If you"+
                            " are using a proxy, ensure it is configured correctly",'error');
                        }
                        return ds.indices;
                    });

                return later.then(function(p) {
                    _.each(p, function(v,k) {
                        ds.indices.push(k);
                    });
                    return ds.indices;
                });
            }

            ds.indexMatches = function(index) {
                return _.contains(ds.possible, index);
            }

            ds.refreshMatched = function() {
                ds.possible = [];
                _.each(ds.expand_range(ds.daterange.startDate, ds.daterange.endDate, ds.index.interval),function(d){
                    ds.possible.push(d.utc().format(ds.index.pattern));
                });
            }

            // Create an array of date objects by a given interval
            ds.expand_range = function(start, end, interval) {
                if(_.contains(['hour','day','week','month','year'],interval)) {
                    var range;
                    start = moment(start).clone();
                    // In case indexes are created in local timezone viewpoint, e.g. rsyslog's
                    // omelasticsearch output module.
                    // This adjustment covers all timezones and should be harmless.
                    // end = moment(end).clone().add('hours',12);
                    range = [];
                    while (start.isBefore(end)) {
                        range.push(start.clone());
                        switch (interval) {
                            case 'hour':
                                start.add('hours',1);
                                break;
                            case 'day':
                                start.add('days',1);
                                break;
                            case 'week':
                                start.add('weeks',1);
                                break;
                            case 'month':
                                start.add('months',1);
                                break;
                            case 'year':
                                start.add('years',1);
                                break;
                        }
                    }
                    range.push(moment(end).clone());
                    return range;
                } else {
                    return false;
                }
            }


            return ds;
        }


        return factory;
    });
});