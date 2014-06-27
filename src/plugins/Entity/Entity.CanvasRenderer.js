"use strict";

/**
 * @class Entity.CanvasRenderer
 * @extends Entity.Controller
 * @memberof! <global>
 */
Entity.CanvasRenderer = Entity.Controller.extend
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
		var currNode = this.entities.first.next;

		if(!this.isNeedRender)
		{
			var entity;
			var lastNode = this.entities.last;
			for(; currNode !== lastNode; currNode = currNode.next)
			{
				entity = currNode.entity;
				if(entity.isNeedState) {
					entity.updateState();
				}
				if(entity._texture && entity.isAnimating) {
					entity._updateAnim(tDelta);
				}

				if(!entity._isLoaded) { continue; }

				if(entity.isNeedDraw) {
					this._reRender(currNode.next, tDelta);
					break;
				}
			}
		}
		else {
			this._renderAll(currNode, tDelta);
		}
	},


	_reRender: function(untilNode, tDelta)
	{
		this.clearScreen();

		var scope = meta;
		var ctx = scope.ctx;
		var camera = meta.camera;

		ctx.save();
		ctx.scale(camera._zoom, camera._zoom);
		// ctx.drawImage(this._cachedCanvas, 
		// 	0, 0, camera.width, camera.height,
		// 	0, 0, camera.width, camera.height);

		var entity;
		var currNode = this.entities.first.next;
		for(; currNode !== untilNode; currNode = currNode.next)
		{
			entity = currNode.entity;
			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			entity.draw(ctx);
			entity._isNeedDraw = false;
		}

		var lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;

			if(entity.isNeedState) {
				entity.updateState();
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}

			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			if(entity.ignoreZoom) {
				ctx.restore();
				ctx.save();
				entity.draw(ctx);
				ctx.scale(camera._zoom, camera._zoom);
			}
			else {
				entity.draw(ctx);
			}

			entity._isNeedDraw = false;
		}

		this._drawBounds();
//		this._drawWorldBounds();

		ctx.restore();

		this.isNeedRender = false;
	},

	_renderAll: function(currNode, tDelta)
	{
		this.clearScreen();

		var scope = meta;
		var ctx = scope.ctx;
		var camera = scope.camera;

		ctx.save();
		ctx.scale(camera._zoom, camera._zoom);
		// ctx.drawImage(this._cachedCanvas, 
		// 	0, 0, camera.width, camera.height,
		// 	this._cacheOffsetX, this._cacheOffsetY, camera.width, camera.height);

		var entity;
		var lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;

			if(entity.isNeedState) {
				entity.updateState();
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}

			if(entity._isCached || !entity.isVisible || !entity._isLoaded) { continue; }

			if(entity.ignoreZoom) {
				ctx.restore();
				ctx.save();
				entity.draw(ctx);
				ctx.scale(camera._zoom, camera._zoom);
			}
			else {
				entity.draw(ctx);
			}

			entity._isNeedDraw = false;
		}

		this._drawBounds();
		if(this.showCells) {
			this._drawCells();
		}
//		this._drawWorldBounds();

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
			scope.ctx.fillStyle = scope.view.bgColor;
			scope.ctx.fillRect(0, 0, scope.width, scope.height);
		}
	},


	_drawBounds: function()
	{
		// Draw bounds.
		if(this.numShowBounds > 0 || this.showBounds)
		{
			var isCached = false;
			var ctx = meta.ctx;
			ctx.strokeStyle = "#ff0000";
			ctx.lineWidth = 2;

			var entity;
			var pivotOffsetX, pivotOffsetY;
			var currNode = this.entities.first.next;
			var lastNode = this.entities.last;
			for(; currNode !== lastNode; currNode = currNode.next)
			{
				entity = currNode.entity;
				if((entity._showBounds || this.showBounds) && entity.enableDebug && entity.isVisible && entity.isLoaded)
				{
					if(isCached !== entity._isCached)
					{
						if(entity.isCached || entity.isHighlight) {
							ctx.strokeStyle = "#339933";
						}
						else {
							ctx.strokeStyle = "#ff0000";
						}

						isCached = !isCached;
					}

					ctx.save();
					ctx.translate(this.x, this.y);

					pivotOffsetX = entity.volume.x + entity.pivotX;
					pivotOffsetY = entity.volume.y + entity.pivotY;

					if(!entity.isChild) {
						ctx.translate(pivotOffsetX, pivotOffsetY);
						ctx.rotate(entity._angleRad);
						ctx.translate(-pivotOffsetX, -pivotOffsetY);
					}
					else {
						ctx.translate(entity._parent.childOffsetX, entity._parent.childOffsetY);
						ctx.rotate(entity._angleRad);
						ctx.translate(-entity._parent.childOffsetX, -entity._parent.childOffsetY);
					}

					entity.volume.draw(ctx);
					this._centerTex.draw(ctx, pivotOffsetX - 3, pivotOffsetY - 3);

					ctx.restore();
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

	x: 0, y: 0
});