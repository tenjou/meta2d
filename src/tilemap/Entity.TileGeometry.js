"use strict";

meta.class("Entity.TileGeometry", "Entity.Geometry", 
{
	updatePos: function()
	{
		this._super();

		this.parent._calcEntityCell(this);
	},

	setCell: function(cellX, cellY)
	{
		this.cellX = cellX;
		this.cellY = cellY;
		this.parent._calcEntityPos(this);
	},

	_setView: function(view, parent) {},

	//
	cellX: 0,
	cellY: 0,
	_cellId: -1,
	_cellIndex: -1
});
