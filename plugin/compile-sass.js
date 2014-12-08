var _ = Npm.require('lodash'),
	path = Npm.require('path'),

	Future = Npm.require('fibers/future'),
	sass = Npm.require('node-sass');

var utils = CompileSassUtils;

var OPTIONS_FILENAME = 'sass_options.json';
var INCLUDE_PATHS_FILENAME = 'sass_include_paths.json';

var generateHandler = function(exitEarly, handler) {
	return function(compileStep) {
		if (exitEarly(compileStep)) {
			return;
		}
		utils.updateCompileStepPaths(compileStep);
		utils.debug('compileStep', compileStep);

		handler.call(this, compileStep);
	};
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
Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, generateHandler(function(compileStep) {
	// if the filename begins with '_', it is a partial
	// therefore, ignore it
	return path.basename(compileStep.inputPath)[0] === '_';
}, function(compileStep) {
	utils.runInDir(compileStep.rootDir, function() {
		var future = new Future();

		// ==== LOAD OPTIONS ====
		var optionsPath = path.join(compileStep.appDir, OPTIONS_FILENAME);
		utils.debug('optionsPath', optionsPath);
		var options = utils.readJSON(optionsPath, compileStep, {});

		// ==== SET OPTIONS ====
		_.defaults(options, {
			//sourceComments: 'map',
			//sourceMap: '',
			includePaths: [],
			packageIncludePaths: {}
		});
		utils.debug('loaded options', options);

		// for each path in packageIncludePaths, add the path to includePaths
		_.each(options.packageIncludePaths, function(includePaths) {
			_.each(includePaths, function(includePath) {
				options.includePaths.push(includePath);
			})
		});
		// then remove all duplicates
		options.includePaths = _.uniq(options.includePaths);
		delete options.packageIncludePaths;
		utils.debug('includePaths', options.includePaths);

		options.file = compileStep._fullInputPath;
		options.success = function(css, sourceMap) {
			var result = {
				css: css,
				sourceMap: sourceMap
			};
			future.return(result);
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
			future.return(err);
		};
		options.stats = {};

		// ==== COMPILE ====
		sass.render(options);
		var result = future.wait();
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
}));

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
Plugin.registerSourceHandler(INCLUDE_PATHS_FILENAME, {archMatching: 'os'}, generateHandler(function(compileStep) {
	return utils.isPublishPackage || !utils.isInPackage(compileStep); // don't process while publishing this package
}, function(compileStep) {
	utils.createPackageLink(compileStep);

	// ==== OPTIONS ====

	var optionsPath = path.join(compileStep.appDir, OPTIONS_FILENAME);
	var options = utils.readJSON(optionsPath, compileStep, {});
	_.defaults(options, {
		packageIncludePaths: {}
	});

	// the includePaths loaded from sass_include_paths.json
	var includePaths = utils.readJSON(compileStep._fullInputPath, compileStep, []);
	includePaths = _.map(includePaths, function(includePath) {
		if (utils.isTestPackages) {
			includePath = path.join(compileStep.relativeDir, includePath);
		} else {
			includePath = path.join(utils.PACKAGE_LINKS_DIR, 'packages/', compileStep.packageName.replace(/:/g, path.sep), compileStep.relativeDir, includePath);
		}
		return includePath;
	});

	options.packageIncludePaths[compileStep.packageName] = includePaths;

	// ==== WRITE ====

	utils.writeJSON(optionsPath, options, compileStep);
}));

Plugin.registerSourceHandler(OPTIONS_FILENAME, function(compileStep) {
});
