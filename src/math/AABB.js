"use strict";

meta.math.AABB = function(x, y, width, height)
{
	this.x = x || 0;
	this.y = y || 0;	
	this.width = width || 0;
	this.height = height || 0;
	this.halfWidth = this.width * 0.5;
	this.halfHeight = this.height * 0.5;

	this.minX = this.x;
	this.minY = this.y;
	this.maxX = this.x + this.width;
	this.maxY = this.y + this.height;
};

meta.math.AABB.prototype =
{
	set: function(x, y)
	{
		this.x = x;
		this.y = y;
		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;

		meta.renderer.needRender = true;
	},

	move: function(x, y)
	{
		this.minX += x;
		this.minY += y;
		this.maxX += x;
		this.maxY += y;

		meta.renderer.needRender = true;
	},

	resize: function(width, height)
	{
		this.width = width || 0;
		this.height = height || 0;
		this.halfWidth = this.width * 0.5;
		this.halfHeight = this.height * 0.5;		

		this.updatePos();
		meta.renderer.needRender = true;
	},

	pivot: function(x, y)
	{
		if(this.pivotX === x && this.pivotY === y) { return; }

		this.pivotX = x;
		this.pivotY = y;

		this.updatePos();
		meta.renderer.needRender = true;		
	},

	updatePos: function() 
	{
		if(this.scaleX > 0) {
			this.pivotPosX = this.pivotX * this.width;
		}	
		else {
			this.pivotPosX = (1.0 - this.pivotX) * this.width;
		}

		if(this.scaleY > 0) {
			this.pivotPosY = this.pivotY * this.height;
		}
		else {
			this.pivotPosY = (1.0 - this.pivotY) * this.height;
		}

		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;				
	},

	flip: function(x, y)
	{
		if(x === void(0) && y === void(0)) {
			x = -this.scaleX;
			y = this.scaleY;
		}
		else
		{
			x = (x !== void(0)) ? x : 1.0;
			y = (y !== void(0)) ? y : 1.0;
		}

		x = x | 0;
		y = y | 0;

		if(x > 1.0) { x = 1.0; }
		else if(x < -1.0) { x = -1.0; }
		else if(x === 0.0) { x = 1.0; }

		if(y > 1.0) { y = 1.0; }
		else if(y < -1.0) { y = -1.0; }
		else if(y === 0.0) { y = 1.0; }

		if(x === this.scaleX && y === this.scaleY) { return; }

		this.scaleX = x;
		this.scaleY = y;
		this.updatePos();
	},

	vsAABB: function(src)
	{
		if(this.maxX < src.minX || this.minX > src.maxX) { return false; }
		if(this.maxY < src.minY || this.minY > src.maxY) { return false; }

		return true;
	},

	vsBorderAABB: function(src)
	{
		if(this.maxX <= src.minX || this.minX >= src.maxX) { return false; }
		if(this.maxY <= src.minY || this.minY >= src.maxY) { return false; }

		return true;
	},

	vsAABBIntersection: function(src)
	{
		if(this.maxX < src.minX || this.minX > src.maxX) { return 0; }
		if(this.maxY < src.minY || this.minY > src.maxY) { return 0; }

		if(this.minX > src.minX || this.minY > src.minY) { return 1; }
		if(this.maxX < src.maxX || this.maxY < src.maxY) { return 1; }

		return 2;
	},

	vsPoint: function(x, y)
	{
		if(this.minX > x || this.maxX < x) { return false; }
		if(this.minY > y || this.maxY < y) { return false; }

		return true;
	},

	vsBorderPoint: function(x, y)
	{
		if(this.minX >= x || this.maxX <= x) { return false; }
		if(this.minY >= y || this.maxY <= y) { return false; }

		return true;
	},


	getSqrDistance: function(x, y)
	{
		var tmp;
		var sqDist = 0;

		if(x < this.minX) {
			tmp = (this.minX - x);
			sqDist += tmp * tmp;
		}
		if(x > this.maxX) {
			tmp = (x - this.maxX);
			sqDist += tmp * tmp;
		}

		if(y < this.minY) {
			tmp = (this.minY - y);
			sqDist += tmp * tmp;
		}
		if(y > this.maxY) {
			tmp = (y - this.maxY);
			sqDist += tmp * tmp;
		}

		return sqDist;
	},


	getDistanceVsAABB: function(aabb)
	{
		var centerX = this.minX + ((this.maxX - this.minX) / 2);
		var centerY = this.minY + ((this.maxY - this.minY) / 2);
		var srcCenterX = aabb.minX + ((aabb.maxY - aabb.minY) / 2);
		var srcCenterY = aabb.minY + ((aabb.maxY - aabb.minY) / 2);

		var diffX = srcCenterX - centerX;
		var diffY = srcCenterY - centerY;

		return Math.sqrt((diffX * diffX) + (diffY * diffY));
	},


	isUndefined: function() {
		return (this.maxY === void(0));
	},


	genCircle: function() 
	{
		var width = (this.maxX - this.minX);
		var height = (this.maxY - this.minY);

		var radius;
		if(width > height) {
			radius = width / 2;
		}
		else {
			radius = height / 2;
		}

		return new meta.math.Circle(this.x, this.y, radius);
	},	


	print: function(str)
	{
		if(str)
		{
			console.log("(AABB) " + str + " minX: " + this.minX + " minY: " + this.minY
				+ " maxX: " + this.maxX + " maxY: " + this.maxY);
		}
		else
		{
			console.log("(AABB) minX: " + this.minX + " minY: " + this.minY
				+ " maxX: " + this.maxX + " maxY: " + this.maxY);
		}
	},


	//
	pivotX: 0, pivotY: 0,
	pivotPosX: 0, pivotPosY: 0,
	scaleX: 1, scaleY: 1
};
