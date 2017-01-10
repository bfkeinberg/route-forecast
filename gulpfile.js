// requirements
var gulp = require('gulp');
var gulpBrowser = require("gulp-browser");
var del = require('del');
var size = require('gulp-size');
var reactify = require('reactify');
var path = require('path');
var gutil = require('gulp-util');
var fse = require('fs-extra');

// tasks

processRelativeUrl = function(relativeUrl) {
    var stripQueryStringAndHashFromPath = function(url) {
        return url.split('?')[0].split('#')[0];
    };
    var rootDir = path.resolve(process.cwd(), '.');
    var relativePath = stripQueryStringAndHashFromPath(relativeUrl);
    var queryStringAndHash = relativeUrl.substring(relativePath.length);

    //
    // Copying files from '../node_modules/bootstrap/' to 'dist/vendor/bootstrap/'
    //
    var prefix = 'node_modules/';
    if (relativeUrl.startsWith(relativePath)) {
        var vendorPath = 'static/scripts/js/' + relativePath.substring(prefix.length);
        gutil.log('Vendor path is', vendorPath, 'prefix length', prefix.length);
        gutil.log('relative url', relativeUrl, 'relative path is', relativePath);
        var source = path.join(rootDir, relativePath);
        var target = path.join(rootDir, 'src/' + vendorPath);

        gutil.log('Copying file from ' + JSON.stringify(source) + ' to ' + JSON.stringify(target));
        fse.copySync(source, target);

        // Returns a new path string with original query string and hash fragments
        return vendorPath + queryStringAndHash;
    }

    return relativeUrl;
}

let transforms = [
    {
        transform: "reactify",
        options: {debug: true}
    },
    {
        transform: "browserify-css",
        options: {global:true, processRelativeUrl: processRelativeUrl}
    }
];

gulp.task('transform', function () {
  var stream = gulp.src('./src/static/scripts/jsx/*.js')
    .pipe(gulpBrowser.browserify(transforms))
    .pipe(gulp.dest('./src/static/scripts/js/'))
    .pipe(size());
  return stream;
});

gulp.task('css', function() {
    return gulp.src('./src/static/scripts/jsx/*.js')
    .pipe(gulpBrowser.browserify(transforms))
    .pipe(gulp.dest('./src/static/scripts/js/'))
    .pipe(size())
});
    
gulp.task('del', function () {
  return del(['./src/static/scripts/js']);
});

gulp.task('default', ['del'], function() {
  gulp.start('transform');
  gulp.watch('./src/static/scripts/jsx/*.js', ['transform']);
});
