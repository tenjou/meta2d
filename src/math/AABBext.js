"use strict";

meta.math.AABBext = function()
{
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.halfWidth = 0;
	this.halfHeight = 0;
	this.initWidth = 0;
	this.initHeight = 0;

	this.minX = 0;
	this.minY = 0;
	this.maxX = 0;
	this.maxY = 0;
};

meta.math.AABBext.prototype = 
{
	/** 
	 * position
	 * @param x {number}
	 * @param y {number}
	 */	
	position: function(x, y)
	{
		this.x = x;
		this.y = y;

		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;
	},

	/** 
	 * move
	 * @param x {number}
	 * @param y {number}
	 */
	move: function(x, y)
	{
		this.x += x;
		this.y += y;

		this.minX += x;
		this.minY += y;
		this.maxX += x;
		this.maxY += y;
	},

	/** updatePos */
	updatePos: function()
	{
		this.minX = this.x - this.pivotPosX;
		this.minY = this.y - this.pivotPosY;
		this.maxX = this.minX + this.width;
		this.maxY = this.minY + this.height;		
	},

	/** 
	 * pivot
	 * @param x {number}
	 * @param y {number}
	 */
	pivot: function(x, y)
	{
		if(y === void(0)) { y = x; }

		this.pivotX = x;
		this.pivotY = y;
		this.initPivotPosX = this.initWidth * this.pivotX | 0;
		this.initPivotPosY = this.initHeight * this.pivotY | 0;	

		this.updatePivotPos();	
	},	

	/** updatePivotPos */
	updatePivotPos: function() 
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

	/** 
	 * resize
	 * @param width {number}
	 * @param height {number}
	 */
	resize: function(width, height)
	{
		this.initWidth = width;
		this.initHeight = height;
		this.initPivotPosX = width * this.pivotX | 0;
		this.initPivotPosY = height * this.pivotY | 0;
		this.width = width * Math.abs(this.scaleX) | 0;
		this.height = height * Math.abs(this.scaleY) | 0;	
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;

		this.updatePivotPos();
	},	

	scale: function(x, y)
	{
		//if(this.scaleX === x && this.scaleY === y) { return; }

		this.scaleX = x * this.flipX;
		this.scaleY = y * this.flipY;
		this.width = Math.floor(this.initWidth * x);
		this.height = Math.floor(this.initHeight * y);
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;
		
		this.updatePosTransform();
	},

	flip: function(x, y)
	{
		if(x === void(0)) {
			this.flipX = -this.flipX;
			this.scaleX *= -1.0;
		}
		else if(this.flipX !== x) {
			this.flipX = x;
			this.scaleX *= -1.0;
		}

		if(y === void(0)) {}
		else if(this.flipY !== y) {
			this.flipY = y;
			this.scaleY *= -1.0;
		}			

		this.updatePosTransform();
	},

	/** 
	 * rotate
	 * @param width {number}
	 * @param height {number}
	 */
	rotate: function(angle)
	{
		this.angle = angle;

		this.sin = Math.sin(angle);
		this.cos = Math.cos(angle);
		this.m11 = this.cos * this.scaleX;
		this.m12 = this.sin * this.scaleX;
		this.m21 = -this.sin * this.scaleY;
		this.m22 = this.cos * this.scaleY;

		this.__transformed = 1;
	},

	/** updatePosTransform */
	updatePosTransform: function()
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

		this.m11 = this.cos * this.scaleX;
		this.m12 = this.sin * this.scaleX;
		this.m21 = -this.sin * this.scaleY;
		this.m22 = this.cos * this.scaleY;

		this.__transformed = 1;
	},	

	vsAABB: function(src)
	{
		if(this.maxX <= src.minX || this.minX >= src.maxX) { return false; }
		if(this.maxY <= src.minY || this.minY >= src.maxY) { return false; }

		return true;
	},

	vsAABBIntersection: function(src)
	{
		if(this.maxX < src.minX || this.minX > src.maxX) { return 0; }
		if(this.maxY < src.minY || this.minY > src.maxY) { return 0; }

		if(this.minX >= src.minX || this.minY >= src.minY) { return 1; }
		if(this.maxX <= src.maxX || this.maxY <= src.maxY) { return 1; }

		return 2;
	},

	vsPoint: function(x, y)
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
			console.log("(Volume) " + str + " minX: " + this.minX + " minY: " + this.minY
				+ " maxX: " + this.maxX + " maxY: " + this.maxY);
		}
		else
		{
			console.log("(Volume) minX: " + this.minX + " minY: " + this.minY
				+ " maxX: " + this.maxX + " maxY: " + this.maxY);
		}
	},

	//
	pivotX: 0, pivotY: 0,
	pivotPosX: 0, pivotPosY: 0,
	initPivotPosX: 0, initPivotPosY: 0,
	anchorPosX: 0, anchorPosY: 0,

	scaleX: 1, scaleY: 1,
	flipX: 1, flipY: 1,
	angle: 0,

	sin: 0, cos: 1,
	m11: 1, m12: 0, m21: 0, m22: 1,
	__transformed: 0
};
