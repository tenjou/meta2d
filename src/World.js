"use strict";

meta.World = function(width, height)
{
	this.chn = null;

	this.volume = new meta.math.AdvAABB(0, 0, 0, 0);
	this.minWidth = -1;
	this.minHeight = -1;
	this.maxHeight = -1;
	this.maxHeight = -1;

	this.centerX = 0;
	this.centerY = 0;

	this.gridX = 0;
	this.gridY = 0;
	this.gridWidth = 0;
	this.gridHeight = 0;
	this.numGridX = 0;
	this.numGridY = 0;

	this.haveGrid = false;

	this._discardUnusedSpace = false;
	this.lockGrid = false;
	this.showBounds = false;

	//
	this.init(width, height)
};

meta.World.prototype =
{
	init: function(width, height) {
		this.bounds(width, height);
		this.chn = meta.createChannel(meta.Event.WORLD_RESIZE);
		meta.subscribe(this, meta.Event.CAMERA_RESIZE, this.onCameraResize);
	},


	updateVolume: function()
	{
		// var width = this.volume.width;
		// var height = this.volume.height;

		// if(this.minWidth > -1 && width < this.minWidth) {
		// 	width = this.minWidth;
		// }
		// else if(this.maxWidth > -1 && width > this.maxWidth) {
		// 	width = this.maxWidth;
		// }
		// if(this.minHeight > -1 && height < this.minHeight) {
		// 	height = this.minHeight;
		// }
		// else if(this.maxHeight > -1 && height > this.maxHeight) {
		// 	height = this.maxHeight;
		// }		

		var scope = meta;
		var width = (scope.camera.width * scope.unitRatio + 0.5) | 0;
		var height = (scope.camera.height * scope.unitRatio + 0.5) | 0;

		this.centerX = width / 2;
		this.centerY = height / 2;
		this.volume.resize(width, height);

		if(this.chn) {
			this.chn.emit(scope.Event.WORLD_RESIZE, this);
		}
	},


	bounds: function(width, height)
	{
		this.volume.resize(width, height);
		this.updateVolume();		
	},

	minBounds: function(width, height)
	{
		this.minWidth = width;
		this.minHeight = height;
		this.updateVolume();
	},

	maxBounds: function(width, height)
	{
		this.maxWidth = width;
		this.maxHeight = height;
		this.updateVolume();
	},


	setGrid: function(obj)
	{
		obj.x = obj.x || 0;
		obj.y = obj.y || 0;
		obj.width = obj.width || 16;
		obj.height = obj.height || 16;
		obj.sizeX = obj.sizeX || 1;
		obj.sizeY = obj.sizeY || 1;

		this.setGridPosition(obj.x, obj.y);
		this.setGridResolution(obj.width, obj.height);
		this.setGridSize(obj.sizeX, obj.sizeY);
	},

	setGridResolution: function(width, height)
	{
		this.gridWidth = width;
		this.gridHeight = height;

		this.haveGrid = (width || height);

		if(!this.lockGrid) {
			this.numGridX = Math.floor(this.width / width);
			this.numGridY = Math.floor(this.height / height);
		}

		if(this.haveGrid && this._discardUnusedSpace) {
			this.setBounds(this.numGridX * this.gridWidth, this.numGridY * this.gridHeight);
		}
	},

	setGridSize: function(numGridX, numGridY)
	{
		this.numGridX = numGridX;
		this.numGridY = numGridY;

		this.lockGrid = (numGridX || numGridY);

		if(this.haveGrid)
		{
			var width = this.numGridX * this.gridWidth;
			var height = this.numGridY * this.gridHeight;

			if(this.width > width) { width = this.width; }
			if(this.height > height) { height = this.height; }

			this.setBounds(width, height);

			if(!this.lockGrid) {
				this.numGridX = Math.floor(this.width / this.gridWidth);
				this.numGridY = Math.floor(this.height / this.gridHeight);
			}
		}
	},

	setGridPosition: function(x, y) {
		this.gridX = x;
		this.gridY = y;
	},


	getGridPosX: function(x) {
		return this.gridX + (this.gridWidth * x);
	},

	getGridPosY: function(y) {
		return this.gridY + (this.gridHeight * y);
	},

	getGridFromWorldX: function(x)
	{
		var gridX = Math.floor((x - this.gridX) / this.gridWidth);

		if(gridX < -1) { gridX = -1; }
		else if(gridX >= this.numGridX) { gridX = -1; }

		return gridX;
	},

	getGridFromWorldY: function(y)
	{
		var gridY = Math.floor((y - this.gridY) / this.gridHeight);

		if(gridY < -1) { gridY = -1; }
		else if(gridY >= this.numGridY) { gridY = -1; }

		return gridY;
	},


	get randX() {
		return meta.random.number(0, this.volume.width);
	},

	get randY() {
		return meta.random.number(0, this.volume.height);
	},


	onCameraResize: function(data, event) {
		this.updateVolume();
	},


	set discardUnusedSpace(value)
	{
		this._discardUnusedSpace = value;
		if(value && this.haveGrid) {
			this.setBounds(this.gridX + (this.numGridX * this.gridWidth), this.gridY + (this.numGridY * this.gridHeight));
		}
	},

	get discardUnusedSpace() { return this._discardUnusedSpace; },


	get left() { return this.volume.minX; },
	get right() { return this.volume.maxX; },
	get top() { return this.volume.minY; },
	get bottom() { return this.volume.maxY; },

	get width() { return this.volume.width; },
	get height() { return this.volume.height; }
};