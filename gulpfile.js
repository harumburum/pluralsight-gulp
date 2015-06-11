var gulp = require('gulp');
var args = require('yargs').argv;
//var browserSync = require('browser-sync');
var browserSync = require('browser-sync').create();
var del = require('del');
var config = require('./gulp.config')();

var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.PORT || config.defaultPort;

gulp.task('vet', function() {
	log('Analizyng source with JSHing and JSCS');
	return gulp
		.src(config.alljs)
		.pipe($.if(args.verbose, $.print()))
		.pipe($.jscs())
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
		.pipe($.jshint.reporter('fail'));
});

gulp.task('styles', ['clean-styles'], function() {
	log('Compiling Less --> CSS');
	return gulp
		.src(config.less)
		.pipe($.if(args.verbose, $.print()))
		.pipe($.plumber())
		.pipe($.less())
		.pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
		.pipe(gulp.dest(config.temp));
});

gulp.task('clean-styles', function(done) {
	var files = config.temp + '**/*.css';
	clean(files, done);
});

// gulp.task('less-watcher', function() {
// 	gulp.watch([config.less], ['styles']);
// });

gulp.task('wiredep', function() {
	log('Wire up the bower css js and our app js into the html');
	var options = config.getWiredepDefaultOptions();
	var wiredep = require('wiredep').stream;
	return gulp
		.src(config.index)
		.pipe(wiredep(options))
		.pipe($.inject(gulp.src(config.js)))	
		.pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function() {
	log('Wire up the bower css js and our app js into the html');
	return gulp
		.src(config.index)
		.pipe($.inject(gulp.src(config.css)))	
		.pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function() {
	var isDev = true;
	
	var nodeOptions = {
		script: config.nodeServer,
		delayTime: 1,
		env: {
			'PORT': port,
			'NODE_ENV': isDev ? 'dev' : 'build'
		},
		watch: [config.server]	
	};
	
	return $.nodemon(nodeOptions)
		.on('restart', function(ev) {
			log('*** nodemon restarted ***');
			log('files changed on restart:\n' + ev);
			setTimeout(function(){
				browserSync.notify('reloading now ...');
				browserSync.reload({stream: false});
			}, config.browserReloadDelay);
		})
		.on('start', function(){
			log('*** nodemon started ***');
			startBrowserSync();
		})
		.on('crash', function(){
			log('*** nodemon crashed ***');
		})
		.on('exit', function(){
			log('*** nodemon exited cleanly ***');
		});
});


//////

function changeEvent(event) {
	var srcPattern  = new RegExp('/.*(?=/' + config.source + ')/');
	log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
	if (args.nosync || browserSync.active) {
		return;
	}
		
	log('Starting browser-sync on port ' + port);
	
	 gulp.watch([config.less], ['styles'])
	 	.on('change', function(event){ changeEvent(event); });
	
	var options = {
		proxy: 'localhost:' + port,
		port: 3030,
		files: [
			config.client + '**/*.*',
			'!' + config.less,
			config.temp + '**/*.css'
		],
		ghostMode: {
			clicks: true,
			location: false, 
			forms: true,
			scroll: true	
		},
		injectChanges: true,
		logFileChanges: true,
		logLevel: 'debug',
		logPrefix: 'gulp-patterns',
		notify: true,
		reloadDeley: 0 //1000
	};
	browserSync.init(options);
}

function clean(path, done) {
	log('Cleaning: ' + $.util.colors.red(path));
	del(path, done);
}

function log(msg) {
    if (typeof(msg) === 'object') {
		for (var item in msg) {
			if (msg.hasOwnProperty(item)) {
				$.util.log($.util.colors.red(msg[item]));
			}
		}
	} else {
		$.util.log($.util.colors.red(msg));
	}
}