This project isn't being actively updated please use https://github.com/fourseven/meteor-scss instead.

[![Build Status](https://travis-ci.org/stevezhu/meteor-sass.svg?branch=master)](https://travis-ci.org/stevezhu/meteor-sass)

Meteor package for sass and scss using [node-sass](https://github.com/sass/node-sass).

Only tested with meteor v1.0.4.1

## Usage

### With applications

`meteor add stevezhu:sass@2.0.0`

Any sass/scss files in the project will be compiled and added to the site.

### With packages

When making a wrapper package for and existing sass library, you have to api.addFiles all the relevant files. Users then have to either write the whole path when importing or they can add the path to the sass_options.json with the include path.

## Config

### sass_options.json

Located in the project or package root directory.  
The options can be configured using [node-sass options](https://github.com/sass/node-sass/tree/v2.0.1).

## Dependency versions

node-sass v2.0.1
