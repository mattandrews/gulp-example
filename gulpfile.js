'use strict';

var watchify = require('watchify');
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
var gls = require('gulp-live-server');
var nodemon = require('gulp-nodemon');
var notify = require('gulp-notify');

var inputBase = './assets/';
var outputBase = './public/';

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

gulp.task('clean:css', function() { return del([DIRS.out.css + '/**/*']); });
gulp.task('clean:js', function()  { return del([DIRS.out.js + '/**/*']); });
gulp.task('clean:img', function() { return del([DIRS.out.img + '/**/*']); });

gulp.task('copy:img', function() {
    gulp.src(DIRS.in.img + '/**/*').pipe(gulp.dest(DIRS.out.img));
});

// var b = watchify(browserify({
//     entries: [DIRS.in.js + '/' + FILES.in.js],
//     debug: true,
//     cache: {},
//     packageCache: {},
// }));
//
// b.on('update', bundle); // on any dep update, runs the bundler
// b.on('log', gutil.log); // output build logs to terminal
//
// gulp.task('js', ['clean:js'], bundle);
//
// function bundle() {
//     return b.bundle()
//         .on('error', gutil.log.bind(gutil, 'Browserify Error'))
//         .pipe(source(FILES.out.js))
//         .pipe(buffer())
//         .pipe(sourcemaps.init({
//             loadMaps: true
//         }))
//         // .pipe(uglify()) // this is super slow
//         .pipe(sourcemaps.write('./'))
//         .pipe(gulp.dest(DIRS.out.js));
//         // .pipe(livereload());
// }

gulp.task('js', ['clean:js'], function() {
    var b = browserify({
        entries: [DIRS.in.js + '/' + FILES.in.js],
        debug: true
    });

    return b.bundle()
        .pipe(source(FILES.out.js))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        // .pipe(uglify()) // lol slow
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIRS.out.js))
        .pipe(livereload());
});

gulp.task('sass', ['clean:css', 'clean:img', 'copy:img'], function() {
    return gulp.src(DIRS.in.css + '/' + FILES.in.css)
        .pipe(sourcemaps.init())
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

gulp.task('rev', ['sass', 'js'], function() {
    return gulp.src(DIRS.out.root + '/**/*')
        .pipe(rev())
        .pipe(revcssurls())
        .pipe(revdel())
        .pipe(gulp.dest(DIRS.out.root))
        .pipe(rev.manifest(FILES.assets))
        .pipe(gulp.dest(DIRS.in.root));
});

gulp.task('serve', ['watch'], function() {
    var server = gls.new('server.js');
    server.start();
});

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

gulp.task('default', ['server']);

gulp.task('build', ['sass', 'js', 'rev']);
gulp.task('dev', ['sass', 'js']);

gulp.task('watch', function() {
    livereload.listen();

    gulp.watch(DIRS.in.css + '/**/*.scss', ['sass']);
    gulp.watch(DIRS.in.js + '/**/*.js', ['js']);
    // gulp.watch(DIRS.in.root + FILES.assets, ['server']);
});

// gulp.task('lol', ['build'], function () {
//     var stream = nodemon({
//         script: 'server.js',
//         watch: DIRS.in.root + FILES.assets,
//         tasks: ['build']
//     });
//     return stream;
// });
