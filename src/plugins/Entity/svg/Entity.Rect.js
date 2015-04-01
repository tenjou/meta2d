"use strict";

meta.class("Entity.Rect", "Entity.SVG", 
{
	draw: function(ctx)
	{
		ctx.beginPath();
		ctx.rect(this.volume.minX, this.volume.minY, this.volume.width, this.volume.height);
		
		if(this._fillStyle) {
			ctx.fillStyle = this._fillStyle;
			ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			ctx.lineWidth = this._lineWidth;
			ctx.strokeStyle = this._strokeStyle;
			ctx.stroke();
		}
	}
});
