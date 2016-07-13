'use strict';

/**
 * @param {{army}} $routeParams Root Params from AngularJS.
 * @param $window.ga            The google Analytics object.
 */

// Controller to display the troop creator
troopCreator.controller('buildCtrl', ['$scope', '$http', '$routeParams', '$location', '$window', '$log', '$q',
    function ($scope, $http, $routeParams, $location, $window, $log, $q) {
        $scope.$log = $log;

        $http.get('./data/' + $routeParams.army + '.json').
        success(
            function(data) {
                /**
                 * @param {{groups, tiers}} data    response the JSON Object with groups and tiers.
                 * @param {{faction}} $scope.army   army is the data object of the active navigation point
                 * @param {{levels, onlyModels, casterId}} $scope.vars.tier Include some infos for the tier Levels
                 */

                var jqArmy = $('#' + $routeParams.army);
                $scope.army = jqArmy.data();
                $scope.data = [];

                // only add data with entries and allowed
                $.each(data.groups, function(key, item) {
                    if (item.entries.length !== 0) {
                        $scope.data.push(item);
                    }

                });
                $scope.options = {
                    'gameCaster'        : 1,
                    'gamePoints'        : 75,
                    'gameTier'          : '',
                    'gameObjective'     : '',
                    'modalLevel'        : 0
                };

                $scope.vars = {
                    'tiers'             : data.tiers,
                    'tierOptions'       : [],
                    'tier'              : {},
                    'tierLevel'         : 0,
                    'selectedModels'    : [],
                    'casterPoints'      : 0,
                    'points'            : 0,
                    'costAlterations'   : [],
                    'faAlterations'     : [],
                    'freeModels'        : {'id': [], 'count': 0},
                    'factionId'         : 'faction_' + $routeParams.army,
                    'objectives'        : [
                        'Arcane Wonder',
                        'Armory',
                        'Bunker',
                        'Effigy of Valor',
                        'Fuel Cache',
                        'Stockpile'
                    ],
                    'animosities'       : false,
                    'dragging'          : false,
                    'canDrop'           : false,
                    'location'          : $location.search(),
                    'gameRelease'       : 'mk3',
                    'data'              : [],
                    'lastController'     : {}
                };

                $scope.errors = {};

                $http.get('./data/animosities.json').success(function(data) {
                    $scope.vars.animosities = data;
                });

                $scope.location = $location;
                $scope.modernizr = Modernizr;

                // We must convert the Tiers in an array for select
                $.each(data.tiers, function(key, value) {
                    $scope.vars.tierOptions.push({
                        key: key,
                        label: value.name
                    });
                });

                // Now we get the mercenaries and minions
                $.each(['minion', 'mercenary'], function (k, v) {
                    if ( v !== $routeParams.army ) {
                        $http.get('./data/' + v + '.json').
                        success(
                            function (data) {
                                // Only who works for the faction get in list
                                $.each(data.groups, function (gkey, group) {
                                    if (group.entries.length !== 0) {

                                        // Now we check all models if he work for the faction
                                        group.entries = $.grep(group.entries, function (item) {
                                            /**
                                             * @param item                  the single model.
                                             * @param item.works_for        model array for what faction he works.
                                             * @param item.restricted_to    model what we need to play this model.
                                             */
                                            if (item.works_for) {
                                                // We have an caster, unit or solo and must look if he works_for this faction
                                                if ($.inArray($scope.vars.factionId, item.works_for) !== -1) {
                                                    return true;
                                                }
                                            } else if (item.restricted_to || /^warj|^warb/i.test(item.type) ) {
                                                // We have an restricted model but not all data fetched we save reference for later
                                                // If we have an UA we can already watch for the restricted_to Unit
                                                // UAs restricted_to always string i hope ^^
                                                if ( /^ua/i.test(item.type) ) {
                                                    return $scope.getModelById(item.restricted_to);
                                                } else {
                                                    return true;
                                                }
                                            }
                                            return false;
                                        });
                                        group.add = v;
                                        $scope.data.push(group);
                                    }
                                });

                                if ( v === 'mercenary' || $routeParams.army === 'mercenary' ) {
                                    if (!$window.ga || /127\.0\.0\.1/i.test($location.host())) {
                                        $scope.devAddId();
                                    }

                                    // Now we can filter all models that not allowed
                                    $.each( $scope.data, function(key, group) {
                                        group.entries = $scope.allowedModels(group.entries);
                                        $scope.vars.data.push(group);
                                    });

                                    //restore from URL after we load the last data and we start watching scope Changes
                                    $scope.restoreSearch();
                                    $scope.$watchGroup(['options.gamePoints', 'options.gameCaster'], function() {
                                        $scope.updateSearch();
                                    });

                                    // Watch if location.search() is change Only if the search not change over an intern function we restore the url for History back
                                    $scope.$watch(function(){ return $location.search(); }, function(){
                                        if ( JSON.stringify($location.search()) !== JSON.stringify($scope.vars.location) ) {
                                            // Reset all data to restore the url correctly
                                            $scope.vars.selectedModels      = [];
                                            $scope.options.gameCaster       = 1;
                                            $scope.options.gamePoints       = 75;
                                            $scope.options.gameTier         = '';
                                            $scope.options.gameObjective    = '';

                                            $scope.restoreSearch();
                                        }
                                    });
                                }
                            }
                        ). error (
                            function () {
                                $scope.errors.readingFile = 'error reading ' + v + '.json';
                                $('#error').modal();
                            }
                        );
                    }
                });

                var favicon = new Favico();
                var image = $('#' + $routeParams.army + ' img')[0];
                favicon.image(image);

                document.title = $scope.army.faction + ' - Troop Creator';

                // Menu set selected
                $( '#top-menu' ).find('li').removeClass( 'active' );
                jqArmy.closest('li').addClass('active');

                $('.btn').focus(function() {
                    this.blur();
                });
            }
        ).
        error(
            /*data, status, headers, config*/
            function() {
                $scope.errors.readingFile = 'error reading ' + $routeParams.army + '.json';
                $('#error').modal();
            }
        );

        $scope.openList = function() {
            $('#left-col-build').toggleClass('active');
        };

        // We Check all parameters for some errors and store ist in the error Object
        $scope.checkErrors = function() {
            $scope.errors = {};
            if ( $scope.options.gameCaster > $scope.countSelectedModel('^war(lock|caster)$').all ) {
                $scope.errors.casters = 'You Have not set all Casters';
            }
            if ( ($scope.options.gamePoints - $scope.vars.points) > 4 ) {
                $scope.errors.points = 'You have more than 4 points left';
            }
        };

        // Check if model an warcaster/warlock
        $scope.checkIsCaster = function(model) {
            return /^warcaster$|^warlock$/i.test(model.type);
        };

        // Filter the selected Models and return only the Models that allowed
        $scope.allowedModels = function(models) {
            if ( models ) {
                models = $.grep(models, function (model) {
                    //Now we Check if we have the restricted model available
                    if (model.hasOwnProperty('restricted_to')) {
                        if (typeof model.restricted_to === 'string') {
                            if ($scope.getModelById(model.restricted_to) || model.restricted_to === '*') {
                                return true;
                            }
                        } else {
                            var found = false;
                            $.each(model.restricted_to, function (id, val) {
                                if ($scope.getModelById(val)) {
                                    found = true;
                                    return false;
                                }
                            });
                            return found;
                        }
                        return false;
                    } else if (/merc|minion/i.test(model.faction) && /^warj|^warb/i.test(model.type)) {
                        // for mercs an Minions we must look for an model that can control this beast or jack
                        return $scope.checkCanControl(model);
                    }
                    return true;
                });
            }
            return models;
        };

        // Check if this model available
        $scope.checkModelAvailable = function(model) {
            var cost = $scope.getModelCost(model, true),
                getFa = $scope.getModelFa(model);

            //if ( $scope.options.gameTier && $scope.checkModelTier(model) ) {
            //    return true;
            //}

            // We check first the animosities
            if ( $scope.vars.animosities && !$.isEmptyObject($scope.vars.selectedModels) ) {
                var animosity = false;
                $.each( $scope.vars.animosities, function(a1, a2) {

                    var match = false;
                    if ( $scope.checkAttributes(model, a1) ) {
                        match = a2;
                    } else if ( $scope.checkAttributes(model, a2) ) {
                        match = a1;
                    }

                    if ( match !== false ) {
                        $.each($scope.vars.selectedModels, function (key, sModel) {
                            if ( $scope.checkAttributes(sModel, match) ) {
                                animosity = true;
                            }
                        });

                    }
                });

                if ( animosity === true ) {
                    return true;
                }
            }

            // gameCaster not set or no usable int
            if ( typeof $scope.options.gameCaster === 'undefined' || $scope.options.gameCaster.length === 0 || isNaN($scope.options.gameCaster)) {
                return true;
            }

            // gamePoints not set or no usable int
            if ( typeof $scope.options.gamePoints === 'undefined' || $scope.options.gamePoints.length === 0 || isNaN($scope.options.gamePoints)) {
                return true;
            }

            // Warlock have max value in selectedModels
            if ( /^warlock$|^warcaster$/i.test(model.type) && $scope.countSelectedModel('^warlock$|^warcaster$').all >= $scope.options.gameCaster ) {
                return true;
            }

            // Only Caster or other model can control warbeast or warjack in selectedModels we can not select an Warbeast or Warjack
            if ( /^warb|^warj/i.test(model.type) && $scope.countSelectedModel('^warlock$|^warcaster$|lesserwarlock|journeyman|marshall').all === 0 ) {
                return true;
            } else if ( /^warb|^warj/i.test(model.type) ) {
                // If there an caster or other model where this model can join
                var cj = false;
                $.each($scope.vars.selectedModels, function (key, sModel) {
                    if ( $scope.canJoinGroup(sModel, model) ) {
                        cj = true;
                    }
                });

                // The model can not join any group now we disable it
                if ( cj === false ) {
                    return true;
                }
            }

            // We must have an Caster or Warlock to use Solo/Unit attachments and the Caster don't can have more then one or two if he an unit
            if ( /^soloAtt|^unitCasterAtt/i.test(model.type) ) {
                if ( $scope.countSelectedModel('^warlock$|^warcaster$').all === 0 ) {
                    return true;
                } else {
                    var freeCaster = false;
                    $.each($scope.vars.selectedModels, function (key, sModel) {
                        if ( /^warlock$|^warcaster$/i.test(sModel.type) ) {
                            if ( sModel.group.length === 0 || $scope.countSelectedModel('^soloAtt|^unitCasterAtt', 'type', key).all === 0) {
                                freeCaster = true;
                            }
                        }
                        return !freeCaster;
                    });

                    if ( freeCaster === false ) {
                        return true;
                    }
                }
            }

            // The Points to use are higher as the available points but check if warbeast an we have available caster points
            if ( /^warb|^warj/i.test(model.type) && parseInt($scope.vars.casterPoints) > 0) {
                if ( ( parseInt($scope.options.gamePoints) - parseInt($scope.vars.points) + parseInt($scope.vars.casterPoints) ) < cost) {
                    return true;
                }
            } else if ( !$scope.checkIsCaster(model) ) {
                if ( ( parseInt($scope.options.gamePoints) - parseInt($scope.vars.points) ) < cost) {
                    return true;
                }
            }

            // Check if field allowance at cap
            if ( !getFa || getFa !== 'U' ) {
                var mc = $scope.countSelectedModel(model.id, 'id'),
                    fa = false;

                if (getFa === 'C' && mc.all > 0) {
                    fa = true;
                } else if (getFa <= mc.normal) {
                    fa = true;
                }

                // Check if this an free tier model an ignores the FA
                if ( cost === 0 && model.cost !== 0 ) {
                    fa = false;
                }

                // field allowance full
                if ( fa === true ) {
                    return true;
                }
            }

            // The model only can attached to but not set the base model
            // restricted_to is in lesser warlock the same naming for other use
            if ( model.hasOwnProperty('restricted_to') && ( !/lesserwarlock|journeyman|marshall/i.test(model.type) || /^ua/i.test(model.type)) ) {
                var search = model.restricted_to;
                if (typeof model.restricted_to !== 'string') {
                    search = model.restricted_to.join('|');
                }
                var countRestricted = $scope.countSelectedModel(search, 'id'),
                    countModel = $scope.countSelectedModel(model.id, 'id');

                // The restricted model is not set
                if ( countRestricted.all === 0 ) {
                    return true;
                }

                // restricted models can only add once per restricted model
                // But we have some jacks or beast that only can restricted to an special caster (mercanary, minions or chatacter adds to caster)
                // have the Jack or Beast 0 cost is the same as an UA only once per restricted caster
                if ( !/^war/i.test(model.type) || (/^war/i.test(model.type) && model.cost === 0) ) {
                    if ( !(countRestricted.all > 0 && countRestricted.all > countModel.all) ) {
                        return true;
                    }
                }

                // if the Type UA or WA we can not add more UAs or WAs as Units
                if ( /^ua$|^wa$/i.test(model.type) ) {
                    if ( $scope.searchFreeUnit(model) === false ) {
                        return true;
                    }
                }
            }

            // All its fine we can activate the model
            return false;
        };

        // count models with regex in selected list by value
        $scope.countSelectedModel = function(match, value, group) {
            value = typeof value !== 'undefined' ? value : 'type';
            group = typeof group !== 'undefined' ? group : false;

            var count = 0,
                countFree = 0,
                matcher = new RegExp(match, 'i');

            if ( $scope.hasOwnProperty('vars') && $scope.vars.selectedModels ) {
                var recursive = function(models) {
                    $.each(models, function (key, model) {
                        if ( model.hasOwnProperty(value) && matcher.test(model[value]) ) {
                            if ( model.freeModel ) {
                                countFree++;
                            } else {
                                count++;
                            }
                        }
                        recursive(model.group);
                    });
                };

                if ( group !== false ) {
                    recursive($scope.vars.selectedModels[group].group);
                } else {
                    recursive($scope.vars.selectedModels);
                }
            }
            return {'normal': count, 'free': countFree, 'all': (count + countFree)};
        };

        /**
         * This function check if the regex string match to the models attributes
         * @param   model object    the single model.
         * @param   match string    An String with regex that must match
         * @return                  boolean true or false
         */
        $scope.checkAttributes = function(model, match) {
            var matcher = new RegExp(match, 'i');
            if ( model.hasOwnProperty('attributes') ) {
                var attributes = model.attributes.join();
                return matcher.test(attributes);
            }
            return false;
        };

        /**
         * This function check if there an Warlock that control this beast or jack
         * param    model object    the model
         * @return                  boolean true or false
         */
        $scope.checkCanControl = function(model) {
            var found = false;
            if ( model.hasOwnProperty('attributes')) {
                $.each($scope.data, function (key, grp) {
                    $.each(grp.entries, function (key, dModel) {
                        if (dModel.hasOwnProperty('canControlOnly')) {
                            found = $scope.checkAttributes(model, dModel.canControlOnly);
                            if (found === true) {
                                return false;
                            }
                        }
                    });
                    if (found === true) {
                        return false;
                    }
                });
            }
            return found;
        };

        // Search for an free Unit without the same type of model
        $scope.searchFreeUnit = function(model) {
            var count = $scope.vars.selectedModels.length - 1,
                restrictedTo = model.restricted_to,
                findIdx = false;
            if (typeof model.restricted_to === 'string') {
                restrictedTo = [model.restricted_to];
            }

            for (var j = 0; j <= count; j++) {
                if ( restrictedTo.indexOf($scope.vars.selectedModels[j].id) !== -1 ) {
                    // We only can add if there no other UA or other WA or not the same model in group
                    if ( $scope.countSelectedModel('^' + model.type + '$', 'type', j).all === 0 && $scope.countSelectedModel(model.id, 'id', j).all === 0 ) {
                        findIdx = j;
                    }
                }

                if ( findIdx !== false ) {
                    break;
                }
            }
            return findIdx;
        };

        /**
         * This function check an model can join a group of an other model
         * @param   gModel object   the model who leads the group.
         * @param   jModel string   the model will join the group
         * @return                  boolean true or false
         */
        $scope.canJoinGroup = function(gModel, jModel) {
            var group = $scope.vars.selectedModels.indexOf(gModel);

            // We check if this model an model that must be in group and is it the same faction
            if (
                typeof gModel === 'undefined' ||
                (!/^warb|^warj|^soloatt|^unitcasteratt/i.test(jModel.type) && !jModel.hasOwnProperty('restricted_to')) ||
                gModel['faction'] !== jModel['faction']
            ) {
                return false;
            }

            // check if warbeast and we can drop it but only if we have no restriceted_to
            if (/^warb|^warj/i.test(jModel.type) && !jModel.hasOwnProperty('restricted_to')) {
                if (/^warlock$|^warcaster$|lesserwarlock|journeyman|marshall/i.test(gModel.type)) {
                    var cco = true;
                    if ( gModel.hasOwnProperty('canControlOnly') ) {
                        // This caster can control only special attribute models
                        cco = $scope.checkAttributes(jModel, gModel.canControlOnly);
                    }
                    // Some lesserwarlocks have an restricted_to that means she only can get special beasts
                    if (!gModel.hasOwnProperty('restricted_to') ||
                        ( gModel.hasOwnProperty('restricted_to') && gModel.restricted_to.indexOf(jModel.id) !== -1 )) {
                        // If we have an Jack marshall he can only get 1 Jacks and no colossal
                        return (
                            (
                                !/marshall/i.test(gModel.type) ||
                                (
                                    /marshall/i.test(gModel.type)
                                    && $scope.countSelectedModel('^warjack$', 'type', group).normal < 1
                                    && !/colossal/i.test(jModel.type)
                                )
                            )
                            && cco
                        );
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (jModel.hasOwnProperty('restricted_to')) {
                if ( jModel.restricted_to.indexOf(gModel.id) !== -1 ) {
                    // We only can add if there no other UA or other WA or not the same model in group
                    return ( $scope.countSelectedModel('^' + jModel.type + '$', 'type', group).all === 0 && $scope.countSelectedModel(jModel.id, 'id', group).all === 0 );
                } else {
                    return false;
                }
            } else if ( /^soloatt|^unitcasteratt/i.test(jModel.type) && !/^warlock$|^warcaster$/i.test(gModel.type) ) {
                return false;
            }
            return true;
        };

        /**
         * The filters looks if an group is not empty after canJoinGroup function
         * @param   group array     the group that must be filtered
         * @return                  boolean true or false
         */
        $scope.checkEmptyGroup = function(group) {
            if ( !jQuery.isEmptyObject($scope.vars.lastController) ) {
                var f = $.grep(group.entries, function (model) {
                    return $scope.canJoinGroup($scope.vars.lastController, model);
                });
                return f.length > 0;
            }
        };

        // ********************************
        // MOVING MODELS BETWEEN GROUPS
        // ********************************
        // First we must Check if we can move the model
        $scope.moveCanDrag = function(model) {
            return !( /uamarshall/i.test(model.type) || model.auto_attached );
        };

        // start drag callback by moving Model
        $scope.moveModelStart = function(event, ui, model, group) {
            $scope.vars.dragging = {'model': model, 'group': group};
        };

        // move over callback if you move over the droparea
        // we must Timeout the over function to execute it after the out function
        // http://stackoverflow.com/questions/8932820/jquery-ui-draggable-over-out-event-order#comment11179667_8932820
        $scope.moveOverDropable = function(event, ui, model, group) {
            setTimeout( function() {
                if ( $scope.checkDropable(model, group) ) {
                    $(event.target).addClass('activeDrop').siblings().removeClass('activeDrop');
                    $scope.vars.canDrop = true;
                }
            }, 0);
        };

        // move out callback if you leave the droparea
        $scope.moveOutDropable = function() {
            $('.activeDrop').removeClass('activeDrop');
            $scope.vars.canDrop = false;
        };

        // start drag callback by moving Model
        $scope.moveBeforeDrop = function(event, ui) {
            var deferred = $q.defer();
            if ($scope.vars.canDrop) {
                deferred.resolve();
            } else {
                deferred.reject();
                $(ui.helper.eq(0)).animate({'left': 0, 'top': 0});
            }
            return deferred.promise;
        };

        // Check if we can drop the model in this Group
        $scope.checkDropable = function(model, group) {
            // if the same group as before
            if ( group === $scope.vars.dragging.group || $scope.vars.dragging === false ) {
                return false;
            }

            return $scope.canJoinGroup(model, $scope.vars.dragging.model);
        };

        // if we Drop the model now we can move it between the groups
        $scope.moveOnDrop = function(event, ui, model, group) {
            //at first we add the model by string to the group
            $scope.addModel($scope.vars.dragging.model, group);

            // now we can remove the old model
            $scope.removeModel($scope.vars.dragging.model, $scope.vars.dragging.group);
            $scope.vars.dragging = $scope.vars.canDrop = false;
            $('.activeDrop').removeClass('activeDrop');
        };

        // Drop callback for draggable
        $scope.dropCallback = function(event, ui) {
            var dragScope = angular.element(ui.draggable).scope();
            $scope.addModel(dragScope.model);
        };

        // start drag callback
        $scope.startCallback = function(event, ui) {
            var prevWidth = ui.helper.prevObject.width();
            ui.helper.css({'width': prevWidth});
        };

        // ***********************************
        // ADD AND REMOVE MODELS FUNCTIONS
        // ***********************************
        // Add an model to the selected list
        $scope.addModel = function(model, group) {
            group = typeof group !== 'undefined' ? group : false;

            if ( !$scope.checkModelAvailable(model) || group !== false ) {
                var copy = angular.copy(model);
                copy.group = [];
                // its an Weapon Attachmend we need an option
                if ( /^wa$/i.test(model.type) ) {
                    copy.attached = 1;
                }

                // If type warbeast or warjack we must add it in group of an caster model
                // If baseUnit set we must add this model to an unit
                var findIdx = false;
                if ( group !== false) {
                    findIdx = group;
                } else if (/^warb|^warj/i.test(model.type)) {
                    for (var i = $scope.vars.selectedModels.length - 1; i >= 0; i--) {
                        if ( $scope.canJoinGroup($scope.vars.selectedModels[i], model) ) {
                            findIdx = i;
                            break;
                        }
                    }
                } else if (model.hasOwnProperty('restricted_to')) {
                    findIdx = $scope.searchFreeUnit(model);
                } else if (/^soloatt|^unitcasteratt/i.test(model.type)) {
                    copy.sort = 0;
                    for (var j = $scope.vars.selectedModels.length - 1; j >= 0; j--) {
                        if (/^warlock$|^warcaster$/i.test($scope.vars.selectedModels[j].type) && $scope.countSelectedModel('^soloAtt|^unitcasteatt', 'type', j).all === 0 ) {
                            findIdx = j;
                            break;
                        }
                    }
                }

                // check if the model we add an free model but only if tier
                /*
                if ( $scope.vars.tier ) {
                    var cost = $scope.getModelCost(model, true);
                    if ( cost === 0 ) {
                        copy.realCost = copy.cost;
                        copy.cost = 0;
                        copy.freeModel = 1;
                    }
                }
                */
                
                // Auto attached
                // Have the model the attribute auto_attached we must add the model in auto_attached
                if (model.hasOwnProperty('attachment')) {
                    var attache = angular.copy($scope.getModelById(model.attachment));
                    attache.auto_attached = 1;
                    attache.bonded = 1;
                    attache.group = [];
                    copy.group.push(attache);
                }

                // If we find a position where we add the model add this model or add to the end
                if (findIdx !== false) {
                    copy.bonded = 1;

                    // an UAMarchall change the type of his group to unitMarshall
                    if ( /uamarshall/i.test(copy.type) ) {
                        $scope.vars.selectedModels[findIdx].type = 'unitMarshall';
                    }

                    $scope.vars.selectedModels[findIdx].group.push(copy);
                } else if ( $scope.countSelectedModel('^warlock|^warcaster').all === 0 && /^warlock|^warcaster/i.test(copy.type) ) {
                    $scope.vars.selectedModels.splice(0, 0, copy);
                } else {
                    $scope.vars.selectedModels.push(copy);
                }
                if ( /journeyman|lesserwar/i.test(copy.type) && !copy.hasOwnProperty('attachment') ) {
                    $scope.vars.j = $scope.vars.selectedModels.indexOf(copy);
                    $scope.vars.lastController = copy;
                    $('#journeyman').modal().on('hidden.bs.modal', function () {

                        if ( $scope.vars.selectedModels[$scope.vars.j].group.length === 0 ) {
                            $scope.removeModel(copy);
                        }
                        $(this).off();

                        // The Scope need an apply while is out of the angular walker
                        $scope.$apply();
                    });
                }

                $scope.calculatePoints();
            }
        };

        // Remove an Model from the right
        $scope.removeModel = function(model, gIdx) {
            var models = false;
            var idx = false;
            
            if (typeof(gIdx) === 'undefined' ) {
                models = $scope.vars.selectedModels;
                idx = $scope.vars.selectedModels.indexOf(model);
            } else {
                models = $scope.vars.selectedModels[gIdx].group;
                idx = $scope.vars.selectedModels[gIdx].group.indexOf(model);
            }

            if ( idx !== -1 ) {
                if (models[idx].group.length > 0 ) {
                    if (!confirm("If you remove this model all grouped models will also be removed")) {
                        return false;
                    }
                }

                // an UAMarchall have change the type of his group to unitMarshall
                if ( typeof gIdx !== 'undefined' && /uamarshall/i.test(models[idx].type) ) {
                    if (!confirm("If you remove this model the unit will lose unitMarshall and all jacks will also be removed")) {
                        return false;
                    }
                    $scope.vars.selectedModels[gIdx].type = 'unit';

                    // Now me must remove all warbeast or warjacks in his group
                    for (var i = $scope.vars.selectedModels[gIdx].group.length - 1; i >= 0; i--) {
                        var gModel = $scope.vars.selectedModels[gIdx].group[i];
                        if ( /^warb|^warj/i.test(gModel.type) ) {
                            $scope.vars.selectedModels[gIdx].group.splice(idx, 1);
                        }
                    }
                }

                models.splice(idx, 1);
                $scope.calculatePoints();
            }
        };

        // *******************************
        // CALCULATE AN CHECK THE POINTS
        // *******************************
        // Is there enough points to use max size
        $scope.canUseMax = function(model) {
            return ( !model.useMax && ( parseInt($scope.options.gamePoints) - parseInt($scope.vars.points) + parseInt(model.cost) ) < parseInt(model.costMax) );
        };

        // Is there enough points to change the attached
        $scope.canUseAttached = function(model, i) {
            return ( model.attached < i && ( parseInt($scope.options.gamePoints) - parseInt($scope.vars.points) + parseInt(model.cost * model.attached) ) < parseInt(model.cost * i) );
        };

        // Is there enough points to mount the model
        $scope.canUseMount = function(model) {
            return ( !model.mounted && ( parseInt($scope.options.gamePoints) - parseInt($scope.vars.points) + parseInt(model.cost) ) < parseInt(model.mount) );
        };

        // Calculate the available Points
        $scope.calculatePoints = function() {
            //$scope.calculateTierLevel();
            //$scope.checkFreeSelected();
            $scope.updateSearch();

            var sumPoints = 0;
            var casterPoints = 0;

            $.each( $scope.vars.selectedModels, function( parentIdx, model ) {
                // Change the cost to the tier bonus cost
                var cost = $scope.getModelCost(model);

                if ( /^warl|^warc/i.test(model.type) ) {
                    casterPoints = casterPoints + parseInt(cost);
                } else {
                    sumPoints = sumPoints + cost;
                }

                // If we have models in the Battle Group we must count one deeper
                $.each( model.group, function(groupIdx, gmodel) {
                    var cost = $scope.getModelCost(gmodel, false, false, parentIdx);
                    if ( /^warl|^warc/i.test(model.type) && /^warj|^warb/i.test(gmodel.type) ) {
                        casterPoints = casterPoints - cost;
                    } else {
                        sumPoints = sumPoints + cost;
                    }
                });
            });

            if ( casterPoints < 0 ) {
                $scope.vars.points = sumPoints - ( casterPoints * +1 );
            } else {
                $scope.vars.points = sumPoints;
            }

            // Set the available Caster points for later Checks
            $scope.vars.casterPoints = casterPoints < 0 ? 0 : casterPoints;

            // Check for some errors in points
            $scope.checkErrors();
        };

        // get the real model cost
        $scope.getModelCost = function(model, checkFree, getMax, groupIdx) {
            //checkFree = typeof checkFree !== 'undefined' ?  checkFree : false;
            getMax = typeof getMax !== 'undefined' ? getMax : false;
            groupIdx = typeof groupIdx !== 'undefined' ? groupIdx : false;
            var rCost;

            if ( ( getMax && model.hasOwnProperty('costMax') ) || ( model.hasOwnProperty('useMax') && model.useMax ) ) {
                rCost = parseInt(model.costMax);
            } else if ( model.hasOwnProperty('attached') ) {
                rCost = parseInt(model.cost * model.attached);
            } else if (model.hasOwnProperty('mounted') && model.mounted === true ) {
                rCost = parseInt(model.mount);
            } else {
                rCost = parseInt(model.cost);
            }

            // We have an group model and show if there any bonus
            if ( groupIdx !== false && $scope.vars.selectedModels[groupIdx].hasOwnProperty('bonded_bonus') ) {
                rCost = rCost - $scope.vars.selectedModels[groupIdx].bonded_bonus;
            }

            // only run this checks if we have an tier
            /*
            if ( $scope.vars.tier ) {
                // Check for bonus points for Models
                var bonus = $scope.vars.costAlterations[model.id];
                if (bonus) {
                    rCost -= bonus;
                }

                // Check for free models
                if ($scope.vars.freeModels.id.length > 0 && checkFree) {
                    // is the model we are check in the for free array
                    var isFree = ( $.inArray(model.id, $scope.vars.freeModels.id) !== -1 );

                    if ($scope.countSelectedModel($scope.vars.freeModels.id.join('|'), 'id').free < $scope.vars.freeModels.count && isFree) {
                        rCost = parseInt(0);
                    }
                }
            }
            */

            return rCost;
        };

        // Get true if this model with Bonus points
        $scope.isBonusCost = function(model, checkFree, groupIdx) {
            /*
            if ( !$scope.vars.tier ) {
                return false;
            }
            */

            checkFree = typeof checkFree !== 'undefined' ? checkFree : true;
            var cost = model.cost;

            if ( model.hasOwnProperty('freeModel') && model.freeModel === 1 && model.cost === 0 ) {
                return true;
            } else if ( /^unit/i.test(model.type) ) {
                if ( model.useMax === true ) {
                    cost = model.costMax;
                }
            } else if ( model.hasOwnProperty('mount') && model.mounted === true) {
                cost = model.mount;
            } else if (/^wa$/i.test(model.type)) {
                cost = model.cost * model.attached;
            }

            return cost !== $scope.getModelCost(model, checkFree, false, groupIdx);
        };

        // ****************************
        // TIER LEVEL HANDLING
        // ****************************
        // we have an Tier an check if the model allowed
        /*
        $scope.checkModelTier = function(model) {
            return $scope.vars.tier.levels[0].onlyModels.ids.indexOf(model.id) === -1;
        };

        // Calculate the tier level
        $scope.calculateTierLevel = function() {
            if ( $scope.vars.tier && $scope.vars.tier.hasOwnProperty('levels') ) {
                $scope.resetTierBonus();
                $.each($scope.vars.tier.levels, function(idx, level) {

                    var mustCount = 0;
                    if ( !level.mustHave[0] ) {
                        $scope.vars.tierLevel = level.level;
                        $scope.setTierBonus(level);
                    } else {

                        $.each(level.mustHave, function(idx, must) {
                            if ( must.min <= $scope.countSelectedModel(must.ids.join('|'), 'id').normal ) {
                                mustCount ++;
                            }
                        });

                        if ( level.mustHave.length === mustCount ) {
                            $scope.vars.tierLevel = level.level;
                            $scope.setTierBonus(level);
                        } else {
                            return false;
                        }
                    }
                });
            }
        };

        // Set the Tier bonus points or models
        $scope.setTierBonus = function(level) {
            // Add alteration of points to an model
            if ( level.costAlterations.length > 0 ) {
                $.each(level.costAlterations, function(key, val) {
                    $scope.vars.costAlterations[val.id] = val.bonus;
                });
            }
            if ( level.freeModels.length > 0 ) {
                $.each(level.freeModels, function(key, free) {
                    var eachFree = 0;
                    if ( free.forEach ) {
                        eachFree = $scope.countSelectedModel(free.forEach.join('|'), 'id').all;
                    } else {
                        eachFree = 1;
                    }
                    $scope.vars.freeModels.id = free.id;
                    $scope.vars.freeModels.count = eachFree;
                });
            }
            if ( level.faAlterations.length > 0 ) {
                $.each(level.faAlterations, function(key, fa) {
                    if ( fa.forEach ) {
                        $scope.vars.faAlterations[fa.id] = $scope.countSelectedModel(fa.forEach.join('|'), 'id').all;
                    } else {
                        $scope.vars.faAlterations[fa.id] = fa.bonus;
                    }
                });
            }
        };

        // reset the Tier Bonus
        $scope.resetTierBonus = function() {
            $scope.vars.costAlterations = [];
            $scope.vars.freeModels = {'id': [], 'count': 0};
            $scope.vars.faAlterations = [];
        };

        // Check Free Models in selected
        $scope.checkFreeSelected = function() {
            var recursive = function(models) {
                $.each(models, function (idx, model) {
                    if (model.hasOwnProperty('freeModel')) {
                        var isFree = true;
                        if ($scope.vars.freeModels.id.length > 0) {
                            // is the model we are check in the for free array
                            isFree = ( $.inArray(model.id, $scope.vars.freeModels.id) !== -1 && $scope.countSelectedModel($scope.vars.freeModels.id.join('|'), 'id').free <= $scope.vars.freeModels.count );
                        } else {
                            isFree = false;
                        }

                        if (!isFree) {
                            model.cost = model.realCost;
                            delete model.freeModel;
                            delete model.realCost;
                            $scope.calculateTierLevel();
                        }
                    }
                    recursive(model.group);
                });
            };
            recursive($scope.vars.selectedModels);
        };

        // callback if the tier changed
        $scope.changeTier = function() {
            $scope.vars.tier = $scope.vars.tiers[$scope.options.gameTier];
            $scope.clearList();
            if ( $scope.vars.tier !== undefined && $scope.vars.tier.hasOwnProperty('casterId') ) {
                $scope.addModelByString($scope.vars.tier.casterId);
                $('.army-models:eq(1) .accordion-container').slideDown().parent().siblings().find('.accordion-container').slideUp();
                $scope.updateSearch();
            }

        };
         */
        // get the real model FA
        $scope.getModelFa = function(model) {
            // only run this checks if we have an tier and not an character
            var fa = model.fa;
            /*
            if ( $scope.vars.tier && model.fa && model.fa !== 'C') {
                // Check for bonus FA for Models
                var bonus = $scope.vars.faAlterations[model.id];
                if (bonus) {
                    fa = parseInt(model.fa) + parseInt(bonus);
                }
            }
            */

            // number over 100 this model is unlimited
            if ( fa > 100 ) {
                fa = 'U';
            }

            // no val means this model is an Character
            if ( !fa ) {
                fa = 'C';
            }

            return fa;
        };

        
        // *************************************
        // STORE AND GET  THE LIST IN THE URL
        // *************************************
        // add currently selects in the URL
        $scope.updateSearch = function() {
            //get the selectedModels as string
            var search = {},
                sel = [];
            var recursive = function(models) {
                $.each(models, function(k, model) {
                    var modStr = model.id;

                    //an unit have an max size
                    if ( model.hasOwnProperty('useMax') && model.useMax === true ) {
                        modStr += ':m';
                    }

                    //a bonded model
                    if ( model.hasOwnProperty('bonded') && model.bonded === 1 ) {
                        modStr += ':b';
                    }

                    //a free model
                    if ( model.hasOwnProperty('freeModel') && model.freeModel === 1 ) {
                        modStr += ':f';
                    }

                    //a mounted model
                    if ( model.hasOwnProperty('mounted') && model.mounted === true ) {
                        modStr += ':mo';
                    }

                    //a auto attached model
                    if ( model.hasOwnProperty('auto_attached') && model.auto_attached === 1 ) {
                        modStr += ':aa';
                    }

                    //a weapon attachment with the attached size
                    if ( model.hasOwnProperty('attached') ) {
                        modStr += ':a#' + model.attached;
                    }
                    sel.push(modStr);
                    recursive(model.group);
                });
            };
            recursive($scope.vars.selectedModels);

            search.sel = btoa( sel + '@' + $scope.vars.gameRelease );
            search.caster = $scope.options.gameCaster;
            search.points = $scope.options.gamePoints;
            search.tier = $scope.options.gameTier === 0 ? '' : $scope.options.gameTier;
            search.objective =  $scope.options.gameObjective;

            $scope.vars.location = search;
            $location.search( $scope.vars.location );
        };

        // Get the selects from the URL
        // Test URL http://127.0.0.1:4001/troop-creator/#/build/trollblood?sel=VHowMixUQjA5OmJvbmRlZCxUQjExOmJvbmRlZCxUUzAz&caster=1&points=50&tier=&objective=
        $scope.restoreSearch = function() {
            var search = $location.search();
            // restore gamePoints
            if (search.points) {
                $scope.options.gamePoints = search.points;
            }
            //restore gameCaster
            if (search.caster) {
                $scope.options.gameCaster = search.caster;
            }
            // restore gameTier
            if (search.tier) {
                $scope.options.gameTier = search.tier;
                $scope.vars.tier = $scope.vars.tiers[$scope.options.gameTier];
            }
            // restore gameTier
            if (search.objective) {
                $scope.options.gameObjective = search.objective;
            }
            //restore selectedModels
            if (search.sel) {
                var decode = atob(search.sel),
                    sel = decode.replace('@' + $scope.vars.gameRelease, '').split(',');
                if ( decode.indexOf('@' + $scope.vars.gameRelease) === -1 ) {
                    // The link is not from the actual Release
                    $scope.errors = {};
                    $scope.errors.link = 'Your Link ist not compatible with the Current Game Release. We cannot restore this please build an List with the new Models!';
                    $('#error').modal();
                } else {
                    $.each(sel, function (key, val) {
                        $scope.addModelByString(val);
                    });
                    $scope.calculatePoints();
                }
            }

        };

        // adds an model by only give an string
        $scope.addModelByString = function(string) {
            //split by id an option
            var args = string.split(':');

            //search in data for id = args[0]
            var add = {};
            $.each($scope.data, function(k, grp) {
                $.each(grp.entries, function(k, entrie) {
                    if ( entrie.id === args[0] ) {
                        add = angular.copy(entrie);
                        return false;
                    }
                });
                if ( add.length > 0 ) {
                    return false;
                }
            });

            if (!$.isEmptyObject(add) ) {
                add.group = [];
                for (var i = 0; i <= args.length ; i++) {
                    if (args[i] === 'bonded' || args[i] === 'b') {
                        add.bonded = 1;
                        if ( /^soloatt|^unitcasteratt/i.test(add.type) ) {
                            add.sort = 0;
                        }
                    }

                    if (args[i] === 'useMax' || args[i] === 'm') {
                        add.useMax = true;
                    }

                    if (args[i] === 'freeModel' || args[i] === 'f') {
                        add.freeModel = 1;
                        add.realCost = add.cost;
                        add.cost = 0;
                    }

                    if ( /^attached/i.test(args[i]) || /^a#/i.test(args[i]) ) {
                        var split = args[i].split('#');
                        add.attached = parseInt(split[1]);
                    }

                    if (args[i] === 'mounted' || args[i] === 'mo') {
                        add.mounted = true;
                    }

                    if (args[i] === 'aa') {
                        add.auto_attached = 1;
                    }
                }
                // Add bonded models in .group from the last model
                if ( add.bonded === 1 ) {
                    var lastIdx = $scope.vars.selectedModels.length - 1;

                    // an UAMarchall change the type of his group to unitMarshall
                    if ( /uamarshall/i.test(add.type) ) {
                        $scope.vars.selectedModels[lastIdx].type = 'unitMarshall';
                    }

                    $scope.vars.selectedModels[lastIdx].group.push(add);
                } else {
                    $scope.vars.selectedModels.push(add);
                }
            }
        };

        // get model by ID
        $scope.getModelById = function(id) {
            var found = false;
            $.each($scope.data, function(key, grp) {
                $.each(grp.entries, function(key, model) {
                    if ( model.id === id ) {
                        found = model;
                        return true;
                    }
                });
                if ( found ) {
                    return true;
                }
            });
            return found;
        };

        // clear the complete list
        $scope.clearList = function() {
            $scope.vars.selectedModels = [];
            $scope.calculatePoints();
        };

        // Try save the link in bookmark
        $scope.saveListAsFav = function() {
            var bookmarkURL = window.location.href;
            var bookmarkTitle = document.title;

            if ('addToHomescreen' in window && window.addToHomescreen.isCompatible) {
                // Mobile browsers
                addToHomescreen({ autostart: false, startDelay: 0 }).show(true);
            } else if (window.sidebar && window.sidebar.addPanel) {
                // Firefox version < 23
                window.sidebar.addPanel(bookmarkTitle, bookmarkURL, '');
            } else if ((window.sidebar && /Firefox/i.test(navigator.userAgent)) || (window.opera && window.print)) {
                // Firefox version >= 23 and Opera Hotlist
                $(this).attr({
                    href: bookmarkURL,
                    title: bookmarkTitle,
                    rel: 'sidebar'
                }).off(e);
                return true;
            } else if (window.external && ('AddFavorite' in window.external)) {
                // IE Favorite
                window.external.AddFavorite(bookmarkURL, bookmarkTitle);
            } else {
                // Other browsers (mainly WebKit - Chrome/Safari)
                alert('Press ' + (/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl') + '+D to bookmark this page.');
            }

            return false;
        };

        $scope.devAddId = function() {
            $.each($scope.data, function(group, items) {
                $.each(items.entries, function(key, item) {
                    item.name = item.id + " - " + item.name;
                });
            });
        };

        // No sort for ng-repeat
        $scope.notSorted = function(obj){
            if (!obj) {
                return [];
            }
            return Object.keys(obj);
        };
    }]
);