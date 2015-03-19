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
			outFile: "file.css",
			success: function(result) {
				future.return(result);
			},
			error: function() {
				future.throw("wot error");
			}
		});

		var result = future.wait();
		console.log("Result:", result);

		if (result.map) {
			var sourceMap = JSON.parse(result.map);
			delete sourceMap.file;
			sourceMap.sources = [compileStep.inputPath];
			sourceMap.sourcesContent = [source];
			console.log("Source map:", sourceMap);
		}
	} catch (e) {
		console.log(e);
	}
});
