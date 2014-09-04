/**
 *
 */

var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	Future = Npm.require('fibers/future'),
	sass = Npm.require('node-sass'),
	files = Npm.require('./files.js');

var argv = Npm.require('minimist')(process.argv.slice(2)),
	command = _.first(argv._);

var debug = function() {
	if (process.env.NODE_ENV === 'debug') {
		console.log.apply(null, arguments);
	}
};
debug();

var runInDir = function(dir, func) {
	var cwd = process.cwd();
	process.chdir(dir);
	func();
	process.chdir(cwd);
};

/**
 * [mkdirp description]
 * @param  {[type]} p [description]
 * @return {[type]}   [description]
 */
var mkdirp = function(p) {
	var beg = 0, end = p.length;
	var paths = [];

	// remove the last /
	// so that the last path doesn't run twice
	if (_.last(p) === path.sep) {
		end = p.length - 1;
	}
	// for first /
	if (p.indexOf(path.sep) === 0) {
		paths.push(path.sep);
		beg = 1;
	}
	p = p.substring(beg, end);

	_.each(p.split(path.sep), function(dir) {
		if (paths.length > 0) {
			dir = path.join(_.last(paths), dir);
		}
		paths.push(dir);
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			if (err.code !== 'EEXIST') throw err;
		}
	});
};

/**
 * For creating hard links to packages because node-sass/libsass includePaths don't work when there are colons in the name
 */
var PACKAGE_LINKS_DIR = '.sass/'
var createPackageLink = function(compileStep, includePathsFile) {
	if (command !== 'test-packages') {
		var dir = path.join(compileStep.rootDir, path.join(PACKAGE_LINKS_DIR, 'packages/'));
		mkdirp(dir);
		var packageDir = files.findPackageDir(includePathsFile),
			packageName = path.basename(packageDir).split(':');
		if (packageName.length === 2) {
			dir = path.join(dir, packageName[0]);
			mkdirp(dir);
			packageName = packageName[1];
		} else {
			packageName = packageName[0];
		}
		try {
			fs.linkSync(packageDir, path.join(dir, packageName));
		} catch (err) {
			if (err.code !== 'EEXIST') throw err;
		}
	}
};

var findRootDir = function(filePath) {
	if (command === 'test-packages') {
		return files.findPackageDir(filePath);
	} else {
		// uses cwd because packages might not be in the app dir
		return files.findAppDir(process.cwd());
	}
};

// empty - what to return if the json is empty or not found
// returns undefined if error
var readJSON = function(jsonPath, compileStep, empty) {
	empty = empty || null;
	// = READ FILE =
	var data;
	try {
		data = fs.readFileSync(jsonPath);
	} catch (err) {
		return empty;
	}
	// = PARSE JSON =
	try {
		return JSON.parse(data);
	} catch (err) {
		// log error if file isn't empty
		if (data.length > 0) {
			compileStep.error({
				message: err.name + ': ' + err.message,
				sourcePath: jsonPath
			});
			return;
		}
		return empty;
	}
};

// returns whether the write succeeded
var writeJSON = function(jsonPath, json, compileStep) {
	var data = JSON.stringify(json, null, 2);
	try {
		fs.writeFileSync(jsonPath, data);
		return true;
	} catch (err) {
		compileStep.error({
			message: err.name + ': ' + err.message,
			sourcePath: jsonPath
		});
		return false;
	}
};

var updateCompileStepPaths = function(compileStep) {
	compileStep.rootDir = findRootDir(compileStep._fullInputPath);
	compileStep.relativePath = path.relative(compileStep.rootDir, compileStep._fullInputPath);
	compileStep.relativeDir = path.dirname(compileStep.relativePath);
};

Plugin.registerSourceHandlers = function(extensions, options, handler) {
	_.each(extensions, function(extension) {
		Plugin.registerSourceHandler(extension, options, handler);
	});
};

/**
 * .sass/ is for storing sass files because node-sass/libsass doesn't support colons in file paths
 * sass_options.json should only exist in either the root package dir or the root app dir.
 */
var OPTIONS_FILENAME = 'sass_options.json';
Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
	if (path.basename(compileStep.inputPath)[0] === '_') {
		return;
	}

	updateCompileStepPaths(compileStep);

	runInDir(compileStep.rootDir, function() {
		var f = new Future;

		// OPTIONS ========================================

		var optionsPath = path.join(compileStep.rootDir, OPTIONS_FILENAME);
		debug('optionsPath', optionsPath);
		var options = readJSON(optionsPath, compileStep, {});
		if (_.isUndefined(options)) {
			return;
		}
		_.defaults(options, {
			//sourceComments: 'map',
			//sourceMap: '',
			includePaths: [],
			packageIncludePaths: {}
		});
		debug('loaded options', options);

		_.each(options.packageIncludePaths, function(includePaths) {
			options.includePaths = options.includePaths.concat(includePaths);
		});
		options.includePaths = _.uniq(options.includePaths);
		delete options.packageIncludePaths;
		debug('includePaths', options.includePaths);

		options.file = compileStep._fullInputPath;
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
			if (match) {
				err = new Error('Sass ' + match[3]);
				err.sourcePath = compileStep.relativePath;
				err.lineNumber = match[2];
			} else {
				err = new Error(err);
				err.sourcePath = compileStep.relativePath;
			}
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
				path: compileStep.relativePath + '.css',
				data: result.css
			});
		}
	});
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
Plugin.registerSourceHandler(INCLUDE_PATHS_FILENAME, {archMatching: 'os'}, function(compileStep) {
	updateCompileStepPaths(compileStep);
	createPackageLink(compileStep, compileStep._fullInputPath);

	debug('_fullInputPath', compileStep._fullInputPath);
	debug('rootDir', compileStep.rootDir);
	debug('relativePath', compileStep.relativePath);

	// OPTIONS ========================================

	var optionsPath = path.join(compileStep.rootDir, OPTIONS_FILENAME);
	var options = readJSON(optionsPath, compileStep, {});
	if (_.isUndefined(options)) {
		return;
	}

	_.defaults(options, {
		packageIncludePaths: {}
	});

	// the includePaths loaded from sass_include_paths.json
	var includePaths = readJSON(compileStep._fullInputPath, []);
	includePaths = _.map(includePaths, function(includePath) {
		if (command !== 'test-packages') {
			includePath = path.join(PACKAGE_LINKS_DIR, compileStep.relativeDir, includePath).replace(/:/g, path.sep);
		} else {
			includePath = path.join(compileStep.relativeDir, includePath);
		}
		return includePath;
	});

	options.packageIncludePaths[compileStep.relativeDir] = includePaths;

	// WRITE ========================================

	writeJSON(optionsPath, options, compileStep);
});

Plugin.registerSourceHandler(OPTIONS_FILENAME, function(compileStep) {
});
