var _ = Npm.require('lodash');
var Future = Npm.require('fibers/future');
var sass = Npm.require('node-sass');
var fs = Npm.require('fs');
var path = Npm.require('path');

Plugin.registerSourceHandlers = function(extensions, options, handler) {
  _.each(extensions, function(extension) {
    Plugin.registerSourceHandler(extension, options, handler);
  });
};

// XXX fix for sass_options.json source handler
Plugin.registerSourceHandler('json', function(compileStep) {
});

var OPTIONS_FILENAME = 'sass_options.json';
Plugin.registerSourceHandler(OPTIONS_FILENAME, function(compileStep) {
  // just so that when sass_options.json changes, sass files will recompile
});

Plugin.registerSourceHandlers(['sass', 'scss'], {archMatching: 'web'}, function(compileStep) {
  //console.log("Sass", compileStep);
  if (path.basename(compileStep.inputPath)[0] === '_') {
    return;
  }

  var rootDir = compileStep.fullInputPath.substring(0, compileStep.fullInputPath.lastIndexOf(compileStep.inputPath));

  var optionsFilePath = path.join(rootDir, OPTIONS_FILENAME);
  var options = {};
  if (fs.existsSync(optionsFilePath)) {
    var optionsSource = fs.readFileSync(optionsFilePath);
    try {
      options = JSON.parse(optionsSource);
    } catch (e) {
      console.log(e);
    }
  }
  _.defaults(options, {
    sourceMap: true,
    omitSourceMapUrl: true
  });

  //console.log("options", options);

  var includePaths = [];
  includePaths.push(path.dirname(compileStep.fullInputPath));

  var source = compileStep.read().toString('utf8');

  var future = new Future();

  _.extend(options, {
    data: source,
    outFile: compileStep.pathForSourceMap, // required for source maps in node-sass
    includePaths: includePaths,
    success: function(result) {
      future.return(result);
    },
    error: function(e) {
      future.throw(e);
    }
  });

  // XXX should probably be done using different source handlers
  var inputPathLength = compileStep.inputPath.length;
  var ext = compileStep.inputPath.substring(inputPathLength - 4);
  if (ext === 'sass') {
    options.indentedSyntax = true;
  }

  sass.render(options);

  var result;
  try {
    result = future.wait();
    //console.log("Result:", result);
  } catch (e) {
    compileStep.error({
      message: "Sass compiler error: " + e.message,
      sourcePath: compileStep.inputPath,
      line: e.line,
      column: e.column
    });
    return;
  }

  var sourceMap;
  if (options.sourceMap && result.map) {
    sourceMap = JSON.parse(result.map);
    // TODO also list sources for imports
    sourceMap.sources = [compileStep.inputPath];
    sourceMap.sourcesContent = [source];
    //console.log("Source map:", sourceMap);
    sourceMap = JSON.stringify(sourceMap);
  }

  compileStep.addStylesheet({
    path: compileStep.inputPath + ".css",
    data: result.css,
    sourceMap: sourceMap
  });
});
