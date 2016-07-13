"use strict";

meta.math.Matrix3 = function()
{
	if(src) 
	{
		if(src instanceof Float32Array) {
			this.m = new Float32Array(src);
		}
		else if(src instanceof meta.math.Matrix3) {
			this.m = new Float32Array(src.m);
		}
	}
	else {
		this.create();
	}
};

meta.math.Matrix3.prototype = 
{
	create: function()
	{
		this.m = new Float32Array([
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
		]);
	},

	clone: function() {
		return new meta.math.Matrix3(this.m);
	},

	set: function(
		m00, m01, m02,
		m10, m11, m12,
		m20, m21, m22)
	{
		this.m[0] = m00;
		this.m[1] = m01;
		this.m[2] = m02;

		this.m[3] = m10;
		this.m[4] = m11;
		this.m[5] = m12;

		this.m[6] = m20;
		this.m[7] = m21;
		this.m[8] = m22;
	},

	copy: function(src) {
		this.m.set(src.m);
	},

	identity: function()
	{
		this.m[0] = 1;
		this.m[1] = 0;
		this.m[2] = 0;

		this.m[3] = 0;
		this.m[4] = 1;
		this.m[5] = 0;

		this.m[6] = 0;
		this.m[7] = 0;
		this.m[8] = 1;
	},

	transpose: function()
	{
        var a01 = this.m[1];
        var a02 = this.m[2];
        var a12 = this.m[5];

        this.m[1] = this.m[3];
        this.m[2] = this.m[6];
        this.m[3] = a01;
        this.m[5] = this.m[7];
        this.m[6] = a02;
        this.m[7] = a12;
	},

	invert: function()
	{
		var m00 = this.m[0];
		var m01 = this.m[1];
		var m02 = this.m[2];

		var m10 = this.m[3];
		var m11 = this.m[4];
		var m12 = this.m[5];

		var m20 = this.m[6];
		var m21 = this.m[7];
		var m22 = this.m[8];

		var a01 = m22 * m11 - m12 * m21;
		var a11 = -m22 * m10 + m12 * m20;
		var a21 = m21 * m10 - m11 * m20;

		var det = m00 * a01 + a01 * b11 + a02 * b21;

		if(!det) { return; }

		det = 1.0 / det;

		this.m[0] = a01 * det;
		this.m[1] = (-m22 * m01 + m02 * m21) * det;
		this.m[2] = (m12 * m01 - m02 * m11) * det;
		this.m[3] = a11 * det;
		this.m[4] = (m22 * m00 - m02 * m20) * det;
		this.m[5] = (-m12 * m00 + m02 * m10) * det;
		this.m[6] = a21 * det;
		this.m[7] = (-m21 * m00 + m01 * m20) * det;
		this.m[8] = (m11 * m00 - m01 * m10) * det;
	},

	adjoint: function(src)
	{
		var a00 = src[0]; 
		var a01 = src[1];
		var a02 = src[2];

		var a10 = src[3]; 
		var a11 = src[4]; 
		var a12 = src[5];

		var a20 = src[6]; 
		var a21 = src[7]; 
		var a22 = src[8];

		this.m[0] = (a11 * a22 - a12 * a21);
		this.m[1] = (a02 * a21 - a01 * a22);
		this.m[2] = (a01 * a12 - a02 * a11);
		this.m[3] = (a12 * a20 - a10 * a22);
		this.m[4] = (a00 * a22 - a02 * a20);
		this.m[5] = (a02 * a10 - a00 * a12);
		this.m[6] = (a10 * a21 - a11 * a20);
		this.m[7] = (a01 * a20 - a00 * a21);
		this.m[8] = (a00 * a11 - a01 * a10);
	},

	determinant: function()
	{
		var m00 = this.m[0];
		var m01 = this.m[1];
		var m02 = this.m[2];

		var m10 = this.m[3];
		var m11 = this.m[4];
		var m12 = this.m[5];

		var m20 = this.m[6];
		var m21 = this.m[7];
		var m22 = this.m[8];

    	return m00 * (m22 * m11 - m12 * m21) + 
    		   m01 * (-m22 * m10 + m12 * m20) + 
    		   m02 * (m21 * m10 - m11 * m20);
	},

	mul: function(src)
	{
	    var a00 = this.m[0];
	    var a01 = this.m[1];
	    var a02 = this.m[2];
	    var a10 = this.m[3];
	    var a11 = this.m[4]; 
	    var a12 = this.m[5];
	    var a20 = this.m[6]; 
	    var a21 = this.m[7]; 
	    var a22 = this.m[8];

	    var b = src.m;
	    var b00 = b[0];
	    var b01 = b[1];
	    var b02 = b[2];
	    var b10 = b[3];
	    var b11 = b[4]; 
	    var b12 = b[5];
	    var b20 = b[6];
	    var b21 = b[7];
	    var b22 = b[8];

		this.m[0] = b00 * a00 + b01 * a10 + b02 * a20;
		this.m[1] = b00 * a01 + b01 * a11 + b02 * a21;
		this.m[2] = b00 * a02 + b01 * a12 + b02 * a22;

		this.m[3] = b10 * a00 + b11 * a10 + b12 * a20;
		this.m[4] = b10 * a01 + b11 * a11 + b12 * a21;
		this.m[5] = b10 * a02 + b11 * a12 + b12 * a22;

		this.m[6] = b20 * a00 + b21 * a10 + b22 * a20;
		this.m[7] = b20 * a01 + b21 * a11 + b22 * a21;
		this.m[8] = b20 * a02 + b21 * a12 + b22 * a22;		
	},

	scale: function(x, y)
	{
		this.m[0] = x * this.m[0];
		this.m[1] = x * this.m[1];
		this.m[2] = x * this.m[2];

		this.m[3] = y * this.m[3];
		this.m[4] = y * this.m[4];
		this.m[5] = y * this.m[5];
	},

	fromTranslation: function(x, y)
	{
		this.m[0] = 1;
		this.m[1] = 0;
		this.m[2] = 0;

		this.m[3] = 0;
		this.m[4] = 1;
		this.m[5] = 0;

		this.m[6] = x;
		this.m[7] = y;
		this.m[8] = 1;
	},

	fromMatrix4: function(src)
	{
		this.m[0] = src[0];
		this.m[1] = src[1];
		this.m[2] = src[2];

		this.m[3] = src[4];
		this.m[4] = src[5];
		this.m[5] = src[6];

		this.m[6] = src[8];
		this.m[7] = src[9];
		this.m[8] = src[10];
	},

	toString: function()
	{
		return "[" + this.m[0] + ", " + this.m[1] + ", " + this.m[2] + ", ",
					 this.m[3] + ", " + this.m[4] + ", " + this.m[5] + ", ",
					 this.m[6] + ", " + this.m[7] + ", " + this.m[8] + "]",
	}
};
