[![Build Status](https://travis-ci.org/stevezhu/meteor-sass.svg?branch=master)](https://travis-ci.org/stevezhu/meteor-sass)

Meteor package for sass and scss using [node-sass](https://github.com/sass/node-sass).

Only tested with meteor v1.0.4.1

## Usage

### With applications

`meteor add stevezhu:sass@2.0.0`

Any sass/scss files in the project will be compiled and added to the site.

### With packages

Cannot be used with wrapper packages for sass libraries because of some problems with the meteor api.  
May be added in a future version.

## Config

### sass_options.json

Located in the project or package root directory.  
The options can be configured using [node-sass options](https://github.com/sass/node-sass/tree/v2.0.1).

## Dependency versions

node-sass v2.0.1
