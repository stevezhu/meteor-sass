var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	files = Npm.require('./files.js');

var args = Npm.require('minimist')(process.argv.slice(2))._,
	command = _.first(args);

CompileSassUtils = {
	_: _,
	path: path,
	isPublishPackage: command === 'publish',
	isTestPackages: command === 'test-packages',
	debug: function(/* arguments */) {
		if (process.env.DEBUG_SASS === 'true') {
			console.log.apply(null, arguments);
		}
	},
	isInPackage: function(compileStep) {
		if (!_.has(compileStep, 'isInPackage')) {
			compileStep.isInPackage = !_.isNull(compileStep.packageName);
		}
		return compileStep.isInPackage;
	},
	updateCompileStepPaths: function(compileStep) {
		var isInPackage = this.isInPackage(compileStep);
		this.debug(isInPackage ? 'THIS IS IN A PACKAGE' : 'THIS IS IN AN APP');

		compileStep.appDir = this.isTestPackages ? files.findPackageDir(compileStep._fullInputPath) : files.findAppDir(process.cwd());

		// uses cwd for findAppDir because packages might not be in the app dir
		compileStep.rootDir = isInPackage ? files.findPackageDir(compileStep._fullInputPath) : files.findAppDir(process.cwd());
		this.debug('rootDir', compileStep.rootDir);

		// relative to the rootDir
		compileStep.relativePath = path.relative(compileStep.rootDir, compileStep._fullInputPath);
		compileStep.relativeDir = path.dirname(compileStep.relativePath);
	},
	PACKAGE_LINKS_DIR: '.sass/',
	/**
	 * For creating hard links to packages because node-sass/libsass includePaths don't work when there are colons in the name
	 */
	createPackageLink: function(compileStep) {
		if (!this.isTestPackages) {
			var dir = path.join(compileStep.appDir, path.join(this.PACKAGE_LINKS_DIR, 'packages/'));
			this.mkdirp(dir);
			var packageName = compileStep.packageName.split(':');
			if (packageName.length === 2) {
				dir = path.join(dir, packageName[0]);
				this.mkdirp(dir);
				packageName = packageName[1];
			} else {
				packageName = packageName[0];
			}
			try {
				fs.linkSync(compileStep.rootDir, path.join(dir, packageName));
			} catch (err) {
				if (err.code !== 'EEXIST') throw err;
			}
		}
	},
	// empty - what to return if the json is empty or not found
	// returns undefined if error
	readJSON: function(jsonPath, compileStep, empty) {
		empty = empty || {};
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
	},
	// returns whether the write succeeded
	writeJSON: function(jsonPath, json, compileStep) {
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
	},
	runInDir: function(dir, func) {
		var cwd = process.cwd();
		process.chdir(dir);
		func();
		process.chdir(cwd);
	},
	/**
	 * Make directory recursively
	 * @param  {String} p path
	 */
	mkdirp: function(p) {
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
	}
};
