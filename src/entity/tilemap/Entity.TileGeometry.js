"use strict";

meta.class("Entity.TileGeometry", "Entity.Geometry", 
{
	updatePos: function()
	{
		this._super();

		if(this.layerParent) {
			this.layerParent._calcEntityCell(this);
		}
	},

	setCell: function(cellX, cellY)
	{
		this.cellX = cellX;
		this.cellY = cellY;

		if(this.layerParent) {
			this.layerParent._calcEntityPos(this);
		}
	},

	//
	layerParent: null,

	cellX: 0,
	cellY: 0,
	_cellId: -1,
	_cellIndex: -1
});
