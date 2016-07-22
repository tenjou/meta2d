"use strict";

meta.epsilon = 0.000001;

meta.nearestPowerOfTwo = function(value) {
	return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};

meta.upperPowerOfTwo = function(value) 
{
	value--;
	value |= value >> 1;
	value |= value >> 2;
	value |= value >> 4;
	value |= value >> 8;
	value |= value >> 16;
	value++;
	
	return value;
};
