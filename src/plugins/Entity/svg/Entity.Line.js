"use strict";

Entity.Line = Entity.SVG.extend
({
	draw: function(ctx)
	{
		this.globalAlpha = this._alpha;

		ctx.lineWidth = this._lineWidth;
		ctx.strokeStyle = this._strokeStyle;

		ctx.beginPath();
		ctx.moveTo(this.volume.absX + this.x1, this.volume.absY + this.y1);
		ctx.lineTo(this.volume.absX + this.x2, this.volume.absY + this.y2);
		ctx.stroke();

		this.globalAlpha = 1.0;
	},

	set: function(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.renderer.needRender = true;
	},

	//
	x1: 0, y1: 0, x2: 0, y2: 0
});
