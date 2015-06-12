"use strict";

meta.class("Entity.Line", "Entity.SVG", 
{
	draw: function(ctx)
	{
		this.globalAlpha = this._alpha;

		ctx.lineWidth = this._lineWidth;
		ctx.strokeStyle = this._strokeStyle;

		ctx.beginPath();
		ctx.moveTo(this.volume.x, this.volume.y);
		ctx.lineTo(this.toX, this.toY);
		ctx.stroke();	

		this.globalAlpha = 1.0;
	},

	to: function(x, y) 
	{
		if(this.toX === x && this.toY === y) { return; }

		this.toX = x;
		this.toY = y;
		this.renderer.needRender = true;
	},

	//
	toX: 0, toY: 0
});
