var _ = Npm.require('lodash');
var Future = Npm.require('fibers/future');
var sass = Npm.require('node-sass');

Plugin.registerSourceHandlers = function(extensions, options, handler) {
	_.each(extensions, function(extension) {
		Plugin.registerSourceHandler(extension, options, handler);
	});
};

Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	
});
