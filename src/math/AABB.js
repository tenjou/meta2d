"use strict";

meta.math = {};

meta.math.AABB = function(minX, minY, maxX, maxY)
{
	this.minX = minX;
	this.minY = minY;
	this.maxX = maxX;
	this.maxY = maxY;
};

meta.math.AABB.prototype =
{
	move: function(x, y)
	{
		this.minX += x;
		this.minY += y;
		this.maxX += x;
		this.maxY += y;
	},

	set: function(x, y)
	{
		var width = this.maxX - this.minX;
		var height = this.maxY - this.minY;

		this.minX = x;
		this.minY = y;
		this.maxX = x + width;
		this.maxY = y + height;
	},

	resize: function(width, height)
	{
		this.maxX = this.minX + width;
		this.maxY = this.minY + height;
	},

	copy: function(src)
	{
		this.minX = src.minX;
		this.minY = src.minY;
		this.maxX = src.maxX;
		this.maxY = src.maxY;
	},


	vsAABB: function(src)
	{
		if(this.minX > src.maxX || this.maxX < src.minX ||
			this.minY > src.maxY || this.maxY < src.minY)
		{
			return false;
		}

		return true;
	},

	vsBorderAABB: function(src)
	{
		if(this.minX >= src.maxX || this.maxX <= src.minX ||
			this.minY >= src.maxY || this.maxY <= src.minY)
		{
			return false;
		}

		return true;
	},

	vsAABBIntersection: function(src)
	{
		if(this.minX > src.maxX || this.maxX < src.minX ||
			this.minY > src.maxY || this.maxY < src.minY)
		{
			return 0;
		}

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


	get width() { return this.maxX - this.minX; },
	get height() { return this.maxY - this.minY; },


	isUndefined: function() {
		return (this.maxY === void(0));
	},


	draw: function(ctx)
	{
		var minX = Math.floor(this.minX);
		var minY = Math.floor(this.minY);
		var maxX = Math.floor(this.maxX);
		var maxY = Math.floor(this.maxY);

		ctx.beginPath();
		ctx.moveTo(minX - 0.5, minY - 0.5);
		ctx.lineTo(maxX + 0.5, minY - 0.5);
		ctx.lineTo(maxX + 0.5, maxY + 0.5);
		ctx.lineTo(minX - 0.5, maxY + 0.5);
		ctx.lineTo(minX - 0.5, minY - 0.5);
		ctx.stroke();
	},

	drawTranslated: function(ctx, obj)
	{
		var x, y;

		if(obj) {
			x = obj.x; y = obj.y;
		}
		else {
			x = 0; y = 0;
		}

		this.translate(x, y);
		this.draw(ctx);
		this.translate(-x, -y);
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
	}
};