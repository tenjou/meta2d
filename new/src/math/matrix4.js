"use strict";

meta.Matrix4 = function(src) 
{
	if(src) 
	{
		if(src instanceof Float32Array) {
			this.m = new Float32Array(src);
		}
		else if(src instanceof meta.Matrix4) {
			this.m = new Float32Array(src.m);
		}
	}
	else {
		this.create();
	}
};

meta.Matrix4.prototype =
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
		return new meta.Matrix4(this.m);
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
		var a01 = this.m[1];
		var a02 = this.m[2];
		var a03 = this.m[3];
		var a12 = this.m[6];
		var a13 = this.m[7];
		var a23 = this.m[11];

		this.m[1] = this.m[4];
		this.m[2] = this.m[8];
		this.m[3] = this.m[12];
		this.m[4] = a01;

		this.m[6] = this.m[9];
		this.m[7] = this.m[13];
		this.m[8] = a02;
		this.m[9] = a12;

		this.m[11] = this.m[14];
		this.m[12] = a03;
		this.m[13] = a13;
		this.m[14] = a23;
	},

	translate: function(x, y, z)
	{
		this.m[12] += this.m[0] * x + this.m[4] * y + this.m[8] * z;
		this.m[13] += this.m[1] * x + this.m[5] * y + this.m[9] * z;
		this.m[14] += this.m[2] * x + this.m[6] * y + this.m[10] * z;
		this.m[15] += this.m[3] * x + this.m[7] * y + this.m[11] * z;
	},

	scale: function(x, y, z)
	{
		this.m[0] *= x;
		this.m[1] *= x;
		this.m[2] *= x;
		this.m[3] *= x;

		this.m[4] *= y;
		this.m[5] *= y;
		this.m[6] *= y;
		this.m[7] *= y;

		this.m[8] *= z;
		this.m[9] *= z;
		this.m[10] *= z;
		this.m[11] *= z;	
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
	},

	perspective: function(fovy, aspect, near, far)
	{
		var fov = 1.0 / Math.tan(fovy / 2);
		var nearFar = 1 / (near - far);

		this.m[0] = fov / aspect;
		this.m[1] = 0;
		this.m[2] = 0;
		this.m[3] = 0;

		this.m[4] = 0;
		this.m[5] = fov;
		this.m[6] = 0;
		this.m[7] = 0;

		this.m[8] = 0;
		this.m[9] = 0;
		this.m[10] = (far + near) * nearFar;
		this.m[11] = -1;

		this.m[12] = 0;
		this.m[13] = 0;
		this.m[14] = (2 * far * near) * nearFar;
		this.m[15] = 0;
	},

	frustum: function(left, right, bottom, top, near, far)
	{
		var rightLeft = 1 / (right - left);
		var topBottom = 1 / (top - bottom);
		var nearFar = 1 / (near - far);

		this.m[0] = (near * 2) * rightLeft;
		this.m[1] = 0;
		this.m[2] = 0;
		this.m[3] = 0;

		this.m[4] = 0;
		this.m[5] = (near * 2) * topBottom;
		this.m[6] = 0;
		this.m[7] = 0;

		this.m[8] = (right + left) * rightLeft;
		this.m[9] = (top + bottom) * topBottom;
		this.m[10] = (far + near) * nearFar;
		this.m[11] = -1;

		this.m[12] = 0;
		this.m[13] = 0;
		this.m[14] = (far * near * 2) * nearFar;
		this.m[15] = 0;
	},

	fromTransformation: function(x, y, z)
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

		this.m[12] = x
		this.m[13] = y
		this.m[14] = z
		this.m[15] = 1;
	},

	toString: function()
	{
		return "[" + this.m[0] + ", " + this.m[1] + ", " + this.m[2] + ", " + this.m[3] +
					 this.m[4] + ", " + this.m[5] + ", " + this.m[6] + ", " + this.m[7] +
					 this.m[8] + ", " + this.m[9] + ", " + this.m[10] + ", " + this.m[11] +
					 this.m[12] + ", " + this.m[13] + ", " + this.m[14] + ", " + this.m[15] + "]";
	}	
};
