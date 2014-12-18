var _ = Npm.require('lodash'),
	path = Npm.require('path'),
	fs = Npm.require('fs'),
	mkdirp = Npm.require('mkdirp'),
	files = Npm.require('./files.js');

var args = Npm.require('minimist')(process.argv.slice(2))._,
	command = _.first(args);

CompileSassUtils = {
	isPublishPackage: command === 'publish',
	isTestPackages: command === 'test-packages',
	debug: function(/* arguments */) { // CORRECT
		if (process.env.DEBUG_SASS === 'true') {
			console.log.apply(null, arguments);
		}
	},
	// also returns true if isTestingPackage
	isInPackage: function(compileStep) { // CORRECT
		if (!_.has(compileStep, 'isInPackage')) {
			compileStep.isInPackage = !_.isNull(compileStep.packageName);
		}
		return compileStep.isInPackage;
	},
	isTestingPackage: function(compileStep) { // CORRECT
		if (!_.has(compileStep, 'isTestingPackage')) {
			var packageName = compileStep.packageName;
			compileStep.isTestingPackage = !_.isNull(packageName) && packageName.substring(0, 11) === 'local-test:';
		}
		return compileStep.isTestingPackage;
	},
	updateCompileStepPaths: function(compileStep) {
		compileStep.rootDir = this.isTestPackages ? path.join(process.cwd(), args[1]) : files.findAppDir();

		if (this.isInPackage(compileStep)) {
			compileStep.packageDir = files.findPackageDir(compileStep._fullInputPath);
			// relative to the packageDir
			compileStep.relativePath = path.relative(compileStep.packageDir, compileStep._fullInputPath);
			compileStep.relativeDir = path.dirname(compileStep.relativePath);
		}
	},
	PACKAGE_LINKS_DIR: '.sass/',
	/**
	 * For creating hard links to packages because node-sass/libsass includePaths don't work when there are colons in the name
	 */
	createPackageLink: function(compileStep) { // CORRECT
		if (!this.isTestingPackage(compileStep)
			&& path.relative(compileStep.packageDir, compileStep.rootDir) !== '') {
			var dir = path.join(compileStep.rootDir, this.PACKAGE_LINKS_DIR, 'packages/');
			var packageName = compileStep.packageName.split(':');

			// length equals 2
			// packageName is in the form `author:packageName`
			if (packageName.length === 2) {
				dir = path.join(dir, packageName[0]);
				packageName = packageName[1];
			}
			// length equals 1
			// packageName is in the form `packageName`
			else {
				packageName = packageName[0];
			}

			mkdirp.sync(dir);

			try {
				fs.linkSync(compileStep.packageDir, path.join(dir, packageName));
			} catch (err) {
				// if it already exists just don't create it (default behavior)
				// and don't throw the error either
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
	}
};
