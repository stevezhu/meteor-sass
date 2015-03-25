Package.describe({
	name: "stevezhu:sass",
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "2.0.1",
	git: "https://github.com/stevezhu/meteor-sass.git"
});

Package.registerBuildPlugin({
	name: 'compileSass',
	use: [],
	sources: [
		'plugin/compile-sass.js'
	],
	npmDependencies: {
		'node-sass': '2.0.1',
		'lodash': '3.5.0'
	}
});

Package.onTest(function(api) {
  api.use(['test-helpers', 'tinytest']);
  api.use('templating');
  api.use('stevezhu:sass');
  api.addFiles([
  	'tests/test.sass',
  	'tests/test.html',
  	'tests/test.js'
  ], 'client');
});
