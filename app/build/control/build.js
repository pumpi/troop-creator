'use strict';

// Wildcard Filter for Army List builder
armyBuilder.filter('wildcardArmy', function() {
    return function( items, search ) {
		var filtered = [];
		  
		if ( typeof search !== 'undefined' ) {
			var searchRegEx = search.replace(/[^A-za-zÄÖÜäöü?]/g, '.*?');
			var thisRegex = new RegExp('.*?' + searchRegEx + '.*?', 'i');
		}
		  
		angular.forEach(items, function(item) {
			if( typeof search !== 'undefined' ) {
			  if ( thisRegex.test(item.name) ) {
				filtered.push(item);
			  }
			} else {
			  filtered.push(item);
			}
		});
		  
		return filtered;
	};
});

// Controller to build the examplelist and the top Navigation
armyBuilder.controller('buildCtrl',
    function ($scope, $http, $routeParams) {
    
    	$http.get('./data/' + $routeParams.army + '.json').
		success(
            function(data, status, headers, config) {
                $scope.data 			= data;
                $scope.selectedModels 	= {};
                $scope.gameCaster		= 1;
                $scope.gamePoints		= 15;
                $scope.points			= 0;
                $scope.dropModel        = {};

                angular.forEach(data, function(value, index) {
                    $scope.selectedModels[index] = [];
                });
		    }
        ).
		error(
            function(data, status, headers, config) {
                alert('error reading ' + $routeParams.army + '.json');
		    }
        );
		
		// Sticky Container
		$(document).ready( function() {
			$('.sticky').each( function() {
				var stickyPos = $(this).offset();
				var stickyWidth = $(this).outerWidth();
				var sticky = $(this);

				$(window).scroll( function() {
					if ( $(this).scrollTop() > stickyPos.top + 9.5 ) {
						sticky.css({position: 'fixed', top: 0, left: (stickyPos.left - 7.5), width: stickyWidth, zIndex: 9999});
					} else {
						sticky.removeAttr('style');
					}
				});			
			});

            var favicon = new Favico();
            var image = $('#' + $routeParams.army)[0];
            favicon.image(image);

            document.title = $('#' + $routeParams.army).attr('alt') + ' - Armybuilder';

            // Menu set selected
            $( '#top-menu li' ).removeClass( 'active' );
            $( '#' + $routeParams.army ).closest('li').addClass('active');
		});
		
		// Check if this model aviable
		$scope.checkModelAviable = function(model, type) {
			// gameCaster not set or no usable int
			if ( typeof $scope.gameCaster === 'undefined' || $scope.gameCaster.length === 0 || isNaN($scope.gameCaster)) {
                return true;
            }
            
            // gamePoints not set or no usable int
			if ( typeof $scope.gamePoints === 'undefined' || $scope.gamePoints.length === 0 || isNaN($scope.gamePoints)) {
                return true;
            }
			
			// Warlock have max value in selectedModels
            if ( /warlock/i.test(type) && $scope.selectedModels.warlock.length >= $scope.gameCaster ) {
				return true;
            }
            
            // Warcaster have max value in selectedModels
            if ( /warcaster/i.test(type) && $scope.selectedModels.warcaster.length >= $scope.gameCaster ) {
				return true;
            }
			
			// No Warlock in selectedModels we can not select an Warbeast
            if ( /warbeast/i.test(type) && $scope.selectedModels.warlock.length === 0 ) {
				return true;
            }
            
            // No Warcaster in selectedModels we can not select an Warjack
            if ( /warjack/i.test(type) && $scope.selectedModels.warcaster.length === 0 ) {
				return true;
            }
            
            // The Points to use are higher as the aviable points
            if ( ( parseInt($scope.gamePoints) - parseInt($scope.points) ) < parseInt(model.mkiicost) ) {
                return true;
            }
            
            // Check if field allowence at cap
            if ( !model.basicFA || parseInt(model.basicFA) < 100 ) {
            	var mc = 0;
            	var fa = false;
            	$.each($scope.selectedModels, function(key) {
		        	for (var i = 0, len = $scope.selectedModels[key].length; i < len; i++) {
		        		// if Character and we always have in Liste
						if ( !model.basicFA && $scope.selectedModels[key][i]['name'] === model.name ) {
							fa = true;
							break;
						}
					
						// Count field allowence model
						if ( $scope.selectedModels[key][i]['name'] === model.name ) {
							mc ++;
						}
					
						// if field allowence model overdune
						if ( model.basicFA <= mc ) {
							fa = true;
							break;
						}
					}
				});
				
				// field allowence overdune
				if ( fa ) {
					return true;
				}
            }
            
            // An unit or weapon Attackment but not set the model
            if ( /attachment/i.test(type) ) {
            	for (var i = 0, len = $scope.selectedModels.unit.length; i < len; i++) {
					if ( $scope.selectedModels.unit[i]['name'] === model.baseUnit || model.baseUnit === '*' ) {
						return false;
					}
				}				
				return true;
            }
            
            // All its fine we can activate the model
            return false;
        };

        $scope.dropCallback = function(event, ui) {
            var type = ui.draggable.data().type;
            var dragScope = angular.element(ui.draggable).scope();
            $scope.addModel(dragScope.model, type);
        };

        // Add an model from the left to the right
        $scope.addModel = function(model, type) {
        	copy = angular.copy(model);
	       	$scope.selectedModels[type].push(copy);
        	$scope.calculateAviablePoints();
        };

        // Remove an Model from the right
        $scope.removeModel = function(model, type, index) {
        	$scope.selectedModels[type].splice(index, 1);
        	$scope.calculateAviablePoints();
        };
        
        // Unit use Base Size
        $scope.unitUseMax = function(type, index, set) {
        	$scope.selectedModels[type][index]['useMax'] = set;
        	$scope.calculateAviablePoints();
        };
        
        // Is there enouth points to use max size
        $scope.canUseMax = function(model) {
       		return ( !model.useMax && ( parseInt($scope.gamePoints) - parseInt($scope.points) + parseInt(model.mkiicost) ) < parseInt(model.mkiiexpand) );
        };
        
        // Calculate the Aviable Points
        $scope.calculateAviablePoints = function() {
			var sumPoints = 0;			
			var casterPoints = 0;
			
			$.each( $scope.selectedModels, function( type , models ) {
				if ( /warlock|warcaster/i.test(type) ) {
					$.each(models, function ( index, model ) {
						casterPoints = casterPoints + parseInt(model.mkiicost);
					});
				} else if ( /warjack|warbeast/i.test(type) ) {
					$.each(models, function ( index, model ) {
                        // if he bonTo none we must calculate the points to the sumPoints and not to casterPoints
                        console.log(model.hasOwnProperty('bondTo'));
                        if ( model.hasOwnProperty('bondTo') && model.bondTo === 'none' ) {
                            sumPoints = sumPoints + parseInt(model.mkiicost);
                        } else {
                            casterPoints = casterPoints - parseInt(model.mkiicost);
                        }
					});
				} else {
					$.each(models, function ( index, model ) {
						// Must we use the base cost of model or the max
						if ( model.useMax ) {
							sumPoints = sumPoints + parseInt(model.mkiiexpand);
						} else {
							sumPoints = sumPoints + parseInt(model.mkiicost);
						}
					});
				}
			});

			if ( casterPoints < 0 ) {
				$scope.points = sumPoints - ( casterPoints * +1 );
			} else {
				$scope.points = sumPoints;
			}
		};
        
        // No sort for ng-repeat
        $scope.notSorted = function(obj){
		    if (!obj) {
		        return [];
		    }
		    return Object.keys(obj);
		};

    }
);
