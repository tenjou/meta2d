"use strict";

meta.World = meta.class.extend
({
	init: function(width, height) 
	{
		this.volume = new meta.math.AABB(0, 0, 0, 0);

		this._chn = meta.createChannel(meta.Event.WORLD_RESIZE);
		meta.subscribe(this, meta.Event.RESIZE, this._updateBoundsFromEngine);
	},

	bounds: function(minX, minY, maxX, maxY) {
		this.volume.set(minX, minY, maxX - minX, maxY - minY);
		this.centerX = minX + (maxX - minX) / 2;
		this.centerY = minY + (maxY - minY) / 2;
		this._adapt = false;
		this._chn.emit(this, meta.Event.WORLD_RESIZE);
	},

	_updateBoundsFromEngine: function(engine, event) 
	{
		if(!this._adapt) { return; }
		
		this.volume.set(0, 0, engine.width, engine.height);
		this.centerX = engine.width / 2;
		this.centerY = engine.height / 2;
		this._chn.emit(this, meta.Event.WORLD_RESIZE);
	},

	get randX() {
		return meta.random.number(this.volume.minX, this.volume.maxX);
	},

	get randY() {
		return meta.random.number(this.volume.minY, this.volume.maxY);
	},

	set adapt(value) 
	{
		this._adapt = value;
		if(value) {
			this._updateBoundsFromEngine(meta.engine, 0);
		}
	},

	get adapt() { return this._adapt; },

	get width() { return this.volume.width; },
	get height() { return this.volume.height; },

	//
	volume: null,
	centerX: 0,
	centerY: 0,

	_chn: null,

	_adapt: true,
	_screenBounds: true
});
