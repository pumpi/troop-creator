'use strict';

// Load Google Analytics
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-72234013-1', 'auto');

// Create an angular module and load the ngRoute and troopCreatorControllers
var troopCreator = angular.module('troopCreator', ['ngRoute', 'navModule', 'hc.commonmark', 'ngDragDrop'])

//Add Modernizr
troopCreator.constant("Modernizr", Modernizr);

// the troopcreator configuration for ngRoute
troopCreator.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.

        // Is the hash contains /examples we at home and view the navigation list
        when('/', {
            templateUrl: 'app/dashboard/view/dashboard.html',
            controller: 'dashboardCtrl'
        }).when('/build/:army', {
            templateUrl: 'app/build/view/build.html',
            controller: 'buildCtrl',
            reloadOnSearch: false
        }).when('/imprint', {
            templateUrl: 'app/content/imprint.html'
        }).

        // Fallback if no hash found we redirect to home/Example Link list
        otherwise({
            redirectTo: '/'
        });
    }]
);

// Google Analytics send
troopCreator.run(['$rootScope', '$location', '$window',
    function ($rootScope, $location, $window) {
        $rootScope.$on('$locationChangeSuccess', function () {
            if (!$window.ga || /127\.0\.0\.1/i.test($location.host())) {
                return;
            }
            $window.ga('send', 'pageview', {page: $location.path()});
        });
    }]
);

// Generate the Tooltip directive
troopCreator.directive('tooltip', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            if (!$('#navi-icon').is(':visible')) {
                $.fn.tooltip.Constructor.DEFAULTS.container = 'body';
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

// The on click select Directive
troopCreator.directive('selectOnClick', ['$window',
    function ($window) {
        return {
            link: function (scope, element) {
                element.on('click', function () {
                    var doc = document,
                        text = doc.getElementById('selectme'),
                        range,
                        selection;
                    if (document.body.createTextRange) {
                        range = document.body.createTextRange();
                        range.moveToElementText(text);
                        range.select();
                    } else if ($window.getSelection) {
                        selection = $window.getSelection();
                        range = document.createRange();
                        range.selectNodeContents(text);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                });
            }
        }
    }]
);

// The Accordion Directive
troopCreator.directive('accordionToggle', function () {
    return {
        link: function (scope, element) {
            element.on('click', function () {
                var $this = $(element).next('.accordion-container');
                if ($this.is(':hidden')) {
                    $this.slideDown();
                } else {
                    $this.slideToggle();
                }
                $this.parent().siblings().find('.accordion-container').slideUp();
            });
        }
    }
});

// Wildcard Filter for Troop Creator
troopCreator.filter('wildcardArmy', function () {
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

// Filter for range support
troopCreator.filter('range', function () {
    return function (n) {
        var res = [];
        for (var i = 1; i <= n; i++) {
            res.push(i);
        }
        return res;
    };
});
