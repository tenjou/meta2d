"use strict";

meta.Math.AdvAABB = function(minX, minY, maxX, maxY)
{
	this.minX = minX;
	this.minY = minY;
	this.maxX = maxX;
	this.maxY = maxY;

	this.initWidth = maxX - minX;
	this.initHeight = maxY - minY;
	this.initHalfWidth = this.initWidth / 2;
	this.initHalfHeight = this.initHeight / 2;

	this.width = this.initWidth;
	this.height = this.initHeight;
	this.halfWidth = this.width / 2;
	this.halfHeight = this.height / 2;

	this.x = Math.floor(minX + this.halfWidth);
	this.y = Math.floor(minY + this.halfHeight);
	this.scaleX = 1.0;
	this.scaleY = 1.0;
};

meta.Math.AdvAABB.prototype =
{
	move: function(x, y)
	{
		this.x += x;
		this.y += y;
		this.minX += x;
		this.minY += y;
		this.maxX += x;
		this.maxY += y;
	},

	set: function(x, y)
	{
		this.x = x;
		this.y = y;

		this.minX = this.x - this.halfWidth;
		this.minY = this.y - this.halfHeight;
		this.maxX = this.x + this.halfWidth;
		this.maxY = this.y + this.halfHeight;
	},

	resize: function(width, height)
	{
		this.initWidth = width;
		this.initHeight = height;
		this.initHalfWidth = width / 2;
		this.initHalfHeight = height / 2;

		this.width = width * this.scaleX;
		this.height = height * this.scaleY;
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;

		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;
	},

	moveToAndResize: function(x, y, width, height)
	{
		this.x = Math.floor(x);
		this.y = Math.floor(y);
		this.initWidth = width;
		this.initHeight = height;
		this.initHalfWidth = width / 2;
		this.initHalfHeight = height / 2;

		this.width = this.initWidth * this.scaleX;
		this.height = this.initHeight * this.scaleY;
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;

		this.minX = this.x - this.halfWidth;
		this.minY = this.y - this.halfHeight;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;
	},

	scale: function(scaleX, scaleY)
	{
		this.scaleX = scaleX;
		this.scaleY = scaleY;

		this.width = this.initWidth * this.scaleX;
		this.height = this.initHeight * this.scaleY;
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;

		this.minX = this.x - this.halfWidth;
		this.minY = this.y - this.halfHeight;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;
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
		ctx.moveTo(minX, minY);
		ctx.lineTo(maxX, minY);
		ctx.lineTo(maxX, maxY);
		ctx.lineTo(minX, maxY);
		ctx.lineTo(minX, minY);
		ctx.stroke();
	},

	drawTranslated: function(ctx)
	{
		var camera = meta.camera;

		this.translate(camera._x, camera._y);
		this.draw(ctx);
		this.translate(-camera._x, -camera._y);
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