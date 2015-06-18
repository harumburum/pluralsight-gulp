module.exports = function() {
	var client = './src/client/';
	var clientApp = client + 'app/';
	var report = './report/';
	var server = './src/server/';
	var temp = './.tmp/';
	var root = './';
	var wiredep = require('wiredep');
	var bowerFiles = wiredep({devDependencies: true})['js'];
	
	var config = {
		alljs : [
			'./src/**/*.js',
			'./*.js'
		],
		build: './build/',
		client: client,
		css: temp + 'styles.css',
		html: clientApp  + '**/*.html',
		fonts: './bower_components/font-awesome/fonts/**/*.*',
		htmltemplates: clientApp + '**/*.html',
		images: client + 'images/**/*.*',
		index: client + 'index.html',
		js: [
			clientApp + '**/*.module.js',
			clientApp + '**/*.js',
			'!' + clientApp + '**/*.spec.js',
		],
		server: server,
		temp: temp,
		root: root,
		report: report,
		less: client + 'styles/styles.less',
		bower: {
			json: require('./bower.json'),
			directory: './bower_components/',
			ignorePath: '../..'
		},
		packages : [
			'./package.json',
			'./bower.json'
		],
		defaultPort: 7203,
		nodeServer: './src/server/app.js',
		browserReloadDelay: 1000,
		
		templateCache: {
			file: 'templates.js',
			options: {
				module: 'app.core',
				standAlone: false,
				root: 'app/'
			}
		},
		
		optimized : {
			app: 'app.js',
			lib: 'lib.js'
		},
		
		/**
		 * Karma and testing settings
		 */
		 specHelpers: [
			 client + 'test-helpers/*.js'
		 ],
		 serverIntegrationSpecs: [
			 client + 'tests/server-integration/**/*.spec.js'
		 ],
		  
	};
	
	config.getWiredepDefaultOptions = function() {
		var options = {
			bowerJson: config.bower.json,
			directory: config.bower.directory,
			ignorePath: config.bower.ignorePath
		};
		return options;
	};
	
	config.karma = getKarmaOptions();
	
	return config;
	
	//// 
	
	function getKarmaOptions() {
		var options = {
			files: [].concat(
				bowerFiles, 
				config.specHelpers,
				client + '**/*.module.js',
				client + '**/*.js',
				temp + config.templateCache.file,
				config.serverIntegrationSpecs
			),
			exclude: [],
			coverage: {
				dir: report + 'converage',
				reporters: [
					{type: 'html', subdir: 'report-html'},
					{type: 'lcov', subdir: 'report-lcov'},
					{type: 'text-summary'}
				]
			},
			preprocessors: {}
		};
		options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage'];
		
		return options;
	}
};
