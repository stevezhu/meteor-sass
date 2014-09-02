Package.describe({
	summary: "Meteor package for using sass or scss stylesheets.",
	version: "1.0.0",
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
		'lodash': '2.4.1'
	}
});
