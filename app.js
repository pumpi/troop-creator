'use strict';

// Create an angular module and load the ngRoute and armyBuilderControllers
var armyBuilder = angular.module('armyBuilder', ['ngRoute', 'navModule', 'hc.commonmark', 'ngDragDrop'])

// the armybuilder configuration for ngRoute
armyBuilder.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.

            // Is the hash contains /examples we at home and view the navigation list
            when('/', {
                templateUrl: 'app/dashboard/view/dashboard.html',
                controller: 'dashboardCtrl'
            }).

            when('/build/:army', {
                templateUrl: 'app/build/view/build.html',
                controller: 'buildCtrl',
                reloadOnSearch: false
            }).

            // Fallback if no hash found we redirect to home/Example Link list
            otherwise({
                redirectTo: '/'
            });
    }]
);
