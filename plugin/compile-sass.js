var _ = Npm.require('lodash');
var Future = Npm.require('fibers/future');
var sass = Npm.require('node-sass');

Plugin.registerSourceHandlers = function(extensions, options, handler) {
	_.each(extensions, function(extension) {
		Plugin.registerSourceHandler(extension, options, handler);
	});
};

Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	var source = compileStep.read().toString('utf8');
	console.log("Compiling file:", compileStep.inputPath);
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
