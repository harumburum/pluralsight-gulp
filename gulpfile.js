/// <reference path="typings/node/node.d.ts"/>
var gulp = require('gulp');
var args = require('yargs').argv;
//var browserSync = require('browser-sync');
var browserSync = require('browser-sync').create();
var del = require('del');
var config = require('./gulp.config')();

var path = require('path');
var _ = require('lodash');

var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.PORT || config.defaultPort;

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('notify', function() {
	var notifier = require('node-notifier');
	
	notifier.notify({
	  'title': 'My notification',
	  'message': 'Hello, there!'
	});
});

gulp.task('notify-with-sound', function() {
	var notifier = require('node-notifier');
	var notifyOptions = {
		'title': 'My notification',
	    'message': 'Hello, there!',
		'sound': true,
		'contentImage': void 0,
		'icon': path.join(__dirname, 'gulp.png'),
	};
	notifier.notify(notifyOptions);
});

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

gulp.task('fonts', function() {
	log('Copying fonts');
	return gulp
			.src(config.fonts)
			.pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', function() {
	log('Copying and compressing images');
	
	return gulp
		.src(config.images)
		.pipe($.imagemin({optiomizationLevel: 4}))
		.pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean-fonts', function(done) {
	var files = config.build + 'fonts/**/*.*';
	clean(files, done);
});

gulp.task('clean-images', function(done) {
	var files = config.build + 'images/**/*.*';
	clean(files, done);
});

gulp.task('clean-styles', function(done) {
	var files = config.temp + '**/*.css';
	clean(files, done);
});

gulp.task('clean-code', function(done) {
	var files = [].concat(
		config.temp + '**/*.js',
		config.build + '**/*.html',
		config.build + 'js/**/*.js'
	); 
	clean(files, done);
});

gulp.task('clean', function (done) {
	var delconfig = [].concat(config.build, config.temp);
	log('Cleaning: ' + $.util.colors.blue(delconfig));
	del(delconfig, done);
});

gulp.task('templatecache', ['clean-code'], function() {
	log('Creating Angular $templateCache');
	
	return gulp
			.src(config.htmltemplates) //TODO
			.pipe($.minifyHtml({empty: true})) //TODO
			.pipe($.angularTemplatecache(
				config.templateCache.file,
				config.templateCache.options)) //TODO
			.pipe(gulp.dest(config.temp));
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

gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function() {
	log('Wire up the bower css js and our app js into the html');
	return gulp
		.src(config.index)
		.pipe($.inject(gulp.src(config.css)))	
		.pipe(gulp.dest(config.client));
});

gulp.task('build', ['optimize', 'images', 'fonts'], function() {
	log('Building everything');
	
	var msg = {
		title: 'gulp build',
		subtitle: 'Deployed to the build folder',
		message: 'Running gulp serve-build'
	};
	del(config.temp);
	log(msg);
	
	notify(msg)
});

gulp.task('optimize', ['inject', 'test'], function() {
	log('Optimizing the js, css, html');
	
	var assets = $.useref.assets({searchPath: './'});
	var templateCache = config.temp + config.templateCache.file;
	var cssFilter = $.filter('**/*.css');
	var jsLibFilter = $.filter('**/' + config.optimized.lib);
	var jsAppFilter = $.filter('**/' + config.optimized.app);
	
	return gulp
			.src(config.index)
			.pipe($.plumber())
			.pipe($.inject(gulp.src(templateCache, {read: false}), {
				starttag: '<!-- inject:templates:js -->'
			}))
			.pipe(assets)
			
			//css
			.pipe(cssFilter)
			.pipe($.csso())
			.pipe(cssFilter.restore())
			//end css
			
			//js app
			.pipe(jsAppFilter)
			.pipe($.ngAnnotate())
			//.pipe($.uglify())
			.pipe(jsAppFilter.restore())
			//end js app
			
			//js
			.pipe(jsLibFilter)
			.pipe($.uglify())
			.pipe(jsLibFilter.restore())
			//end js
			
			.pipe($.rev())
			
			.pipe(assets.restore())
			.pipe($.useref())
			
			.pipe($.revReplace())
			.pipe(gulp.dest(config.build))
			.pipe($.rev.manifest())			
			.pipe(gulp.dest(config.build));
});
/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*.-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function(){
	var msg = 'Bumping versions';
	
	var type = args.type;
	var version = args.version;
	var options = { };
	if(version){
		options.version = version;
		msg += ' to a ' + type;
	} else {
		options.type = type;
		msg += ' for a ' + type;
	}
	log(msg);
	return gulp	
			.src(config.packages)
			.pipe($.print())
			.pipe($.bump(options))
			.pipe(gulp.dest(config.root));
	
});

gulp.task('serve-build', ['build'], function() {
	serve(false);
});

gulp.task('serve-dev', ['inject'], function() {
	serve(true);
});

// Testing

gulp.task('test', ['templatecache'], function(done) {
	startTests(true /* singleRun */, done);
});


gulp.task('autotest', ['templatecache'], function(done) {
	startTests(false /* singleRun */, done);
});

//////

function serve(isDev) {
	
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
			startBrowserSync(isDev);
		})
		.on('crash', function(){
			log('*** nodemon crashed ***');
		})
		.on('exit', function(){
			log('*** nodemon exited cleanly ***');
		});
}

function changeEvent(event) {
	var srcPattern  = new RegExp('/.*(?=/' + config.source + ')/');
	log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function notify(options) {
	var notifier = require('node-notifier');
	var notifyOptions = {
		'title': options.title,
		'subtitle': options.subtitle,
	    'message': options.message,
		'sound': true,
		'icon': path.join(__dirname, 'gulp.png')
	};
	notifier.notify(notifyOptions);
}

function startBrowserSync(isDev) {
	if (args.nosync || browserSync.active) {
		return;
	}
		
	log('Starting browser-sync on port ' + port);
	
	if(isDev) {
		gulp.watch([config.less], ['styles'])
	 		.on('change', function(event){ changeEvent(event); });
	} else {
		gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
	 		.on('change', function(event){ changeEvent(event); });
	}
	
	var options = {
		proxy: 'localhost:' + port,
		port: 3030,
		files: isDev ? [
			config.client + '**/*.*',
			'!' + config.less,
			config.temp + '**/*.css'
		] : [],
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

function startTests(singleRun, done) {
	var karma = require('karma').server;
	var excludeFiles = [];
	var serverSpecs = config.serverIntegrationSpecs;
	
	excludeFiles = serverSpecs;
	
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		exclude: excludeFiles,
		singleRun: !!singleRun
	}, karmaCompleted);
			
	function karmaCompleted(karmaResult) {
		log('Karma completed!');
		if(karmaResult === 1) {
			done('karma: tests failed with code ' + karmaResult);
		} else {
			done();
		}
	}
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
