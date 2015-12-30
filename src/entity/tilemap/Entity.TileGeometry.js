"use strict";

meta.class("Entity.TileGeometry", "Entity.Geometry", 
{
	setCell: function(cellX, cellY)
	{
		this.cellX = cellX;
		this.cellY = cellY;

		//this.parent.calcEntityPos(this);

		if(this.parent instanceof Entity.TilemapLayer) {
			//this.parent.
		}
	},

	//
	cellX: 0,
	cellY: 0
});
