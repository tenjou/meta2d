"use strict";

Entity.Rect = Entity.SVG.extend
({
	draw: function(ctx)
	{
		ctx.beginPath();
		ctx.rect(this.volume.minX, this.volume.minY, 
			this.volume.maxX, this.volume.maxY);

		console.log(this._fillStyle)
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
