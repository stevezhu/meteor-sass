Package.describe({
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "1.2.0",
	git: "https://github.com/stevezhu/meteor-sass.git"
});

Package._transitional_registerBuildPlugin({
	name: 'compileSass',
	use: [],
	sources: [
		'plugin/compile-sass.js'
	],
	npmDependencies: {
		'node-sass': '0.9.3',
		'lodash': '2.4.1',
		'minimist': '1.1.0'
	}
});

Package.onTest(function(api) {
	api.use(['test-helpers', 'tinytest']);
	api.use(['ui', 'templating', 'stevezhu:sass']);
	api.addFiles('tests/sass_include_paths.json', 'server');
	api.addFiles([
		'tests/test.scss',
		'tests/test.html',
		'tests/test.js'
	], 'client');
});
