/* jshint node: true */
'use strict';

var browserify   = require('browserify');
var gulp         = require('gulp');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var uglify       = require('gulp-uglify');
var sourcemaps   = require('gulp-sourcemaps');
var gutil        = require('gulp-util');
var sass         = require('gulp-sass');
var del          = require('del');
var livereload   = require('gulp-livereload');
var rev          = require('gulp-rev');
var revcssurls   = require('gulp-rev-css-url');
var revdel       = require('gulp-rev-delete-original');
var autoprefixer = require('gulp-autoprefixer');
var nodemon      = require('gulp-nodemon');
var argv         = require('yargs').argv;
var gulpif       = require('gulp-if');
var amdOptimize  = require('amd-optimize');
var concat       = require('gulp-concat');
var mocha        = require('gulp-mocha');
var jshint       = require('gulp-jshint');
var stylish      = require('jshint-stylish');
var addSrc       = require('gulp-add-src');
var babel        = require('gulp-babel');

// can be removed after project is initially created
var prompt       = require('gulp-prompt');
var replace      = require('gulp-replace');

// define main directories
var inputBase  = './assets/';
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
    assets: 'assets.json',
    defaultProjectName: 'your-name-here' // replaced with user input on setup
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
        .pipe(babel())
        .pipe(gulpif(argv.production, uglify())) // super slow!
        .on('error', gutil.log)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DIRS.out.js))
        .pipe(livereload());
});

// todo – make paths less shit
gulp.task('requirejs', ['clean:assets', 'clean:js'], function () {
    return gulp.src(DIRS.in.js + '/libs/echo/**/*.js')
        .pipe(amdOptimize("echo"))
        .pipe(addSrc.prepend('./assets/js/libs/echo/almond.js'))
        .pipe(addSrc.append('./assets/js/libs/echo/_start.js'))
        .pipe(concat('analytics.js'))
        .pipe(uglify()) // super slow!
        .pipe(gulp.dest(DIRS.in.js))
        .pipe(livereload());
});

gulp.task('jsbundle', ['js'], function () {
    return gulp.src([
        DIRS.in.js + '/analytics.js',
        DIRS.out.js + '/' + FILES.out.js
    ]).pipe(concat('bundle.js'))
    .pipe(gulp.dest(DIRS.out.js));
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

// run mocha tests
gulp.task('mocha', function () {
    return gulp.src('./test/**/*.js', {
        read: false
    }).pipe(mocha({
        reporter: 'spec',
        require: 'env-test'
    }));
});

// run jshint
gulp.task('lint', function() {
    return gulp.src([
        DIRS.in.js + '/**/*.js',
        '!' + DIRS.in.js + '/libs/',
        '!' + DIRS.in.js + '/libs/**',
    ])
    .pipe(jshint({}))
    .pipe(jshint.reporter(stylish));
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

// can be deleted after project is initially created
gulp.task('setup', function () {
    gulp.src('./setup.sh') // never gets touched
	.pipe(prompt.prompt({
		type: 'input',
		name: 'projectName',
		message: 'What is the name of your project? (eg. dg-foo-bar)'
	}, function(res) {
        gulp.src([
            'project.json',
            'package.json',
            'bake-scripts/create-node-opts.js',
            'infrastructure/src/component.py',
            'infrastructure/output/component.json',
            'infrastructure/output/component.json',
            'scripts/*.js',
            'scripts/ci',
            'scripts/deploy.sh',
            'config/default.json'
        ]).pipe(replace(FILES.defaultProjectName, res.projectName))
        .pipe(gulp.dest('.'));
        console.log('Replaced references to ' + FILES.defaultProjectName + ' - now delete the Gulp setup task!');
	}));
});

// dev task: start the server and watch for changes
gulp.task('default', ['clean:assets', 'dev', 'server']);

// used on LIVE (add --production flag to uglify files)
gulp.task('build', ['sass', 'jsbundle', 'rev']);

// used for local dev testing (doesn't version files)
gulp.task('dev', ['sass', 'jsbundle']);

// watch static files for changes and recompile
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch(DIRS.in.css + '/**/*.scss', ['sass']);
    gulp.watch(DIRS.in.js + '/**/*.js', ['jsbundle']);
});
