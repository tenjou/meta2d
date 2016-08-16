"use strict";

meta.AABB = function(x, y, width, height) 
{
	this.set(x, y, width, height);
};

meta.AABB.prototype =
{
	set: function(x, y, width, height)
	{
		this.x = x || 0;
		this.y = y || 0;
		this.width = width || 0;
		this.height = height || 0;

		this.minX = this.x;
		this.minY = this.y;
		this.maxX = this.x + this.width;
		this.maxY = this.y + this.height;
	},

	reset: function()
	{
		this.x = this.y = 0;
		this.width = this.height = 0;
		this.minX = this.minY = this.maxX = this.maxY = 0;
	},

	resize: function(width, height)
	{
		this.width = width;
		this.height = height;

		this.maxX = this.x + this.width;
		this.maxY = this.y + this.height;		
	}, 

	move: function(diffX, diffY)
	{
		this.x += diffX;
		this.y += diffY;

		this.minX = this.x;
		this.minY = this.y;
		this.maxX = this.x + this.width;
		this.maxY = this.y + this.height;
	},

	position: function(x, y)
	{
		this.x = x;
		this.y = y;

		this.minX = this.x;
		this.minY = this.y;
		this.maxX = this.x + this.width;
		this.maxY = this.y + this.height;
	}
};
