"use strict";

meta.math = 
{
	epsilon: 0.000001,

	nearestPowerOfTwo: function(value) {
		return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
	}
};
