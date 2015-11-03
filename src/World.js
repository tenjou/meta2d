"use strict";

meta.class("meta.World",
{
	init: function(width, height) 
	{
		this.volume = new meta.math.AABB(0, 0, 0, 0);
		this.volumes = [ this.volume ];

		this.onResize = meta.createChannel(meta.Event.WORLD_RESIZE);
		meta.camera.onResize.add(this._updateBounds, this);
	},

	bounds: function(minX, minY, maxX, maxY) {
		this.volume.set(minX, minY, maxX - minX, maxY - minY);
		this.centerX = minX + (maxX - minX) / 2;
		this.centerY = minY + (maxY - minY) / 2;
		this._adapt = false;
		//this._chn.emit(this, meta.Event.WORLD_RESIZE);
	},

	_updateBounds: function(camera, event) 
	{
		if(!this._adapt) { return; }

		this.volume.set(0, 0, Math.ceil(camera.width), Math.ceil(camera.height));
		this.centerX = camera.width / 2;
		this.centerY = camera.height / 2;
		//this._chn.emit(this, meta.Event.WORLD_RESIZE);
	},

	removeVolume: function(volume) 
	{
		var num = this.volumes.length;
		for(var i = 0; i < num; i++) 
		{
			if(this.volumes[i] === volumes) {
				this.volumes[i] = this.volumes[num - 1];
				this.volumes.pop();
				break;
			}
		}
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
			this._updateBounds(meta.camera, 0);
		}
	},

	get adapt() { return this._adapt; },

	get width() { return this.volume.width; },
	get height() { return this.volume.height; },

	//
	onResize: null,

	//
	volume: null,
	centerX: 0,
	centerY: 0,

	volumes: null,

	_adapt: true,
	_screenBounds: true
});
