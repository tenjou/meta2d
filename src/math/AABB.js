"use strict";

meta.math.AABB = function(x, y, width, height)
{
	/** 
	 * x 
	 * @type {number=0}
	 */
	this.x = x || 0;

	/** 
	 * y 
	 * @type {number=0}
	 */
	this.y = y || 0;	

	/** 
	 * width 
	 * @type {number=0}
	 */
	this.width = width || 0;

	/** 
	 * height 
	 * @type {number=0}
	 */
	this.height = height || 0;

	this.halfWidth = this.width / 2;
	this.halfHeight = this.height / 2;

	/** 
	 * pivotPosX 
	 * @type {number}
	 */
	this.pivotPosX = this.width * this.pivotX;

	/** 
	 * pivotPosY 
	 * @type {number}
	 */
	this.pivotPosY = this.height * this.pivotY;	

	/** 
	 * minX 
	 * @type {number}
	 */
	this.minX = this.x;

	/** 
	 * minY 
	 * @type {number}
	 */
	this.minY = this.y;

	/** 
	 * maxX 
	 * @type {number}
	 */
	this.maxX = this.x + this.width;

	/** 
	 * maxY 
	 * @type {number}
	 */
	this.maxY = this.y + this.height;
};

meta.math.AABB.prototype =
{
	/** 
	 * set
	 * @param x {number}
	 * @param y {number}
	 * @param width {number}
	 * @param height {number}
	 */	
	set: function(x, y, width, height) 
	{
		this.x = x || 0;
		this.y = y || 0;	
		this.width = width || 0;
		this.height = height || 0;
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;
		this.pivotPosX = this.width * this.pivotX;
		this.pivotPosY = this.height * this.pivotY;	

		this.minX = this.x;
		this.minY = this.y;
		this.maxX = this.x + this.width;
		this.maxY = this.y + this.height;
	},

	position: function(x, y)
	{
		this.x = x;
		this.y = y;
		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;
	},

	move: function(x, y)
	{
		this.x += x;
		this.y += y;
		this.minX += x;
		this.minY += y;
		this.maxX += x;
		this.maxY += y;
	},

	resize: function(width, height)
	{
		this.width = width;
		this.height = height;
		this.halfWidth = width / 2;
		this.halfHeight = height / 2;	
		this.pivotPosX = this.width * this.pivotX;
		this.pivotPosY = this.height * this.pivotY;
		
		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;		
	},

	pivot: function(x, y)
	{
		if(y === void(0)) { y = x; }

		this.pivotX = x;
		this.pivotY = y;
		this.pivotPosX = this.width * this.pivotX;
		this.pivotPosY = this.height * this.pivotY;

		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;		
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


	/** 
	 * pivotX 
	 * @type {number=0}
	 */
	pivotX: 0,

	/** 
	 * pivotY 
	 * @type {number=0}
	 */
	pivotY: 0,

	type: meta.math.VolumeType.AABB
};
