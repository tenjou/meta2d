"use strict";

Entity.Gem = Entity.Geometry.extend
({
	init: function() {
		this.random();
	},

	random: function() {
		var cfg = MatchGame.Cfg;
		this.gemID = meta.random.number(0, cfg.gems.length - 1);
		this.gem = cfg.gems[this.gemID];
		this.texture = this.gem;
	},

	reset: function() {
		this.alpha = 1;	
		this.scale = 1;
		this.isTagged = false;
		this.cantMove = false;
		this.random();			
	},

	updateGrid: function() {
		this.field.buffer[this.gridX][this.gridY] = this;
	},


	onDrag: function(data)
	{
		if(this.cantMove) { return; }
		if(this.field.blockDrag) { return; }

		var cfg = MatchGame.Cfg;

		var dragGridX = ((data.x - this.field.left) / cfg.cellWidth) | 0;
		var dragGridY = ((data.y - this.field.top) / cfg.cellHeight) | 0;

		if(dragGridX === this.gridX && dragGridY === this.gridY) { return; }
		if(dragGridX < 0 || dragGridX >= cfg.numCellsX) { return; }
		if(dragGridY < 0 || dragGridY >= cfg.numCellsY) { return; }		

		var diffGridX = dragGridX - this.gridX;
		var diffGridY = dragGridY - this.gridY;

		diffGridX = Math.min(Math.max(diffGridX, -1), 1);
		diffGridY = Math.min(Math.max(diffGridY, -1), 1);

		if(Math.abs(diffGridX) >= Math.abs(diffGridY)) {
			diffGridY = 0;
		}

		this.field.shuffle(this, diffGridX, diffGridY);
	},


	explode: function(group) 
	{
		this.tween
			.to({ alpha: 0 }, 100)
			.to({ alpha: 1 }, 100)
			.to({ alpha: 0 }, 100)
			.to({ alpha: 1 }, 100)				
			.to({ alpha: 0, scale: 1.4 }, 340)
			.easing("circOut")
			.group(group)
			.play();		
	},


	setGrid: function(x, y) {
		this.gridX = x;
		this.gridY = y;
		this.field.buffer[x][y] = this;
	},


	onShuffleComplete: function() {
		this.z = 0;
		this.cantMove = false;
	},


	//
	field: null,
	gridX: 0, gridY: 0,

	gem: "",
	gemID: 0,
	
	isTagged: false,
	cantMove: false
});