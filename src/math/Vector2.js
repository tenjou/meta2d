"use strict";

/**
 * 2D vector math class.
 * @constructor
 * @param x {Number} Value x.
 * @param y {Number} Value y.
 */
meta.math.Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

meta.math.Vector2.prototype =
{
	/**
	 * Reset the vector to zero.
	 * @function
	 */
	reset: function() {
		this.x = 0;
		this.y = 0;
	},

	/**
	 * Set new values to the vector.
	 * @param x {Number} New x value.
	 * @param y {Number} New y value.
	 * @function
	 */
	set: function(x, y) {
		this.x = x;
		this.y = y;
	},


	/**
	 * Add value to the vector.
	 * @param value {Number} Value to add.
	 * @function
	 */
	add: function(value) {
		this.x += value;
		this.y += value;
	},

	/**
	 * Subtract value from the vector.
	 * @param value {Number} Value of subtract.
	 * @function
	 */
	sub: function(value) {
		this.x -= value;
		this.y -= value;
	},

	/**
	 * Multiply by value the vector.
	 * @param value {Number} Value of multiplication.
	 * @function
	 */
	mul: function(value) {
		this.x *= value;
		this.y *= value;
	},

	/**
	 * Divide by value the vector.
	 * @param value {Number} Value of divison.
	 * @function
	 */
	div: function(value) {
		this.x /= value;
		this.y /= value;
	},


	/**
	 * Add Vector2.
	 * @param value {meta.math.Vector2} Vector to add.
	 * @function
	 */
	addVec2: function(vec) {
		this.x += vec.x;
		this.y += vec.y;
	},

	/**
	 * Subtract Vector2.
	 * @param value {meta.math.Vector2} Vector to subtract.
	 * @function
	 */
	subVec2: function(vec) {
		this.x -= vec.x;
		this.y -= vec.y;
	},

	/**
	 * Multiply Vector2.
	 * @param value {meta.math.Vector2} Vector to multiply.
	 * @function
	 */
	mulVec2: function(vec) {
		this.x *= vec.x;
		this.y *= vec.y;
	},

	/**
	 * Divide Vector2.
	 * @param value {meta.math.Vector2} Vector to divide.
	 * @function
	 */
	divVec2: function(vec) {
		this.x /= vec.x;
		this.y /= vec.y;
	},


	/**
	 * Get distance to 
	 * @param value {Number} Value to add.
	 * @function
	 */
	length: function() {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	},

	/**
	 * Normalize the vector
	 * @function
	 */
	normalize: function()
	{
		var length = Math.sqrt((this.x * this.x) + (this.y * this.y));

		if(length > 0) {
			this.x /= length;
			this.y /= length;
		}
		else {
			this.x = 0;
			this.y = 0;
		}
	},

	/**
	 * Calculate dot product from point.
	 * @param x {Number} Point x position.
	 * @param y {Number} Point y position.
	 * @function
	 */
	dot: function(vec) {
		return (this.x * vec.x + this.y * vec.y);
	},

	/**
	 * Heavier limit function with normalization.
	 * @param max {Number} Max value.
	 * @function
	 */
	truncate: function(max)
	{
		var length = Math.sqrt((this.x * this.x) + (this.y * this.y));
		if(length > max) {
			this.x *= max / length;
			this.y *= max / length;
		}
	},

	/**
	 * Limit vector max values.
	 * @param max {Number} Max value.
	 * @function
	 */
	limit: function(max)
	{
		if(this.x > max) { this.x = max; }
		else if(this.x < -max) { this.x = -max; }

		if(this.y > max) { this.y = max; }
		else if(this.y < -max) { this.y = -max; }
	},

	/**
	 * Get square length from the vector.
	 * @function
	 */
	lengthSq: function() {
		return (this.x * this.x + this.y * this.y);
	},

	heading: function() {
		var angle = Math.atan2(-this.y, this.x);
		return -angle + Math.PI * 0.5;
	},

	/**
	 * Make vector perpendicular to the current vector. 
	 * @function
	 */
	perp: function() {
		var tmpX = this.x;
		this.x = -this.y;
		this.y = tmpX;
	},


	/**
	 * Print contents of the vector.
	 * @param str {String=} String to add to the output.
	 * @function
	 */
	print: function(str)
	{
		if(str) {
			console.log("[vec \"" + str + "\"] x: " + this.x + " y: " + this.y);
		}
		else {
			console.log("[vec] x: " + this.x + " y: " + this.y);
		}
	}
};
