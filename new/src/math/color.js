"use strict";

meta.Color = function(r, g, b)
{
	this.r = r || 0.0;
	this.g = g || 0.0;
	this.b = b || 0.0;
};

meta.Color.prototype = 
{
	setHex: function(hex) 
	{
		var hex = Math.floor(hex);

		this.r = (hex >> 16 & 255) / 255;
		this.g = (hex >> 8 & 255) / 255;
		this.b = (hex & 255) / 255;
	},

	getHex: function() {
		return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0;
	},	
};
