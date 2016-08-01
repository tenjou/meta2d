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
	},

	resize: function(width, height)
	{
		this.width = width;
		this.height = height;
	}, 

	move: function(diffX, diffY)
	{
		this.x += diffX;
		this.y += diffY;
	},

	position: function(x, y)
	{
		this.x = x;
		this.y = y;
	}
};
