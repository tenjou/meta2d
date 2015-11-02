"use strict";

meta.class("Entity.Circle", "Entity.SVG", 
{
	init: function() {
		this.pivot(0.5);
		this.volume.resize(this.radius * 2, this._radius * 2);
	},

	draw: function(ctx)
	{
		ctx.globalAlpha = this._alpha;

		ctx.beginPath();
		ctx.arc(
			this.volume.x, this.volume.y, 
			this.radius, 0, Math.PI * 2, false);
		
		if(this._fillStyle) {
			ctx.fillStyle = this._fillStyle;
			ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			ctx.lineWidth = this._lineWidth;
			ctx.strokeStyle = this._strokeStyle;
			ctx.stroke();
		}
	},

	set radius(radius) {
		this._radius = radius;
		this.volume.resize(radius * 2, radius * 2);
		this.updateTotalOffset();
	},

	get radius() { return this._radius; },

	//
	_radius: 20
});
