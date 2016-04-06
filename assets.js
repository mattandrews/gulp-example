var express = require('express');
// var config = require('config');
var path = require('path');
var fs = require('fs');

var assetVirtualDir = '/static';

// load cachebusted assets
var assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(path.join(__dirname, '/assets') + '/assets.json', 'utf8')
    );
} catch (e) {
    console.info('assets.json not found -- are you in DEV mode?');
}

// function for templates
var getCachebustedPath = function (path) {
    var isCachebusted = assets[path];
    var p = (isCachebusted) ? isCachebusted : path;
    return assetVirtualDir + '/' + p;
};

module.exports = {
    assetList: assets,
    assetVirtualDir: assetVirtualDir,
    getCachebustedPath: getCachebustedPath
};
