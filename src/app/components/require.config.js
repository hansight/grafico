/**
 * Bootstrap require with the needed config, then load the app.js module.
 */
require.config({
  baseUrl: 'app',
  // urlArgs: 'r=@REV@',
  paths: {
    config:                   '../config',
    settings:                 'components/settings',
    kbn:                      'components/kbn',

    vendor:                   '../vendor',
    css:                      '../vendor/require-css/css',
    text:                     '../vendor/requirejs-text/text',
    moment:                   '../vendor/moment/moment',
    blob:                     '../vendor/Blob/Blob',
    filesaver:                '../vendor/FileSaver/FileSaver',
    chromath:                 '../vendor/chromath/chromath.min',

    angular:                  '../vendor/angular/angular',
    'angular-route':          '../vendor/angular-route/angular-route',
    'angular-cookies':        '../vendor/angular-cookies/angular-cookies',
    'angular-dragdrop':       '../vendor/angular-dragdrop/src/angular-dragdrop',
    'angular-strap':          '../vendor/angular-strap/dist/angular-strap',
    'angular-sanitize':       '../vendor/angular-sanitize/angular-sanitize',
    'spectrum':               '../vendor/spectrum/spectrum',
    'angular-spectrum-colorpicker': '../vendor/angular-spectrum-colorpicker/dist/angular-spectrum-colorpicker',
    bindonce:                 '../vendor/angular-bindonce/bindonce',

    lodash:                   'components/lodash.extended',
    'lodash-src':             '../vendor/lodash/dist/lodash',
    bootstrap:                '../vendor/bootstrap/dist/js/bootstrap',

    jquery:                   '../vendor/jquery/dist/jquery',
    'jquery-ui':              '../vendor/jquery-ui/jquery-ui',

    'extend-jquery':          'components/extend-jquery',

    'jquery.gridster':        '../vendor/gridster/dist/jquery.gridster',

    modernizr:                '../vendor/modernizr/modernizr',
    numeral:                  '../vendor/numeral/numeral',
    elasticjs:                '../vendor/elastic.js/dist/elastic-angular-client'
  },
  shim: {
    angular: {
      deps: ['jquery','config'],
      exports: 'angular'
    },

    bootstrap: {
      deps: ['jquery']
    },

    modernizr: {
      exports: 'Modernizr'
    },

    jsonpath: {
      exports: 'jsonPath'
    },

    jquery: {
      exports: 'jQuery'
    },

    // simple dependency declaration
    //
    'jquery-ui':            ['jquery', 'css!../vendor/jquery-ui/themes/ui-lightness/jquery-ui.css'],
    'jquery.gridster':      ['jquery', 'css!../vendor/gridster/dist/jquery.gridster.css'],

    'angular-sanitize':     ['angular'],
    'angular-cookies':      ['angular'],
    'angular-dragdrop':     ['jquery','jquery-ui','angular'],
    'angular-loader':       ['angular'],
    'angular-mocks':        ['angular'],
    'angular-resource':     ['angular'],
    'angular-route':        ['angular'],
    'angular-touch':        ['angular'],

    'bindonce':             ['angular'],
    'angular-strap':        ['angular', 'bootstrap'],
    'spectrum':             ['css!../vendor/spectrum/spectrum.css'],
    'angular-spectrum-colorpicker': ['angular', 'spectrum'],


    elasticjs:              ['angular', '../vendor/elastic.js/dist/elastic']
  },
  waitSeconds: 60
});
