"use strict";

meta.math =
{
	degToRad: function(degree) {
		return (degree * Math.PI) / 180;
	},

	radToDeg: function(rad) {
		return (rad * 180) / Math.PI;
	},

	radiansToPoint: function(x1, y1, x2, y2)
	{
		var dx = (x2 - x1);
		var dy = (y2 - y1);

		return Math.atan(dx / dy);
	},

	clamp: function(num, min, max) {
		return num < min ? min : (num > max ? max : num);
	},

	map: function(v, a, b, x, y) {
		return (v == a) ? x : (v - a) * (y - x) / (b - a) + x;
	},

	length: function(x1, y1, x2, y2) {
		var x = x2 - x1;
		var y = y2 - y1;
		return Math.sqrt(x * x + y * y);
	},

	length2: function(x, y) {
		return Math.sqrt(x * x + y * y);
	},

	/**
	 * Limit value in range.
	 * @param value {Number} Value to limit.
	 * @param maxValue {Number} Max possible range for value.
	 * @return {Number}
	 */
	limit: function(value, maxValue)
	{
		if(value > maxValue) {
			return maxValue;
		}
		if(value < -maxValue) {
			return -maxValue;
		}

		return value;
	},

	/**
	 * Linearly interpolates between two values.
	 * @param value1 {Number} Source value 1.
	 * @param value2 {Number} Source value 2.
	 * @param amount {Number} Value between 0 and 1 indicating the weight of value2.
	 * @return {Number} Interpolated value.
	 */
	lerp: function(value1, value2, amount) {
		return value1 + (value2 - value1) * amount;
	},

	lookAt: function(srcX, srcY, targetX, targetY) {
		return Math.atan2(targetX - srcX, srcY - targetY);
	},

	lookAtEntity: function(src, target) {
		return meta.math.lookAt(src.x, src.y, target.x, target.y);
	},

	VolumeType: {
		AABB: 0,
		CIRCLE: 1,
		SEGMENT: 2
	}
};