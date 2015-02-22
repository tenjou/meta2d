"use strict";

/**
 * Class for managing viewable region.
 * @constructor
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
	this._x = 0;
	this._y = 0;
	this.volume = new meta.math.AdvAABB(0, 0, 0, 0);
	this.zoomBounds = null;

	this._zoom = 1.0;
	this.prevZoom = 1.0;
	this.zoomRatio = 1.0;

	this._draggable = false;
	this._isDraggable = false;
	this._isAutoZoom = false;

	this._enableBorderIgnore = true;

	this._enableCentering = false;
	this._enableCenteringX = true;
	this._enableCenteringY = true;

	this._chnMove = null;
	this._chnResize = null;
	this._wasMoved = false;

	//
	this.init();
};

meta.Camera.prototype =
{
	/**
	 * Constructor.
	 */
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


	/**
	 * Update camera view.
	 */
	updateView: function()
	{
		if(this._isAutoZoom) {
			this.updateAutoZoom();
		}
		else {
			this.updateZoom();
		}

		/* Initial position */
		if(!this._wasMoved)
		{
			if(this._enableCentering)
			{
				var world = meta.world;

				if(this._enableCenteringX) {
					this._x = Math.floor((this.volume.width - world.width) / 2);
				}
				else {
					this._x = 0;
				}

				if(this._enableCenteringY) {
					this._y = Math.floor((this.volume.height - world.height) / 2);
				}
				else {
					this._y = 0;
				}
			}
			else {
				this._x = 0;
				this._y = 0;
			}

			this.volume.move(this._x, this._y);
		}
		
		this._chnMove.emit(this, meta.Event.CAMERA_MOVE);
	},

	updateZoom: function() 
	{
		if(this.prevZoom !== this._zoom) 
		{
			this.zoomRatio = 1.0 / this._zoom;		
			this.volume.scale(this.zoomRatio, this.zoomRatio);
			this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
		}	
	},

	updateAutoZoom: function() 
	{
		var scope = meta;
		var width = this.zoomBounds.width;
		var height = this.zoomBounds.height;
		var diffX = scope.width / width;
		var diffY = scope.height / height;

		this.prevZoom = this._zoom;
		this._zoom = diffX;
		if(diffY < diffX) { 
			this._zoom = diffY;
		}	
		
		if(scope.engine.adapt()) 
		{
			width = this.zoomBounds.width;
			height = this.zoomBounds.height;
			diffX = (scope.width / width);
			diffY = (scope.height / height);

			this._zoom = diffX;
			if(diffY < diffX) { 
				this._zoom = diffY;
			}

			this.volume.resize(scope.width, scope.height);		
		}

		this.updateZoom();
	},


	bounds: function(width, height)
	{
		this._isAutoZoom = true;
		this.zoomBounds.width = width;
		this.zoomBounds.height = height;
		
		if(this.width !== 0 || this.height !== 0) {
			this.updateView();		
		}
	},

	minBounds: function(width, height)
	{
		this._isAutoZoom = true;
		this.zoomBounds.minWidth = width;
		this.zoomBounds.minHeight = height;
		this.updateView();
	},

	maxBounds: function(width, height)
	{
		this._isAutoZoom = true;
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
		this.volume.resize(data.width, data.height);
		this.updateView();
		this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
	},

	_onWorldResize: function(data, event) {
		
	},


	_startDrag: function(data)
	{
		if(!this._draggable) { return; }
		this._isDraggable = true;
	},

	_endDrag: function(data) {
		this._isDraggable = false;
	},

	_drag: function(data)
	{
		if(!this._isDraggable) { return; }

		var scope = meta;
		var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
		var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;
		this._x -= diffX;
		this._y -= diffY;
		this.volume.move(-diffX, -diffY);
		this._wasMoved = true;

		if(!this.enableBorderIgnore)
		{
			if(-this._x < 0) {
				this._x = 0;
			}
			if(-this._y < 0) {
				this._y = 0;
			}
		}

		this._chnMove.emit(this, scope.Event.CAMERA_MOVE);
		meta.renderer.needRender = true;
	},


	set x(value)
	{
		if(this._x === value) { return; }

		this._x = value;
		this._wasMoved = true;
		this.updateView();
	},

	set y(value)
	{
		if(this._y === value) { return; }

		this._y = value;
		this._wasMoved = true;
		this.updateView();
	},

	get x() { return this._x; },
	get y() { return this._y; },

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
			this._isDraggable = false;
		}
	},

	get draggable() { return this._draggable; },


	set isAutoZoom(value) 
	{
		if(this._isAutoZoom === value) { return; }
		this._isAutoZoom = value;
		this.updateView();
	},

	get isAutoZoom() { return this._isAutoZoom; },

	/* Enable centering */
	set enableCentering(value) {
		this._enableCentering = value;
		this.updateView();
	},

	set enableCenteringX(value) {
		this._enableCenteringX = value;
		this.updateView();
	},

	set enableCenteringY(value) {
		this._enableCenteringY = value;
		this.updateView();
	},

	get enableCentering() { return this._enableCentering; },
	get enableCenteringX() { return this._enableCenteringX; },
	get enableCenteringY() { return this._enableCenteringY; }
};