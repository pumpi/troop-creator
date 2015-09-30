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
                $scope.selectedModels 	= [];
                $scope.gameCaster		= 1;
                $scope.gamePoints		= 15;
                $scope.points			= 0;
                $scope.dropModel        = {};
                $scope.casterPoints     = 0;

                var favicon = new Favico();
                var image = $('#' + $routeParams.army)[0];
                favicon.image(image);

                document.title = $('#' + $routeParams.army).attr('alt') + ' - Armybuilder';

                // Menu set selected
                $( '#top-menu li' ).removeClass( 'active' );
                $( '#' + $routeParams.army ).closest('li').addClass('active');
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
            if ( /warlock/i.test(type) && $scope.countType('warlock') >= $scope.gameCaster ) {
				return true;
            }
            
            // Warcaster have max value in selectedModels
            if ( /warcaster/i.test(type) && $scope.countType('warcaster') >= $scope.gameCaster ) {
				return true;
            }
			
			// No Caster in selectedModels we can not select an Warbeast or Warjack
            if ( /warbeast|warjack/i.test(type) && $scope.countType('warlock|warcaster') === 0 ) {
				return true;
            }
            
            // The Points to use are higher as the available points but check if warbeast an we have available caster points
            if ( /warbeast|warjack/i.test(type) && parseInt($scope.casterPoints) > 0) {
		    	if ( ( parseInt($scope.gamePoints) - parseInt($scope.points) + parseInt($scope.casterPoints) ) < parseInt(model.mkiicost)) {
		            return true;
				}
            } else if ( !/warcaster|warlock/i.test(type) ) {
                if ( ( parseInt($scope.gamePoints) - parseInt($scope.points) ) < parseInt(model.mkiicost)) {
                    return true;
                }
            }
            
            // Check if field allowance at cap
            if ( !model.basicFA || parseInt(model.basicFA) < 100 ) {
            	var mc = 0;
            	var fa = false;
            	$.each($scope.selectedModels, function(key, selectedModel) {
                    // if Character and we always have in list
                    if ( !model.basicFA && selectedModel.name === model.name ) {
                        fa = true;
                        return false;
                    }

                    // Count field allowance model
                    if ( selectedModel.name === model.name ) {
                        mc ++;
                    }

                    // if field allowance model full
                    if ( model.basicFA <= mc ) {
                        fa = true;
                        return false;
                    }
				});
				
				// field allowance full
				if ( fa ) {
					return true;
				}
            }
            
            // An unit or weapon attachment but not set the base model
            if ( model.hasOwnProperty('baseUnit') ) {
            	for (var i = 0, len = $scope.selectedModels.length; i < len; i++) {
					if ( $scope.selectedModels[i].name === model.baseUnit || model.baseUnit === '*' ) {
						return false;
					}
				}				
				return true;
            }
            
            // All its fine we can activate the model
            return false;
        };

        $scope.countType = function(type) {
            var count = 0;
            var matcher = new RegExp(type, "i");
            $.each( $scope.selectedModels, function( key, selectedModel ) {
                if ( matcher.test(selectedModel.type) ) {
                    count ++;
                }
            });
            return count;
        };

        $scope.dropCallback = function(event, ui) {
            var type = ui.draggable.data().type;
            var dragScope = angular.element(ui.draggable).scope();
            $scope.addModel(dragScope.model, type);
        };

        $scope.startCallback = function(event, ui) {
            var prevWidth = ui.helper.prevObject.width();
            ui.helper.css({'width': prevWidth});
        };

        // Add an model from the left to the right
        $scope.addModel = function(model, type) {
        	var copy = angular.copy(model);
                copy.type = type;

            // If type warbeast or warjack we must add it after the last warbeast/warjack oder after the last warlock/warcaster
            // If baseUnit set we must add this model to an unit
            var findIndex = false;
            if ( /warbeast|warjack/i.test(type) ) {
                for (var i = $scope.selectedModels.length -1; i >= 0; i--) {
                    if ( /warbeast|warlock|warjack|warcaster/i.test($scope.selectedModels[i].type) ) {
                        findIndex = i;
                        break;
                    }
                }
            } else if ( model.hasOwnProperty('baseUnit') ) {
                for (var i = $scope.selectedModels.length -1; i >= 0; i--) {
                    if ( $scope.selectedModels[i].name === model.baseUnit ) {
                        findIndex = i;
                        break;
                    }
                }
            }

            // If we find a postion where we add the model add or add to the end
            if ( findIndex !== false ) {
                copy.bonded = 1;
                $scope.selectedModels.splice(findIndex +1, 0, copy);
            } else {
                $scope.selectedModels.push(copy);
            }
        	$scope.calculateAvailablePoints();
        };

        // Remove an Model from the right
        $scope.removeModel = function(index) {
            if ( $scope.selectedModels[index + 1] !== undefined && !$scope.selectedModels[index].hasOwnProperty('bonded') && $scope.selectedModels[index + 1].hasOwnProperty('bonded') ) {
                if ( !confirm(unescape("Wenn Sie dieses Model l%F6schen werden auch alle angeschlossenen Modelle gel%F6scht%21 wollen Sie wirklich l%F6schen%3F")) ) {
                    return false;
                }

                // Let us se how much models are bonded to the model we like to del
                var modelsToDel = 0;
                for ( var i = index +1, len = $scope.selectedModels.length; i < len; i ++ ) {
                    if ( $scope.selectedModels[i].hasOwnProperty('bonded') ) {
                        modelsToDel ++;
                    } else {
                        // we have count all models an can leave the for
                        break;
                    }
                }

                $scope.selectedModels.splice(index, modelsToDel + 1);
            } else {
                $scope.selectedModels.splice(index, 1);
            }

        	$scope.calculateAvailablePoints();
        };
        
        // Unit use Base Size
        $scope.unitUseMax = function(type, index, set) {
        	$scope.selectedModels[index].useMax = set;
            $scope.calculateAvailablePoints();
        };
        
        // Is there enough points to use max size
        $scope.canUseMax = function(model) {
       		return ( !model.useMax && ( parseInt($scope.gamePoints) - parseInt($scope.points) + parseInt(model.mkiicost) ) < parseInt(model.mkiiexpand) );
        };
        
        // Calculate the available Points
        $scope.calculateAvailablePoints = function() {
			var sumPoints = 0;			
			var casterPoints = 0;

			$.each( $scope.selectedModels, function( key, model ) {
				if ( /warlock|warcaster/i.test(model.type) ) {
                    casterPoints = casterPoints + parseInt(model.mkiicost);
				} else if ( /warjack|warbeast/i.test(model.type) ) {
                    // if he bonTo none we must calculate the points to the sumPoints and not to casterPoints
                    if ( model.hasOwnProperty('bondTo') && model.bondTo === 'none' ) {
                        sumPoints = sumPoints + parseInt(model.mkiicost);
                    } else {
                        casterPoints = casterPoints - parseInt(model.mkiicost);
                    }
				} else {
                    // Must we use the base cost of model or the max
                    if ( model.useMax ) {
                        sumPoints = sumPoints + parseInt(model.mkiiexpand);
                    } else {
                        sumPoints = sumPoints + parseInt(model.mkiicost);
                    }
				}
			});

			if ( casterPoints < 0 ) {
				$scope.points = sumPoints - ( casterPoints * +1 );
			} else {
				$scope.points = sumPoints;
			}

            // Set the available Caster points for later Checks
            $scope.casterPoints = casterPoints;
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
