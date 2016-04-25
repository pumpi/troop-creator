'use strict';

var jsFiles = [
    "app.js",
    "app/**/**/control/*.js",
    "app/*.js",
    "app/**/*.js"
];

var jsFilesVendor = [
    "lib/bower/jquery/dist/jquery.js",
    "lib/bower/jquery-ui/jquery-ui.js",
    "lib/bower/jqueryui-touch-punch/jquery.ui.touch-punch.js",
    "lib/bower/angularjs/angular.js",
    "lib/bower/angular-route/angular-route.js",
    "lib/bower/commonmark/dist/commonmark.js",
    "lib/bower/angular-commonmark/angular-commonmark.js",
    "lib/bower/angular-dragdrop/src/angular-dragdrop.js",
    "lib/bower/favico.js/favico.js",
    "lib/bower/bootstrap-sass/assets/javascripts/bootstrap/modal.js",
    "lib/bower/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js",
    "lib/bower/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
    "build/modernizr-output.js"
];

var sassFiles = [
    "sass/*.scss"
];

module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                compress: false,
                sourceMap: true
            },
            static: {
                files: {
                    'static/<%= pkg.name %>.min.js': jsFiles,
                    'static/<%= pkg.name %>.vendor.min.js': jsFilesVendor
                }
            }
        },

        concat: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap: true
            },
            dist: {
                nonull: true,
                src: jsFiles,
                dest: 'static/<%= pkg.name %>.min.js'
            },
            css: {
                nonull: true,
                src: ['build/sass.css'],
                dest: 'static/<%= pkg.name %>.css'
            }
        },

        modernizr: {
            dist: {
                "crawl": false,
                "customTests": [],
                "dest": "build/modernizr-output.js",
                "tests": [
                    "touchevents"
                ],
                "options": [
                    "setClasses"
                ],
                "uglify": true
            }
        },

        jshint: {
            all: {
                src: ["js/**/*.js", "app/**/*.js"],
                options: {
                    force: true,
                    reporter: require('jshint-stylish'),
                    "curly": true,
                    "eqnull": true,
                    "eqeqeq": true,
                    "undef": true,
                    "globalstrict": true,
                    "globals": {
                        "jQuery": true,
                        "require": true,
                        "angular": true,
                        "console": true,
                        "forge": true,
                        "mdk": true,
                        "$": true,
                        "troopCreator": true,
                        "window": true,
                        "alert": true,
                        "Favico": true,
                        "document": true,
                        "navigator": true,
                        "btoa": true,
                        "atob": true,
                    }
                }
            }
        },

        sass: {
            options: {
                sourceMap: true,
                includePaths: ['sass']
            },
            dist: {
                files: {
                    'build/sass.css': sassFiles
                }
            }
        },

        watch: {
            scripts: {
                files: jsFiles,
                tasks: ['newer:jshint', 'newer:concat']
            },

            sass: {
                files: ['sass/**/*.scss'],
                tasks: ['newer:sass', 'newer:concat']
            }
        }
    });

// Load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks("grunt-modernizr");

// Default task(s).
    grunt.registerTask('prod', ['jshint', 'sass', 'modernizr', 'uglify']); // generate prod files
    grunt.registerTask('dev', ['sass', 'concat', 'jshint']); // Generate dev files
    grunt.registerTask('dev-watch', ['sass', 'concat', 'jshint', 'watch']); // Continously generate dev files
};
