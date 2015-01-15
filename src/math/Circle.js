"use strict";

meta.math.Circle = function(x, y, radius) {
	this.x = x;
	this.y = y;
	this.radius = radius;
};

meta.math.Circle.prototype = 
{
	vsPoint: function(x, y) {
		return ((this.x - x) * 2) + ((this.y - y) * 2) <= (radius * 2);
	},

	vsCircle: function(circle) 
	{
		var distance = Math.sqrt((this.x - circle.x) * (this.y - circle.y));
		return distance > (this.radius + circle.radius);
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
	}
};
