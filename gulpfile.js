'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var packageJson = require('./package.json');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

// disable bunyan logging to stdout by default, makes mocha output ugly
if (!_.isString(process.env.LOGGING_CONSOLE_LEVEL)) {
  process.env.LOGGING_CONSOLE_LEVEL = 'OFF';
}

gulp.task('test', function(cb) {
  gulp.src(['lib/**/*.js'])
      .pipe(istanbul())
      .pipe(istanbul.hookRequire())
      .on('finish', function() {
        gulp.src(['test/**/*.js'])
            .pipe(mocha())
            .pipe(istanbul.writeReports({
              dir: './reports/coverage'
            }))
            .pipe(istanbul.enforceThresholds({
              thresholds: {
                global: 50
              }
            }))
            .on('end', cb);
      });
});

gulp.task('default', ['test']);
