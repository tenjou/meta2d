"use strict";

meta.math.Vector2 = function(x, y)
{
	this.x = x || 0;
	this.y = y || 0;
};

meta.math.Vector2.prototype = 
{
	set: function(x, y) {
		this.x = x;
		this.y = y;
	},

	add: function(vec) {
		this.x += vec.x;
		this.y += vec.y;
	},

	sub: function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
	},

	mul: function(vec) {
		this.x *= vec.x;
		this.y *= vec.y;
	},

	div: function(vec) {
		this.x /= vec.x;
		this.y /= vec.y;
	},

	length: function(vec) {
		var diffX = this.x - vec.x;
		var diffY = this.y - vec.y;
		return (diffX * diffX + diffY * diffY);
	},

	magnitude: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	normalize: function()
	{
		var mag = Math.sqrt(this.x * this.x + this.y * this.y);

		if(mag === 0) {
			this.x = 0;
			this.y = 0;
		}
		else {
			this.x /= mag;
			this.y /= mag;
		}
	},

	dot: function(vec) {
		return (this.x * vec.x + this.y * vec.y);
	},

	getNormalized: function()
	{
		var mag = Math.sqrt(this.x * this.x + this.y * this.y);

		if(mag === 0) {
			return new meta.math.vector2(0, 0);
		}

		return new meta.math.vector2(this.x / mag, this.y / mag);
	},

	getAngle: function() {
		return Math.atan2(this.y, this.x) * 180 / Math.PI;
	},

	toString: function() {
		return "x:" + this.x + " y:" + this.y;
	}
};
