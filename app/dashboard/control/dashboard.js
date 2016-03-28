'use strict';

// Controller to build the examplelist and the top Navigation
troopCreator.controller('dashboardCtrl', ['$scope', '$http',
    function ($scope, $http) {
        $scope.dataLoaded = false;
        $http.get('https://api.github.com/repos/pumpi/troop-creator/issues').
        success(
            function(data, status, headers, config) {
                $scope.data = data;
                $scope.dataLoaded = true;
            }
        ).
        error(
            function(data, status, headers, config) {
                alert('cannot load Issues from Github');
            }
        );
    }]
);