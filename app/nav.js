'use strict';

// Controller to build the examplelist and the top Navigation
angular.module('navModule', [])
    .directive('navD', function () {
        return {
            templateUrl: 'nav.html',
            replace: true,
            controller: 'navCtrl'
        };
    }
).controller('navCtrl', function ($scope, $rootScope, $http, $timeout, $location) {
        // Add the examples array to the scope to use it in the Template wit ng-repeat
        $http.get('./data/nav.json').
            success(function(data, status, headers, config) {
                $scope.armys = data;
		    }
        ).
		error(function(data, status, headers, config) {
			alert('error reading navigation');
		});
    }
);
