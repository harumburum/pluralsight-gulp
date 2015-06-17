module.exports = function() {
	var client = './src/client/';
	var clientApp = client + 'app/';
	var server = './src/server/';
	var temp = './.tmp/';
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
		less: client + 'styles/styles.less',
		bower: {
			json: require('./bower.json'),
			directory: './bower_components/',
			ignorePath: '../..'
		},
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
		}
	};
	
	config.getWiredepDefaultOptions = function() {
		var options = {
			bowerJson: config.bower.json,
			directory: config.bower.directory,
			ignorePath: config.bower.ignorePath
		};
		return options;
	};
	
	return config;
};
