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

	clone: function() {
		return new meta.math.Vector2(this.x, this.y);
	},

	copy: function(vec) {
		this.x = vec.x;
		this.y = vec.y;
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

	scale: function(x, y) {
		this.x *= x;
		this.Y *= y;
	},

	floor: function() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
	},

	ceil: function() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
	},

	round: function() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
	},	

	min: function(x, y) {
		this.x = Math.min(this.x, x);
		this.y = Math.min(this.y, y);
	},

	max: function(x, y) {
		this.x = Math.max(this.x, x);
		this.y = Math.max(this.y, y);
	},	

	length: function(vec) {
		var diffX = this.x - vec.x;
		var diffY = this.y - vec.y;
		return (diffX * diffX + diffY * diffY);
	},

	squaredLength: function(vec) {
		return this.x * this.x + this.y * this.y;
	},

	inverse: function() {
		this.x = 1.0 / this.x;
		this.y = 1.0 / this.y;
	},

	magnitude: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	normalize: function()
	{
		var length = this.x * this.x + this.y * this.y;

		if(length > 0) {
			this.x = 0;
			this.y = 0;
		}
		else 
		{
			length = Math.sqrt(length);
			this.x /= length;
			this.y /= length;
		}
	},

	dot: function(vec) {
		return (this.x * vec.x + this.y * vec.y);
	},

	lerp: function(a, b, t)
	{
		this.x = a.x + t * (b.x - a.x);
		this.y = a.y + t * (b.y - a.y);
	},

	exactEquals: function(vec) 
	{
		if(this.x === vec.x && this.y === vec.y) {
			return true;
		}

		return false;
	},

	equals: function(vec)
	{
		return (Math.abs(this.x - vec.x) <= meta.math.epsilon * Math.max(1.0, Math.abs(this.x), Math.abs(vec.x)) &&
				Math.abs(this.y - vec.y) <= meta.math.epsilon * Math.max(1.0, Math.abs(this.y), Math.abs(vec.y)));
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
