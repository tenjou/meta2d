"use strict";

meta.class("Entity.TileGeometry", "Entity.Geometry", 
{
	update: function(tDelta)
	{
		if(this.needMoving)
		{
			var distance = meta.math.length(this.volume.x - this.totalOffsetX, this.volume.y - this.totalOffsetY, this.targetX, this.targetY);
			if(distance <= (this.speed * tDelta)) 
			{
				this.position(this.targetX, this.targetY);
				this.needMoving = false;
				if(this.onMoveDone) {
					this.onMoveDone();
				}

				if(this.targets) {
					this.moveToCells(this.targets);
				}
			}
			else 
			{
				this._tmpVec.x = this.targetX - this.volume.x + this.totalOffsetX;
				this._tmpVec.y = this.targetY - this.volume.y + this.totalOffsetY;
				this._tmpVec.normalize();

				var speed = this.speed * tDelta;
				this.move(this._tmpVec.x * speed, this._tmpVec.y * speed);
			}
		}
	},

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

	moveToCell: function(cellX, cellY)
	{
		var cellPos = this.parent.cellPos;
		cellPos.cellX = cellX;
		cellPos.cellY = cellY;
		this.parent.getPosEx(cellPos);
		this.targetX = cellPos.x;
		this.targetY = cellPos.y;

		this.needMoving = true;
		this.updating = true;
	},

	moveToCells: function(cells)
	{
		if(cells.length === 0) { return; }

		this.targets = cells;
		var target = this.targets.pop();
		this.moveToCell(target.x, target.y);
	},

	stopMoving: function() 
	{
		this.needMoving = false;
		this.updating = false;
		this.target = null;
	},

	onMoveDone: null,

	_setView: function(view, parent) {},

	//
	cellX: 0,
	cellY: 0,
	_cellId: -1,
	_cellIndex: -1,
	
	needMoving: false,
	targets: null,
	targetCellX: 0,
	targetY: 0,
	speed: 150,
	_tmpVec: new meta.math.Vector2(0, 0)
});
