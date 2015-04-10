"use strict";

meta.math.Circle = function(x, y, radius) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.minX = x - radius;
	this.minY = y - radius;
	this.maxX = x + radius;
	this.maxY = y + radius;
};

meta.math.Circle.prototype = 
{
	position: function(x, y) {
		this.x = x;
		this.y = y;
		this.minX = x - this.radius;
		this.minY = y - this.radius;
		this.maxX = x + this.radius;
		this.maxY = y + this.radius;
	},

	move: function(addX, addY) {
		this.x += addX;
		this.y += addY;
		this.minX += addX;
		this.minY += addY;
		this.maxX += addX;
		this.maxY += addY;		
	},

	vsPoint: function(x, y) {
		return ((this.x - x) * 2) + ((this.y - y) * 2) <= (radius * 2);
	},

	vsAABB: function(aabb) {

	},

	vsCircle: function(circle) 
	{
		var dx = circle.x - this.x;
		var dy = circle.y - this.y;
		var radii = this.radius + circle.radius;

		if((dx * dx) + (dy * dy) < (radii * radii)) {
			return true;
		}

		return false;
	},

	overlapCircle: function(circle) 
	{
		var distance = Math.sqrt((this.x - circle.x) * (this.y - circle.y));

		// Does not contain:
		if(distance > (this.radius + circle.radius)) {
			return 0;
		}
		// Overlap:
		else if(distance <= Math.abs(this.radius + circle.radius)) {
			return 1;
		}
		
		// Contains
		return 2;
	},

	genAABB: function() 
	{
		return new meta.math.AABB(this.x - this.radius, this.y - this.radius, 
			this.x + this.radius, this.y + this.radius);
	},

	print: function(str) 
	{
		if(str) {
			console.log("[" + str + "] x:", this.x, "y:", this.y, "raidus:", this.radius);
		}
		else {
			console.log("x:", this.x, "y:", this.y, "raidus:", this.radius);
		}
	},

	//
	type: meta.math.VolumeType.CIRCLE
};
