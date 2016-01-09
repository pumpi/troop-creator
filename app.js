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

armyBuilder.directive('tooltip', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            if ( !$('#navi-icon').is(':visible') ) {
                $(element).hover(function () {
                    // on mouseenter
                    $(element).tooltip('show');
                }, function () {
                    // on mouseleave
                    $(element).tooltip('hide');
                });
            }
        }
    };
});

// Wildcard Filter for Army List builder
armyBuilder.filter('wildcardArmy', function () {
    return function (models, search) {
        if (typeof search !== 'undefined') {
            var searchRegEx = search.replace(/[^A-za-zÄÖÜäöü?]/g, '.*?');
            var thisRegex = new RegExp('.*?' + searchRegEx + '.*?', 'i');

            models = $.grep(models, function (model) {
                return thisRegex.test(model.name);
            });
        }
        return models;
    };
});

// Filter the model who not have the restricted_to model
armyBuilder.filter('restricted', function () {
    return function (models, $scope) {
        models = $.grep(models, function(model) {
            if ( model.hasOwnProperty('restricted_to') ) {

                if (typeof model.restricted_to === 'string') {
                    if ($scope.getModelById(model.restricted_to) || model.restricted_to === '*') {
                        return true;
                    }
                } else {

                    var found = false;
                    $.each(model.restricted_to, function(id, val) {
                        if ( $scope.getModelById(val) ) {
                            found = true;
                            return false;
                        }
                    });
                    return found;
                }
                return false;
            }
            return true;
        });
        return models;
    };
});

// Filter for range support
armyBuilder.filter('range', function(){
    return function(n) {
        var res = [];
        for (var i = 1; i <= n; i++) {
            res.push(i);
        }
        return res;
    };
});
