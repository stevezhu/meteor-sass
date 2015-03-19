Package.describe({
	name: "stevezhu:sass",
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "1.4.0",
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
		'node-sass': '2.0.1',
		'lodash': '3.5.0',
		'minimist': '1.1.1',
		'mkdirp': '0.5.0'
	}
});

Package.onTest(function(api) {
	api.use(['test-helpers', 'tinytest']);
	api.use(['ui', 'templating']);
	api.use("stevezhu:sass");
	api.addFiles('tests/sass_include_paths.json', 'server');
	api.addFiles([
		'tests/test.scss',
		'tests/test.html',
		'tests/test.js'
	], 'client');
});
