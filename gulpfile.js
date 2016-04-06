'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var del = require('del');
var livereload = require('gulp-livereload');
var rev = require('gulp-rev');
var revcssurls = require('gulp-rev-css-url');
var revdel = require('gulp-rev-delete-original');
var autoprefixer = require('gulp-autoprefixer');
var nodemon = require('gulp-nodemon');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');

// define main directories
var inputBase = './assets/';
var outputBase = './public/';

// outline where static files live (or end up)
var DIRS = {
    in: {
        root: inputBase,
        css:  inputBase + 'scss',
        js:   inputBase + 'js',
        img:  inputBase + 'img',
    },
    out: {
        root: outputBase,
        css:  outputBase + 'css',
        js:   outputBase + 'js',
        img:  outputBase + 'img',
    }
};

// define specific names for in/out files
var FILES = {
    in: {
        js: 'main.js',
        css: 'main.scss'
    },
    out: {
        js: 'bundle.js',
        css: 'style.css'
    },
    assets: 'assets.json'
};

// clean out folders of generated assets
gulp.task('clean:css', function() { return del([DIRS.out.css + '/**/*']); });
gulp.task('clean:js', function()  { return del([DIRS.out.js + '/**/*']); });
gulp.task('clean:img', function() { return del([DIRS.out.img + '/**/*']); });
gulp.task('clean:assets', function() { return del([DIRS.in.root + FILES.assets]); });

// copy images to public dir
// @TODO could minify them?
gulp.task('copy:img', function() {
    gulp.src(DIRS.in.img + '/**/*').pipe(gulp.dest(DIRS.out.img));
});

// compile JS (after cleaning them out)
gulp.task('js', ['clean:assets', 'clean:js'], function() {
    var b = browserify({
        entries: [DIRS.in.js + '/' + FILES.in.js],
        debug: true
    });

    // minify on LIVE, sourcemap on DEV
    return b.bundle()
        .pipe(source(FILES.out.js))
        .pipe(buffer())
        .pipe(gulpif(!argv.production, sourcemaps.init({loadMaps: true})))
        .pipe(gulpif(argv.production, uglify())) // super slow!
        .on('error', gutil.log)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DIRS.out.js))
        .pipe(livereload());
});

// compile Sass (after cleaning and moving images)
// references to images will be replaced (on --production/LIVE)
// with cachebusted versions
gulp.task('sass', ['clean:assets', 'clean:css', 'clean:img', 'copy:img'], function() {
    return gulp.src(DIRS.in.css + '/' + FILES.in.css)
        .pipe(gulpif(!argv.production, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DIRS.out.css))
        .pipe(livereload());
});

// hash/version static files and replace image paths in CSS
// then write an output file (only on LIVE)
gulp.task('rev', ['sass', 'js'], function() {
    return gulp.src(DIRS.out.root + '/**/*')
        .pipe(rev())
        .pipe(revcssurls())
        .pipe(revdel())
        .pipe(gulp.dest(DIRS.out.root))
        .pipe(rev.manifest(FILES.assets))
        .pipe(gulp.dest(DIRS.in.root));
});

// a dev server which reloads express when server-side JS changes
// and watches for changes to client-side code
gulp.task('server', ['watch'], function() {
    nodemon({
        script: 'server.js',
        ext: 'js',
        ignore: [
            DIRS.in.js,
            DIRS.out.js
        ],
        env: {
            'NODE_ENV': 'development'
        }
    });
});

// dev task: start the server and watch for changes
gulp.task('default', ['clean:assets', 'dev', 'server']);

// used on LIVE (add --production flag to uglify files)
gulp.task('build', ['sass', 'js', 'rev']);

// used for local dev testing (doesn't version files)
gulp.task('dev', ['sass', 'js']);

// watch static files for changes and recompile
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch(DIRS.in.css + '/**/*.scss', ['sass']);
    gulp.watch(DIRS.in.js + '/**/*.js', ['js']);
});
