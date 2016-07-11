"use strict";

meta.math.Matrix4 = function(src) 
{
	if(src) 
	{
		if(src instanceof Float32Array) {
			this.m = new Float32Array(src);
		}
		else if(src instanceof meta.math.Matrix4) {
			this.m = new Float32Array(src.m);
		}
	}
	else {
		this.create();
	}
};

meta.math.Matrix4.prototype =
{
	create: function()
	{
		this.m = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
	},

	clone: function() {
		return new meta.math.Matrix4(this.m);
	},

	copy: function(matrix) {
		this.m.set(matrix.m);
	},

	set: function(m00, m01, m02, m03,
				  m10, m11, m12, m13,
				  m20, m21, m22, m23,
				  m30, m31, m32, m33)
	{
		this.m[0] = m00;
		this.m[1] = m01;
		this.m[2] = m02;
		this.m[3] = m03;

		this.m[4] = m10;
		this.m[5] = m11;
		this.m[6] = m12;
		this.m[7] = m13;

		this.m[8] = m20;
		this.m[9] = m21;
		this.m[10] = m22;
		this.m[11] = m23;

		this.m[12] = m30;
		this.m[13] = m31;
		this.m[14] = m32;
		this.m[15] = m33;
	},

	identity: function()
	{
		this.m[0] = 1;
		this.m[1] = 0;
		this.m[2] = 0;
		this.m[3] = 0;

		this.m[4] = 0;
		this.m[5] = 1;
		this.m[6] = 0;
		this.m[7] = 0;

		this.m[8] = 0;
		this.m[9] = 0;
		this.m[10] = 1;
		this.m[11] = 0;

		this.m[12] = 0;
		this.m[13] = 0;
		this.m[14] = 0;
		this.m[15] = 1;
	},

	transpose: function()
	{

	},

	ortho: function(left, right, bottom, top, near, far) 
	{
		var leftRight = 1 / (left - right);
		var bottomTop = 1 / (bottom - top);
		var nearFar = 1 / (near - far);

		this.m[0] = -2 * leftRight;
		this.m[1] = 0;
		this.m[2] = 0;
		this.m[3] = 0;
		this.m[4] = 0;
		this.m[5] = -2 * bottomTop;
		this.m[6] = 0;
		this.m[7] = 0;
		this.m[8] = 0;
		this.m[9] = 0;
		this.m[10] = 2 * nearFar;
		this.m[11] = 0;
		this.m[12] = (left + right) * leftRight;
		this.m[13] = (top + bottom) * bottomTop;
		this.m[14] = (far + near) * nearFar;
		this.m[15] = 1;
	}
};
