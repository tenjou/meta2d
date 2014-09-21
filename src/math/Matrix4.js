"use strict";

/**
 * @description Implementation of 4x4 Matrix. Creates identity matrix.
 * @constructor
 * @property m {Float32Array} Matrix buffer.
 * @memberof! <global>
 */
meta.math.Matrix4 = function()
{
	this.m = new Float32Array(16);
	this.m[0] = 1.0;
	this.m[5] = 1.0;
	this.m[10] = 1.0;
	this.m[15] = 1.0;
};

meta.math.Matrix4.prototype =
{
	/**
	 * Resets matrix to identity matrix.
	 */
	reset: function()
	{
		this.m[0] = 1.0; this.m[1] = 0.0; this.m[2] = 0.0; this.m[3] = 0.0;
		this.m[4] = 0.0; this.m[5] = 1.0; this.m[6] = 0.0; this.m[7] = 0.0;
		this.m[8] = 0.0; this.m[9] = 0.0; this.m[10] = 1.0; this.m[11] = 0.0;
		this.m[12] = 0.0; this.m[13] = 0.0; this.m[14] = 0.0; this.m[15] = 1.0;
	},


	/**
	 * Scale matrix.
	 * @param x {Number} Scale x axis.
	 * @param y {Number} Scale y axis.
	 * @param z {Number} Scale z axis.
	 */
	scale: function(x, y, z) {
		this.m[0] = x;
		this.m[5] = y;
		this.m[10] = z;
	},


	/**
	 * Creates orthographic projection matrix.
	 * @param left {Number} Far left. Usually = 0.
	 * @param right {Number} Far right. Width.
	 * @param bottom {Number} Far bottom. Height.
	 * @param top {Number} Far top. Usually = 0.
	 * @param zNear {Number} Nearest point. Usually = 0.
	 * @param zFar {Number} Farthest point. Usually = 1.
	 */
	ortho: function(left, right, bottom, top, zNear, zFar)
	{
		this.m[0] = 2.0 / (right - left);
		this.m[1] = 0.0;
		this.m[2] = 0.0;
		this.m[3] = 0.0;

		this.m[4] = 0.0;
		this.m[5] = 2.0 / (top - bottom);
		this.m[6] = 0.0;
		this.m[7] = 0.0;

		this.m[8] = 0.0;
		this.m[9] = 0.0;
		this.m[10] = -2.0 / (zFar - zNear);
		this.m[11] = 0.0;

		this.m[12] = -(right + left) / (right - left);
		this.m[13] = -(top + bottom) / (top - bottom);
		this.m[14] = -(zFar + zNear) / (zFar - zNear);
		this.m[15] = 1.0;
	}
};