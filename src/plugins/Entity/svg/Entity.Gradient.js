"use strict";

Entity.Gradient = Entity.Geometry.extend
({
	init: function() {
		this.clear();
	},

	draw: function(ctx) {
		ctx.fillStyle = this._gradient;
		ctx.fillRect(this.volume.minX | 0, this.volume.minY | 0, this.volume.width | 0, this.volume.height | 0);
	},

	clear: function() {
		this._gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
		this._points = [];
	},

	colorStops: function(buffer)
	{
		var gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);

		var num = buffer.length;
		for(var i = 0; i < num; i += 2) {
			gradient.addColorStop(buffer[i], buffer[i + 1]);
		}

		this._gradient = gradient;
		this.renderer.needDraw = true;
	},

	_updateResize: function() {
		this._gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
		this._super();
	},

	set gradient(gradient) 
	{
		if(!gradient) {
			gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
		}

		this._gradient = gradient;
		this.renderer.needDraw = true;
	},

	get gradient() { return this._gradient; },

	Point: function(point, hex) {
		this.point = point;
		this.hex = hex;
	},

	//
	_gradient: null,
	_points: null,
});
