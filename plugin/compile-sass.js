var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	Future = Npm.require('fibers/future'),
	sass = Npm.require('node-sass');

var readJSON = function(jsonPath) {
	var json = fs.readFileSync(jsonPath);
	try {
		return JSON.parse(json);
	} catch (err) {
		console.error("Failed to parse json file: " + jsonPath, err);
		return {};
	}
};

var sourceHandler = function(compileStep) {
	var fullInputPath = compileStep._fullInputPath;
	// return if partial
	if (path.basename(fullInputPath)[0] === '_') {
		return;
	}

	// OPTIONS ========================================

	var optionsFile = path.join(process.cwd(), 'sass.json');
	var options = fs.existsSync(optionsFile) ? readJSON(optionsFile) : {};
	options = _.extend(options, {
		sourceComments: 'none',
		includePaths: [],
		stats: {}
	});
	options.file = fullInputPath;
	if (!_.isArray(options.includePaths)) {
		options.includePaths = [options.includePaths];
	}
	options.includePaths.push(path.dirname(fullInputPath));

	// COMPILE ========================================

	var css;
	try {
		css = sass.renderSync(options);
	} catch (err) {
		err = err.replace(fullInputPath + ':', '').split(':');
		var errMessage = err[1].trim() + ': ' + err[2].trim(),
			errLine = err[0];
		compileStep.error({
			message: 'Sass compiler ' + errMessage,
			sourcePath: compileStep.inputPath,
			line: errLine
		});
		return;
	}

	compileStep.addStylesheet({
		path: compileStep.inputPath + ".css",
		data: css
	});
};

Plugin.registerSourceHandler("scss", {archMatching: 'web'}, sourceHandler);
Plugin.registerSourceHandler("sass", {archMatching: 'web'}, sourceHandler);
