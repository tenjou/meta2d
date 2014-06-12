"use strict";

/**
 * Class for managing viewable region.
 * @constructor
 * @property [x=0] {Number} Setter/Getter. Camera left coordinate on X axis.
 * @property [y=0] {Number} Setter/Getter. Camera top coordinate on Y axis.
 * @property volume {meta.Math.AdvAABB} Volume of viewable region.
 * @property [zoom=1.0] {Number} Setter/Getter. Current zoom value.
 * @property [zoomRatio=1.0] {Number} Ratio of how smaller or larger is current view compared to default zoom (zoom = 1.0).
 * @property [enableBorderIgnore=true] {Boolean} Setter/Getter. Flag to enable camera movement past world borders.
 * @property [draggable=false] {Boolean} Setter/Getter. Flag to enable dragging.
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
	this.volume = new meta.Math.AdvAABB(0, 0, 0, 0);
	this.zoomBounds = null;

	this._zoom = 1.0;
	this.zoomRatio = 1.0;

	this._draggable = false;
	this._isDragging = false;
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

		this.volume.resize(meta.width, meta.height);

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

		this.enableDrag = false;
	},


	/**
	 * Update camera view.
	 */
	updateView: function()
	{
		var world = meta.world;
		var prevZoom = this._zoom;

		/* AutoZoom */
		if(this._isAutoZoom)
		{
			var width = this.zoomBounds.width;
			var height = this.zoomBounds.height;

			// if(this.zoomBounds.minWidth > -1 && width < this.zoomBounds.minWidth) {
			// 	width = this.zoomBounds.minWidth;
			// }
			// else if(this.zoomBounds.maxWidth > -1 && width > this.zoomBounds.maxWidth) {
			// 	width = this.zoomBounds.maxWidth;
			// }
			// if(this.zoomBounds.minHeight > -1 && height < this.zoomBounds.minHeight) {
			// 	height = this.zoomBounds.minHeight;
			// }
			// else if(this.zoomBounds.maxHeight > -1 && height > this.zoomBounds.maxHeight) {
			// 	height = this.zoomBounds.maxHeight;
			// }	

			var diffX = meta.width / width;
			var diffY = meta.height / height;

			this._zoom = diffX;
			if(diffY < diffX) { 
				this._zoom = diffY;
			}
		}

		if(prevZoom !== this._zoom) {
			this.zoomRatio = 1.0 / this._zoom;
			this.volume.scale(this.zoomRatio, this.zoomRatio);
			this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
		}

		/* Initial position */
		if(!this._wasMoved)
		{
			if(this._enableCentering)
			{
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


	bounds: function(width, height)
	{
		this._isAutoZoom = true;
		this.zoomBounds.width = width;
		this.zoomBounds.height = height;
		this.updateView();		
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

		if(event === inputEvent.INPUT_MOVE) {
			this._drag(data);
		}
		else if(event === inputEvent.INPUT_DOWN)
		{
			if(data.keyCode !== 0) { return; }
			this._startDrag(data);
		}
		else if(event === inputEvent.INPUT_UP)
		{
			if(data.keyCode !== 0) { return; }
			this._endDrag(data);
		}
	},

	_onResize: function(data, event)
	{
		this.volume.scale(1.0, 1.0);
		this.volume.resize(data.width, data.height);
		meta.world.onCameraResize(this, meta.Event.CAMERA_RESIZE);
		this.updateView();
		this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
	},

	_onWorldResize: function(data, event) {
		this.updateView();
	},


	_startDrag: function(data)
	{
		if(!this._draggable) { return; }
		this._isDragging = true;
	},

	_endDrag: function(data) {
		this._isDragging = false;
	},

	_drag: function(data)
	{
		if(!this._isDragging) { return; }

		var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
		var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;
		this._x += diffX;
		this._y += diffY;
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

		this._chnMove.emit(this, meta.Event.CAMERA_MOVE);
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

		if(value) {
			meta.subscribe(this, [ Input.Event.INPUT_DOWN, Input.Event.INPUT_UP, Input.Event.INPUT_MOVE ], this._onInput);
		}
		else {
			meta.unsubscribe(this, [ Input.Event.INPUT_DOWN, Input.Event.INPUT_UP, Input.Event.INPUT_MOVE ]);
			this._isDragging = false;
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