var request = require('supertest');
var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var assets  = require('../assets');

// grab first asset in list
var firstAsset;
for (firstAsset in assets.assetList) break;

var validCredentials = {
    "name": "guerrillas",
    "pass": "ramadan"
};

var uncachedFile = 'foo/bar/lol.png';

// run the app on a different port to avoid conflict with running app
process.env.PORT = 6666;
var app = require('../server');

var hashLength = 8; // cachebust hash

describe('Express app', function() {

    it('responds to the root domain', function (done) {
        request(app).get('/').expect(200, done);
    });

    it('blocks unauthenticated requests', function (done) {
        request(app).get('/auth').expect(401, done);
    });

    it('allows authenticated requests', function (done) {
        request(app).get('/auth').auth(
            validCredentials.name,
            validCredentials.pass
        ).expect(200, done);
    });

    it('returns a status message', function (done) {
        request(app).get('/status').expect('Status: OK').expect(200, done);
    });

    it('404s everything else', function (done) {
        request(app).get('/purple/monkey/dishwasher').expect(404, done);
    });

    it('should serve static files from /static', function () {
        expect(assets.assetVirtualDir).to.equal('/static');
    });

    it('should provide cachebusted file paths', function () {
        var cachebusted = assets.getCachebustedPath(firstAsset);
        var minimumLength = firstAsset.length + hashLength;
        expect(cachebusted).to.be.a('string');
        expect(cachebusted).to.have.length.above(minimumLength);
    });

    it('should return valid paths where cachebusted file is not present', function () {
        expect(assets.getCachebustedPath(uncachedFile)).to.equal(assets.assetVirtualDir + '/' + uncachedFile);
    });

    it('should return files served on the static endpoint', function(done) {
        var cachebusted = assets.getCachebustedPath(firstAsset);
        request(app).get(cachebusted).expect(200, done);
    });

});
