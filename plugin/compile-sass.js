var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	sass = Npm.require('node-sass'),
	files = Npm.require('./files.js');

var argv = Npm.require('minimist')(process.argv.slice(2)),
	command = _.first(argv._);

var findRootDir = function(filePath) {
	if (command === 'test-packages') {
		return files.findPackageDir(filePath);
	} else {
		return files.findAppDir(filePath);
	}
};

var readJSON = function(jsonPath, compileStep) {
	try {
		var data = fs.readFileSync(jsonPath);
		try {
			return JSON.parse(data);
		} catch (err) {
			// don't submit error if file is empty
			if (data.length > 0) {
				compileStep.error({
					message: err.name + ': ' + err.message,
					sourcePath: path.relative(process.cwd(), jsonPath)
				});
			}
		}
	} catch (err) {
		// ignore
	}
	return {};
};

var writeJSON = function(jsonPath, json, compileStep) {
	var data = JSON.stringify(json, null, 2);
	try {
		fs.writeFileSync(jsonPath, data);
	} catch (err) {
		compileStep.error({
			message: err.name + ': ' + err.message,
			sourcePath: path.relative(process.cwd(), jsonPath)
		});
	}
};

Plugin.registerSourceHandlers = function(extensions, options, handler) {
	_.each(extensions, function(extension) {
		Plugin.registerSourceHandler(extension, options, handler);
	});
};

var OPTIONS_FILENAME = 'sass_options.json';
Plugin.registerSourceHandler(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	// return if partial
	if (path.basename(compileStep.inputPath)[0] === '_') {
		return;
	}

	var fullInputPath = compileStep._fullInputPath;
	var rootDir = findRootDir(fullInputPath);

	// OPTIONS ========================================

	var optionsPath = path.join(rootDir, OPTIONS_FILENAME);
	var options = readJSON(optionsPath, compileStep);
	options = _.extend(options, {
		sourceComments: 'none',
		includePaths: [],
		stats: {}
	});
	options.file = fullInputPath; // not in extend because this shouldn't be found in the options json
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
});
