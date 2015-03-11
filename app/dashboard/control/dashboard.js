'use strict';

// Controller to build the examplelist and the top Navigation
armyBuilder.controller('dashboardCtrl',
    function ($scope, $http) {
        $http.get('/data/nav.json').
		success(function(data, status, headers, config) {
			$scope.armys = data;
		}).
		error(function(data, status, headers, config) {
			alert('error reading navigation');
		});
    }
);
