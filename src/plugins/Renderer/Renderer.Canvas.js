"use strict";

/**
 * @class Entity.CanvasRenderer
 * @extends Entity.Controller
 * @memberof! <global>
 */
Renderer.Canvas = Entity.Controller.extend
(/** @lends Entity.CanvasRenderer.prototype */ {

	init: function()
	{
		// Create cache front and back buffer.
		// this._cachedCanvas = document.createElement("canvas");
		// this._cachedCtx = this._cachedCanvas.getContext("2d");

		meta.subscribe(this, meta.Event.CAMERA_RESIZE, this.onCameraResize);

		this._super();

		this._tStaticCheck = Date.now();
	},

	release: function()
	{
		this._super();

		meta.unsubscribe(this, meta.Event.CAMERA_RESIZE);
	},


	// load: function() 
	// {
	// 	this._super();

	// 	var numCellX = this.endCellX - this.startCellX + 2;
	// 	var numCellY = this.endCellY - this.startCellY + 2;
	// 	this._cachedCanvas.width = numCellX * this._cellSizeX;
	// 	this._cachedCanvas.height = numCellY * this._cellSizeY;

	// 	//this._cachedCtx.fillStyle = meta.view.bgColor;
	// 	//this._cachedCtx.fillRect(0, 0, this._cachedCanvas.width, this._cachedCanvas.height);
	// },


	// update: function(tDelta)
	// {
	// 	var tNow = Date.now();
	// 	if(tNow - this._tStaticCheck < this.tStaticCheckDelay) {
	// 		return;
	// 	}

	// 	var entity;
	// 	var currNode = this.entities.first.next;
	// 	var lastNode = this.entities.last;
	// 	for(; currNode !== lastNode; currNode = currNode.next)
	// 	{
	// 		entity = currNode.entity;
	// 		if(!entity.isLoaded || !entity.texture) { continue; }
	// 		if(entity._isCached || tNow - entity._tChange < this.tStaticCheckDelay) {
	// 			continue;
	// 		}

	// 		this.cacheEntity(entity);
	// 		this.isNeedRender = true;
	// 	}

	// 	this._tStaticCheck = tNow;
	// },

	/**
	 * Render screen and update animations/interpolations.
	 * @param tDelta {Number} Time between this and previous frame.
	 */
	render: function(tDelta)
	{
		if(!this.isNeedRender)
		{
			var entity;
			for(var i = 0; i < this.numEntities; i++)
			{
				entity = this.entities[i];

				if(entity.isNeedStyle) {
					entity._style.update(entity);
				}
				if(entity._texture && entity.isAnimating) {
					entity._updateAnim(tDelta);
				}

				if(!entity._isLoaded) { continue; }

				if(entity.isNeedDraw) {
					this._reRender(i, tDelta);
					break;
				}
			}
		}
		else {
			this._renderAll(i, tDelta);
		}
	},


	_reRender: function(i, tDelta)
	{
		this.clearScreen();

		var scope = meta;
		var ctx = scope.ctx;
		var camera = scope.camera;
		var unitRatio = scope.unitRatio;
		var unitSize = scope.unitSize;

		ctx.save();
		ctx.translate(this.x * camera._zoom | 0, this.y * camera._zoom | 0);
		ctx.scale(camera._zoom * unitRatio, camera._zoom * unitRatio);	

		var entity;
		for(var i = 0; i < this.numEntities; i++)
		{
			entity = this.entities[i];
			
			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			if(this._clipVolume !== entity.clipVolume) 
			{
				if(entity.clipVolume === null) {
					ctx.restore();
				}
				else
				{
					ctx.save();
					var clip = entity.clipVolume;
					ctx.beginPath();
					ctx.rect(clip.minX * unitSize | 0, clip.minY * unitSize | 0, clip.width * unitSize, clip.height * unitSize);
					ctx.closePath();
					ctx.clip();	
				}

				this._clipVolume = entity.clipVolume;
			}			

			if(entity.ignoreZoom) {
				ctx.restore();
				ctx.save();
				entity.draw(ctx);
				ctx.scale(camera._zoom * unitRatio, camera._zoom * unitRatio);	
			}
			else {
				entity.draw(ctx);
			}

			entity._isNeedDraw = false;
		}

		for(; i < this.numEntities; i++)
		{
			entity = this.entities[i];

			if(entity.isNeedStyle) {
				entity._style.update(entity);
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}

			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			if(this._clipVolume !== entity.clipVolume) 
			{
				if(entity.clipVolume === null) {
					ctx.restore();
				}
				else
				{
					ctx.save();
					var clip = entity.clipVolume;
					ctx.beginPath();
					ctx.rect(clip.minX * unitSize | 0, clip.minY * unitSize | 0, clip.width * unitSize, clip.height * unitSize);
					ctx.closePath();
					ctx.clip();	
				}

				this._clipVolume = entity.clipVolume;
			}	

			if(entity.ignoreZoom) {
				ctx.restore();
				ctx.save();
				entity.draw(ctx);
				ctx.scale(camera._zoom * unitRatio, camera._zoom * unitRatio);	
			}
			else {
				entity.draw(ctx);
			}

			entity._isNeedDraw = false;
		}

		if(this._clipVolume !== null) {
			this._clipVolume = null;
			ctx.restore();
		}
		
		ctx.restore();

		// Debug.
		ctx.save();
		ctx.scale(camera._zoom, camera._zoom);	
		ctx.translate(this.x | 0, this.y | 0);

		this._drawBounds();
		if(this.showCells) {
			this._drawCells();
		}
		ctx.restore();

		this.isNeedRender = false;
	},

	_renderAll: function(currNode, tDelta)
	{
		this.clearScreen();

		var scope = meta;
		var ctx = scope.ctx;
		var camera = scope.camera;
		var unitRatio = scope.unitRatio;
		var unitSize = scope.unitSize;

		ctx.save();
		ctx.translate(this.x * camera._zoom | 0, this.y * camera._zoom | 0);
		ctx.scale(camera._zoom * unitRatio, camera._zoom * unitRatio);		

		var entity;
		for(var i = 0; i < this.numEntities; i++)
		{
			entity = this.entities[i];

			if(entity.isNeedStyle) {
				entity._style.update(entity);
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}

			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			if(this._clipVolume !== entity.clipVolume) 
			{
				if(entity.clipVolume === null) {
					ctx.restore();
				}
				else
				{
					ctx.save();
					var clip = entity.clipVolume;
					ctx.beginPath();
					ctx.rect(clip.minX * unitSize | 0, clip.minY * unitSize | 0, clip.width * unitSize, clip.height * unitSize);
					ctx.closePath();
					ctx.clip();	
				}

				this._clipVolume = entity.clipVolume;
			}

			if(entity.ignoreZoom) {
				ctx.restore();
				ctx.save();
				entity.draw(ctx);
				ctx.scale(camera._zoom * unitRatio, camera._zoom * unitRatio);	
			}
			else {
				entity.draw(ctx);
			}

			entity._isNeedDraw = false;
		}

		if(this._clipVolume !== null) {
			this._clipVolume = null;
			ctx.restore();
		}
		
		ctx.restore();

		// Debug.
		ctx.save();
		ctx.scale(camera._zoom, camera._zoom);	
		ctx.translate(this.x | 0, this.y | 0);

		this._drawBounds();
		if(this.showCells) {
			this._drawCells();
		}
		ctx.restore();

		this.isNeedRender = false;
	},


	/**
	 * Clean screen with background color.
	 */
	clearScreen: function()
	{
		var scope = meta;
		if(scope.view.bgTransparent) {
			scope.ctx.clearRect(0, 0, scope.width, scope.height);
		}
		else {
			scope.ctx.fillStyle = scope.engine.bgColor;
			scope.ctx.fillRect(0, 0, scope.width, scope.height);
		}
	},


	_drawBounds: function()
	{
		// Draw bounds:
		if(this.numShowBounds > 0 || this.showBounds)
		{
			var isCached = false;
			var unitSize = meta.unitSize;
			var unitRatio = meta.unitRatio;
			var camera = meta.camera;
			var ctx = meta.ctx;
			ctx.strokeStyle = "#ff0000";
			ctx.lineWidth = 2;

			var entity;
			var pivotOffsetX, pivotOffsetY;
			var parentOffsetX, parentOffsetY;
			for(var i = 0; i < this.numEntities; i++)
			{
				entity = this.entities[i];
				if((entity.showBounds || this.showBounds) && !entity.disableDebug && entity.isVisible && entity.isLoaded) {
					entity.drawBounds(ctx);
				}
			}
		}
	},

	_drawWorldBounds: function()
	{
		var world = meta.world;
		if(world.showBounds)
		{
			var ctx = meta.ctx;
			ctx.translate(this.x, this.y);
			ctx.strokeStyle = "#7AA3CC";
			ctx.lineWidth = 2;
			world.volume.draw(ctx);

			if(world.haveGrid)
			{
				var numX = world.numGridX;
				var numY = world.numGridY;
				var width = numX * world.gridWidth;
				var height = numY * world.gridHeight;

				ctx.translate(world.gridX, world.gridY);

				for(var x = 0; x <= numX; x++) {
					ctx.moveTo(x * world.gridWidth, 0);
					ctx.lineTo(x * world.gridHeight, height);
				}

				for(var y = 0; y <= numY; y++) {
					ctx.moveTo(0, y * world.gridHeight);
					ctx.lineTo(width, y * world.gridHeight);
				}

				ctx.stroke();
			}
		}
	},

	_drawCells: function()
	{
		var unitSize = meta.unitSize;
		var ctx = meta.ctx;
		ctx.strokeStyle = "orange";
		ctx.lineWidth = 2;
		ctx.beginPath();

		var offsetX = (this.x % this._cellSizeX);
		var offsetY = (this.y % this._cellSizeY);
		var numCellX = this.endCellX - this.startCellX;
		var numCellY = this.endCellY - this.startCellY;

		for(var x = 0; x <= numCellX; x++) {
			ctx.moveTo(offsetX + (x * this._cellSizeX), 0);
			ctx.lineTo(offsetX + (x * this._cellSizeX), meta.camera.height);
		}

		for(var y = 0; y <= numCellY; y++) {
			ctx.moveTo(0, offsetY + (y * this._cellSizeY));
			ctx.lineTo(meta.camera.width, offsetY + (y * this._cellSizeY));
		}

		ctx.stroke();
	},


	cacheEntity: function(entity)
	{
		// if(entity._isCached) { return; }

		// entity.draw(this._cachedCtx);
		// entity._isCached = true;
	},

	uncacheEntity: function(entity)
	{
		// if(!entity._isCached) { return; }

		// var volume = entity.volume;
		// this._cachedCtx.clearRect(this.x + volume.minX, this.y + volume.minY, volume.width, volume.height);
		// entity._isCached = false;
		// console.log("uncache");
	},


	/**
	 *	Callback on camera move event.
	 */
	// onMove: function(event, camera)
	// {
	// 	var diffX = this.x - camera._x; 
	// 	var diffY = this.y - camera._y;

	//  	this._super(event, camera);

	//  	this._cacheOffsetX -= diffX;
	//  	this._cacheOffsetY -= diffY;

	// // 	// var diffX = this.x - camera._x; 
	// // 	// var diffY = this.y - camera._y;
	// // 	// var width = camera.width - Math.abs(diffX);
	// // 	// var height = camera.height - Math.abs(diffY);

	// // 	// this._cachedCtx.drawImage(this._cachedCanvas, diffX, diffY, width, height, 0, 0, width, height);

	// 	var needRecache = false;

	// 	//var copyOffsetX = 
	// 	//this._cacheOffsetX = Math.abs(camera._x % this._cellSizeX);
	// 	//this._cacheOffsetY = Math.abs(camera._y % this._cellSizeY);



	// 		//this._cachedCtx.drawImage(this._cachedCanvas, diffX, diffY, width, height, 0, 0, width, height);
	//  },

	/**
	 *	Callback on camera resize event.
	 */
	onCameraResize: function(event, data)
	{
		
	},


	//
	_cachedCanvas: null,
	_cachedCtx: null,
	_cacheOffsetX: 0, _cacheOffsetY: 0,

	_tStaticCheck: 0,
	tStaticCheckDelay: 500,

	_clipVolume: null,

	x: 0, y: 0
});