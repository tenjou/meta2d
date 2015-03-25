"use strict";

/**
 * Class for managing viewable region.
 * @class
 * @property [x=0] {Number} Setter/Getter. Camera left coordinate on X axis.
 * @property [y=0] {Number} Setter/Getter. Camera top coordinate on Y axis.
 * @property volume {meta.math.AdvAABB} Volume of viewable region.
 * @property [zoom=1.0] {Number} Setter/Getter. Current zoom value.
 * @property [zoomRatio=1.0] {Number} Ratio of how smaller or larger is current view compared to default zoom (zoom = 1.0).
 * @property [enableBorderIgnore=true] {Boolean} Setter/Getter. Flag to enable camera movement past world borders.
 * @property [draggable=false] {Boolean} Setter/Getter. Flag to enable draggable.
 * @property [enableCentering=false] {Boolean} Setter/Getter. Flag to enable to move camera to the center as initial position.
 * @property [enableCenteringX=false] {Boolean} Setter/Getter. Flag to enable camera centering on X axis.
 * @property [enableCenteringY=false] {Boolean} Setter/Getter. Flag to enable camera centering on Y axis.
 * @property [enableAutoZoom=false] {Boolean} Setter/Getter. Flag to enable auto zooming that will set zoom so all world is visible.
 * @property [enableAutoZoomX=false] {Boolean} Setter/Getter. Flag to enable auto zoom on width.
 * @property [enableAutoZoomY=false] {Boolean} Setter/Getter. Flag to enable auto zoom on height.
 */
meta.Camera = function()
{
	this.volume = new meta.math.AABBext(0, 0, 0, 0);
	this.zoomBounds = null;

	this._autoZoom = false;
	this._zoom = 1.0;
	this.prevZoom = 1.0;
	this.zoomRatio = 1.0;
	
	this._draggable = false;
	this._dragging = false;
	this._moved = false;

	this._center = false;
	this._centerX = true;
	this._centerY = true;
	this._worldBounds = false;

	this._chnMove = null;
	this._chnResize = null;

	//
	this.init();
};

meta.Camera.prototype =
{
	init: function()
	{
		this._chnMove = meta.createChannel(meta.Event.CAMERA_MOVE);
		this._chnResize = meta.createChannel(meta.Event.CAMERA_RESIZE);

		meta.subscribe(this, meta.Event.RESIZE, this._onResize);
		meta.subscribe(this, meta.Event.WORLD_RESIZE, this._onWorldResize);

		this.zoomBounds = {
			width: -1, height: -1,
			minWidth: -1, minHeight: -1,
			maxWidth: -1, maxHeight: -1
		};
	},

	/**
	 * Destructor.
	 */
	release: function() 
	{
		this._chnMove.release();
		meta.unsubscribe(this, meta.Event.RESIZE);
		meta.unsubscribe(this, meta.Event.WORLD_RESIZE);
	},

	/** Update camera view. */
	updateView: function()
	{
		if(this._autoZoom) {
			this.updateAutoZoom();
		}
		else {
			this.updateZoom();
		}

		var world = meta.world;

		/* Initial position */
		if(!this._moved)
		{
			var moveX = 0;
			var moveY = 0;

			if(this._center)
			{
				if(this._centerX) {
					moveX = Math.floor((this.volume.width - world.width) / 2);
				}
				else {
					moveX = 0;
				}

				if(this._centerY) {
					moveY = Math.floor((this.volume.height - world.height) / 2);
				}
				else {
					moveY = 0;
				}
			}
			else {
				moveX = 0;
				moveY = 0;
			}

			this.volume.move(moveX, moveY);
		}
		
		this._chnMove.emit(this, meta.Event.CAMERA_MOVE);
	},

	updateZoom: function() 
	{
		if(this.prevZoom !== this._zoom) 
		{
			this.zoomRatio = 1.0 / this._zoom;		
			this.volume.scale(this.zoomRatio, this.zoomRatio);

			//meta.world.onResize(this, 0);
			this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
		}	
	},

	updateAutoZoom: function() 
	{
		var engine = meta.engine;
		var width = this.zoomBounds.width;
		var height = this.zoomBounds.height;
		var diffX = engine.width / width;
		var diffY = engine.height / height;

		this.prevZoom = this._zoom;
		this._zoom = diffX;
		if(diffY < diffX) { 
			this._zoom = diffY;
		}	
		
		if(engine.adaptResolution()) 
		{
			width = this.zoomBounds.width;
			height = this.zoomBounds.height;
			diffX = (engine.width / width);
			diffY = (engine.height / height);

			this._zoom = diffX;
			if(diffY < diffX) { 
				this._zoom = diffY;
			}

			this.volume.resize(engine.width, engine.height);		
		}

		this.updateZoom();
	},


	bounds: function(width, height)
	{
		this._autoZoom = true;
		this.zoomBounds.width = width;
		this.zoomBounds.height = height;
		
		if(this.volume.width !== 0 || this.volume.height !== 0) {
			this.updateView();		
		}
	},

	minBounds: function(width, height)
	{
		this._autoZoom = true;
		this.zoomBounds.minWidth = width;
		this.zoomBounds.minHeight = height;
		this.updateView();
	},

	maxBounds: function(width, height)
	{
		this._autoZoom = true;
		this.zoomBounds.maxWidth = width;
		this.zoomBounds.maxHeight = height;
		this.updateView();
	},

	_onInput: function(data, event)
	{
		var inputEvent = Input.Event;

		if(event === inputEvent.MOVE) {
			this._drag(data);
		}
		else if(event === inputEvent.DOWN)
		{
			if(data.keyCode !== 0) { return; }
			this._startDrag(data);
		}
		else if(event === inputEvent.UP)
		{
			if(data.keyCode !== 0) { return; }
			this._endDrag(data);
		}
	},

	_onResize: function(data, event)
	{
		this._prevZoom = this._zoom;
		this._zoom = meta.engine.zoom;
		this.volume.resize(data.width, data.height);
		this.updateView();
	},

	_onWorldResize: function(data, event) {
		this.updateView();
	},

	_startDrag: function(data)
	{
		if(!this._draggable) { return; }
		this._dragging = true;
	},

	_endDrag: function(data) {
		this._dragging = false;
	},

	_drag: function(data)
	{
		if(!this._dragging) { return; }

		var scope = meta;
		var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
		var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;
		this._moved = true;

		if(this._worldBounds) 
		{
			var worldVolume = scope.world.volume;
			var newX = this.volume.minX - diffX; 
			var newY = this.volume.minY - diffY;

			if(newX < worldVolume.minX) {
				diffX -= worldVolume.minX - newX;
			}
			else if(newX + this.volume.width > worldVolume.maxX) {
				diffX = this.volume.maxX - worldVolume.maxX;
			}

			if(newY < worldVolume.minY) {
				diffY -= worldVolume.minY - newY;
			}
			else if(newY + this.volume.height > worldVolume.maxY) {
				diffY = this.volume.maxY - worldVolume.maxY;
			}
		}

		this.volume.move(-diffX, -diffY);
		this._x = this.volume.minX;
		this._y = this.volume.minY;

		this._chnMove.emit(this, scope.Event.CAMERA_MOVE);
		scope.renderer.needRender = true;
	},


	set x(value)
	{
		if(this._x === value) { return; }

		this._x = value;
		this._moved = true;
		this.updateView();
	},

	set y(value)
	{
		if(this._y === value) { return; }

		this._y = value;
		this._moved = true;
		this.updateView();
	},

	get x() { return this.volume.x; },
	get y() { return this.volume.y; },

	get width() { return this.volume.width; },
	get height() { return this.volume.height; },

	set zoom(value)
	{
		if(this._zoom === value) { return; }

		this.prevZoom = this._zoom;
		this._zoom = value;
		this.updateView();
	},

	get zoom() { return this._zoom; },


	set enableBorderIgnore(value) {
		this._enableBorderIgnore = value;
		this.updateView();
	},

	get enableBorderIgnore() { return this._enableBorderIgnore; },

	set draggable(value)
	{
		if(this._draggable === value) { return; }

		this._draggable = value;

		var events = [ Input.Event.DOWN, Input.Event.UP, Input.Event.MOVE ];

		if(value) {
			meta.subscribe(this, events, this._onInput);
		}
		else {
			meta.unsubscribe(this, events);
			this._dragging = false;
		}
	},

	get draggable() { return this._draggable; },

	set autoZoom(value) 
	{
		if(this._autoZoom === value) { return; }
		this._autoZoom = value;

		this.updateView();
	},

	get autoZoom() { return this._autoZoom; },

	set worldBounds(value) 
	{
		if(this._worldBounds === value) { return; }
		this._worldBounds = value;

		this.updateView();
	},

	get worldBounds() { return this._worldBounds; },

	/* Enable centering */
	set center(value) {
		this._center = value;
		this.updateView();
	},

	set centerX(value) {
		this._centerX = value;
		this.updateView();
	},

	set centerY(value) {
		this._centerY = value;
		this.updateView();
	},

	get center() { return this._center; },
	get centerX() { return this._centerX; },
	get centerY() { return this._centerY; }
};
