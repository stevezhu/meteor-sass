var _ = Npm.require('lodash');
var Future = Npm.require('fibers/future');
var sass = Npm.require('node-sass');
var path = Npm.require('path');

Plugin.registerSourceHandlers = function(extensions, options, handler) {
	_.each(extensions, function(extension) {
		Plugin.registerSourceHandler(extension, options, handler);
	});
};

var INCLUDE_PATHS_FILENAME = 'sass_include_paths.json';
global.includePaths = [];
Plugin.registerSourceHandler(INCLUDE_PATHS_FILENAME, {archMatching: 'web'}, function(compileStep) {
	var source = compileStep.read().toString('utf8');
	var dir = path.dirname(compileStep.fullInputPath);

	var includePaths = JSON.parse(source);
	_.each(includePaths, function(includePath) {
		global.includePaths.push(path.join(dir, includePath));
	});
});

Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	if (path.basename(compileStep.inputPath)[0] === '_') {
		console.log("Compiling partial:", compileStep.inputPath);
		return;
	}

	console.log("Compiling file:", compileStep.inputPath);
	var source = compileStep.read().toString('utf8');
	var future = new Future();

	try {
		sass.render({
			file: compileStep.fullInputPath,
			sourceMap: true,
			omitSourceMapUrl: true,
			outFile: "file.css", // required for source maps in node-sass, it's removed below
			success: function(result) {
				future.return(result);
			},
			error: function(e) {
				future.throw(e);
			}
		});

		var result = future.wait();
		console.log("Result:", result);

		var sourceMap;
		if (result.map) {
			sourceMap = JSON.parse(result.map);
			delete sourceMap.file;
			sourceMap.sources = [compileStep.inputPath];
			sourceMap.sourcesContent = [source];
			console.log("Source map:", sourceMap);
			sourceMap = JSON.stringify(sourceMap);
		}

		compileStep.addStylesheet({
			path: compileStep.inputPath + ".css",
			data: result.css,
			sourceMap: sourceMap
		});
	} catch (e) {
		compileStep.error({
			message: "Sass compiler error: " + e.message,
			sourcePath: e.file || compileStep.inputPath,
			line: e.line,
			column: e.column
		});
	}
});
