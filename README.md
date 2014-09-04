Meteor package for sass and scss using [node-sass](https://github.com/sass/node-sass).

Compatible with Meteor 0.9.0 and above.
Meteor package for sass and scss using [node-sass](https://github.com/sass/node-sass).

Compatible with Meteor 0.9.0 and above.

Currently only compatible with os.osx.x86_64 architecture.


## Usage

`sass_options.json` is a file created by the plugin which you can edit using node-sass options, except for the `packageIncludePaths` key.

### With applications

`meteor add stevezhu:sass`

Any sass/scss files in the project will be compiled and added to the site.

### With packages (from v1.1.0)

To create a sass library package (such as bourbon)

```javascript
Package.onUse(function(api) {
	// ...
	api.use('stevezhu:sass');
	api.addFiles('sass_include_paths.json', 'server');
	// ...
});
```
List the folders that you want apps that use your package to have access to when compiling their sass/scss in the `sass_include_paths.json` as a string array.
You can only list folders paths in the `sass_include_paths.json` file - paths directly to the sass/scss do not work.


An example can be found in `tests/`
