var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	Future = Npm.require('fibers/future'),
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

/**
 * sass_options.json should only exist in either the root package dir or the root app dir.
 */
var OPTIONS_FILENAME = 'sass_options.json';
Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	if (path.basename(compileStep.inputPath)[0] === '_') {
		return;
	}

	var rootDir = findRootDir(compileStep._fullInputPath) || '';

	var f = new Future;

	// OPTIONS ========================================

	var optionsPath = path.join(rootDir, OPTIONS_FILENAME);
	var options = readJSON(optionsPath, compileStep);
	_.defaults(options, {
		//sourceComments: 'map',
		//sourceMap: '',
		includePaths: [
			'tests/partials'
		]
	});
	options.file = compileStep.inputPath;
	options.success = function(css, sourceMap) {
		var result = {
			css: css,
			sourceMap: sourceMap
		};
		f.return(result)
	};
	// parses the error string
	options.error = function(err) {
		var re = /^(.*\.(?:scss|sass)):([0-9]+?): (.*)$/;
		var match = err.trim().match(re);
		var message = 'Sass ' + match[3];
		err = new Error(message);
		err.sourcePath = match[1];
		err.lineNumber = match[2];
		f.return(err);
	};
	options.stats = {};

	// COMPILE ========================================

	sass.render(options);
	var result = f.wait();
	if (result instanceof Error) {
		compileStep.error({
			message: result.message,
			sourcePath: result.sourcePath,
			line: result.lineNumber
		});
	} else {
		// TODO add result.sourceMap when node-sass segmentation fault fix is released
		// possible other way of getting sourceMaps with renderSync -> options.stats.sourceMap?
		compileStep.addStylesheet({
			path: compileStep.inputPath + '.css',
			data: result.css
		});
	}
});

/**
 * sass_include_paths.json SHOULD BE PUT IN PACKAGES ONLY EITHER FOR TESTING OR FOR A SASS LIBRARY
 *
 * - When adding sass_include_paths.json to a package, it must be added before any sass/scss.
 * - Paths in sass_include_paths.json should be relative to sass_include_paths.json
 * - sass_options.json is only stored in packages for testing purposes
 *
 * 1. Merge `includePaths` from each 'sass_include_paths.json' added using `api.addFiles` to 'sass_options.json'
 * 2. Store 'sass_options.json' in the app root dir
 */
var INCLUDE_PATHS_FILENAME = 'sass_include_paths.json';
Plugin.registerSourceHandler(INCLUDE_PATHS_FILENAME, function(compileStep) {
	var rootDir = findRootDir(compileStep._fullInputPath) || '';

	// full path of the directory sass_include_paths.json is in
	var relativeDir = path.dirname(compileStep._fullInputPath);

	// OPTIONS ========================================

	var optionsPath = path.join(rootDir, OPTIONS_FILENAME);
	var options = readJSON(optionsPath, compileStep);
	// because the options file might not exist yet
	if (!_.has(options, 'includePaths')) {
		options.includePaths = [];
	}

	// the includePaths loaded from sass_include_paths.json
	var includePaths = readJSON(compileStep.inputPath);
	includePaths = _.map(includePaths, function(includePath) {
		return path.relative(rootDir, path.join(relativeDir, includePath));
	});

	options.includePaths = _.union(options.includePaths, includePaths);

	// WRITE ========================================

	// files.addToGitignore(rootDir, OPTIONS_FILENAME);

	writeJSON(optionsPath, options, compileStep);
});
