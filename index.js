'use strict';

var bufferToVinyl = require('buffer-to-vinyl');
var combine = require('stream-combiner2');
var concat = require('concat-stream');
var optional = require('optional');
var through = require('through2');
var vfs = require('vinyl-fs');

/**
 * Initialize Imagemin
 *
 * @api public
 */

function Imagemin() {
	if (!(this instanceof Imagemin)) {
		return new Imagemin();
	}

	this.streams = [];
}

/**
 * Get or set the source files
 *
 * @param {Array|Buffer|String} file
 * @api public
 */

Imagemin.prototype.src = function (file) {
	if (!arguments.length) {
		return this._src;
	}

	this._src = file;
	return this;
};

/**
 * Get or set the destination folder
 *
 * @param {String} dir
 * @api public
 */

Imagemin.prototype.dest = function (dir) {
	if (!arguments.length) {
		return this._dest;
	}

	this._dest = dir;
	return this;
};

/**
 * Add a plugin to the middleware stack
 *
 * @param {Function} plugin
 * @api public
 */

Imagemin.prototype.use = function (plugin) {
	this.streams.push(typeof plugin === 'function' ? plugin() : plugin);
	return this;
};

/**
 * Optimize files
 *
 * @param {Function} cb
 * @api public
 */

Imagemin.prototype.run = function (cb) {
	cb = cb || function () {};

	var stream = this.createStream();

	stream.on('error', cb);
	stream.pipe(concat(cb.bind(null, null)));
};

/**
 * Create stream
 *
 * @api private
 */

Imagemin.prototype.createStream = function () {
	this.streams.unshift(this.getFiles());

	if (this.streams.length === 1) {
		this.use(Imagemin.gifsicle());
		this.use(Imagemin.jpegtran());
		this.use(Imagemin.optipng());
		this.use(Imagemin.svgo());
	}

	if (this.dest()) {
		this.streams.push(vfs.dest(this.dest()));
	}
	return combine(this.streams);

};

/**
 * Get files
 *
 * @api private
 */

Imagemin.prototype.getFiles = function () {
	if (Buffer.isBuffer(this.src())) {
		return bufferToVinyl.stream(this.src());
	}

	return vfs.src(this.src());
};

/**
 * Module exports
 */

module.exports = Imagemin;

[
	'gifsicle',
	'jpegtran',
	'optipng',
	'svgo'
].forEach(function (plugin) {
	module.exports[plugin] = optional('imagemin-' + plugin) || function () {
		return through.ctor({objectMode: true});
	};
});
