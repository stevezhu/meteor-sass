Package.describe({
	name: "stevezhu:sass",
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "2.0.0",
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
		'lodash': '3.5.0',
		'minimist': '1.1.1',
		'mkdirp': '0.5.0'
	}
});
