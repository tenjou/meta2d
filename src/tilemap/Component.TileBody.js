"use strict";

meta.class("Component.TileBody", "Component.Basic", 
{
	update: function(tDelta)
	{
		if(this.needMoving)
		{
			var volume = this.owner.volume;
			var distance = meta.math.length(
				volume.x - this.owner.totalOffsetX, 
				volume.y - this.owner.totalOffsetY, 
				this.targetX, this.targetY);

			if(distance <= (this.speed * tDelta)) 
			{
				this.owner.position(this.targetX, this.targetY);
				if(this.targets && this.targets.length > 0) {
					this.moveToCells(this.targets);
				}
				else {
					this.needMoving = false;
				}				

				if(this.onMoveDone) {
					this.onMoveDone.call(this);
				}
			}
			else 
			{
				this._tmpVec.x = this.targetX - volume.x + this.owner.totalOffsetX;
				this._tmpVec.y = this.targetY - volume.y + this.owner.totalOffsetY;
				this._tmpVec.normalize();

				var speed = this.speed * tDelta;
				this.owner.move(this._tmpVec.x * speed, this._tmpVec.y * speed);
			}
		}
	},

	moveToCell: function(cellX, cellY)
	{
		var cellPos = this.owner.parent.cellPos;
		cellPos.cellX = cellX;
		cellPos.cellY = cellY;
		this.owner.parent.getPosEx(cellPos);
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

	//
	needMoving: false,
	target: null,
	targets: null,
	targetCellX: 0,
	targetY: 0,
	speed: 250,
	_tmpVec: new meta.math.Vector2(0, 0)
});
