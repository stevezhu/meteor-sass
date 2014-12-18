Package.describe({
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "1.3.7",
	git: "https://github.com/stevezhu/meteor-sass.git"
});

Package.registerBuildPlugin({
	name: 'compileSass',
	use: [],
	sources: [
		'plugin/compile-sass-utils.js',
		'plugin/compile-sass.js'
	],
	npmDependencies: {
		'node-sass': '0.9.6',
		'lodash': '2.4.1',
		'minimist': '1.1.0',
		'mkdirp': '0.5.0'
	}
});

Package.onTest(function(api) {
	api.use(['test-helpers', 'tinytest']);
	api.use(['ui', 'templating']);
	api.use('stevezhu:sass@1.3.7');
	api.addFiles('tests/sass_include_paths.json', 'server');
	api.addFiles([
		'tests/test.scss',
		'tests/test.html',
		'tests/test.js'
	], 'client');
});
