[![Build Status](https://travis-ci.org/stevezhu/meteor-sass.svg?branch=master)](https://travis-ci.org/stevezhu/meteor-sass)

Meteor package for sass and scss using [node-sass](https://github.com/sass/node-sass).

Compatible with Meteor 0.9.0 and above.

NOTE: Make sure you are using v1.2.2 or above. Any other version may not be stable.

## Config

### sass_options.json

Located in the project or package root directory. Will be created by the plugin if not found.  
\*Do not edit `packageIncludePaths`. The other options can be configured using [node-sass options](https://github.com/sass/node-sass#options).

## Usage

### With applications

`meteor add stevezhu:sass`

Any sass/scss files in the project will be compiled and added to the site.

### With packages (from v1.1.0)

To create a sass library package (such as bourbon)

```javascript
Package.onUse(function(api) {
	// ...
	api.use('stevezhu:sass@1.2.2');
	api.addFiles('sass_include_paths.json', 'server');
	// ...
});
```

__sass_include_paths.json__

Directories listed in the `sass_include_paths.json` are searched when looking for files referenced using `@import`.  
Note: You can only list folders paths; paths directly to the sass/scss files do not work.  
List the folders in the `sass_include_paths.json` as a string array. 
Paths are relative to the `sass_include_paths.json` file.

Example:
```json
[
	"./"
]
```

Another example can be found in `tests/`.

## Milestones
(versions designate the version the feature starts from)
- v1.1.0 - Include paths
- v1.2.2 - Linux support
