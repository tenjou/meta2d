"use strict";

Entity.Field = Entity.Geometry.extend
({
	init: function()
	{
		this.cfg = MatchGame.Cfg;

		this.tags = new Array(this.cfg.numCellsX * this.cfg.numCellsY);
		this.combos = new Array(this.cfg.numCellsX * this.cfg.numCellsY);

		this.buffer = new Array(this.cfg.numCellsX);
		for(x = 0; x < this.cfg.numCellsX; x++) {
			this.buffer[x] = new Array(this.cfg.numCellsY);
		}

		// Generate field.
		var fieldWidth = this.cfg.cellWidth * this.cfg.numCellsX;
		var fieldHeight = this.cfg.cellHeight * this.cfg.numCellsY;

		var texture = new Resource.Texture();
		texture.tile(fieldWidth, fieldHeight, "bg-tile");
		this.texture = texture;	

		// Generate plate that is used to move all gems at once.
		this.plate = new Entity.Geometry();
		this.plate.positionTopLeft(0, -fieldHeight);
		this.plate.tween
			.to({ y: 0 }, 700)
			.easing("quadOut")
			.play();
		this.attach(this.plate);

		// Generate gems.
		var gem;
		for(var y = 0; y < this.cfg.numCellsY; y++) 
		{
			for(var x = 0; x < this.cfg.numCellsX; x++) {
				gem = new Entity.Gem();
				gem.field = this;
				gem.pivotTopLeft(x * this.cfg.cellWidth, y * this.cfg.cellHeight);
				gem.setGrid(x, y);
				gem.clip(this.volume);
				this.plate.attach(gem);
			}
		}	

		this.replaceCombos();
		//this.checkAllCombos();
	},

	shuffle: function(entity, diffGridX, diffGridY)
	{
		this.blockDrag = true;
		entity.cantMove = true;
		entity.z = 1;

		var targetGridX = entity.gridX + diffGridX;
		var targetGridY = entity.gridY + diffGridY;

		//
		var targetGem = this.buffer[targetGridX][targetGridY];
		targetGem.cantMove = true;	

		targetGem.gridX = entity.gridX;
		targetGem.gridY = entity.gridY;
		entity.gridX = targetGridX;
		entity.gridY = targetGridY;	

		this.buffer[targetGridX][targetGridY] = entity;
		this.buffer[targetGem.gridX][targetGem.gridY] = targetGem;					

		// Calculate shuffle position.
		var targetX = entity.x;
		var targetY = entity.y;
		var entityX = targetX + (diffGridX * this.cfg.cellWidth);
		var entityY = targetY + (diffGridY * this.cfg.cellHeight);

		//
		var self = this;
		var group = new meta.Tween.Group(function() {
			self.explodeCombos();
		});	

		//
		this.isCombo = false;
		this.checkCombo(entity);
		this.checkCombo(targetGem);

		if(!this.isCombo) 
		{		
			entity.gridX = targetGem.gridX;
			entity.gridY = targetGem.gridY;	
			targetGem.gridX = targetGridX;
			targetGem.gridY = targetGridY;	

			this.buffer[entity.gridX][entity.gridY] = entity;
			this.buffer[targetGem.gridX][targetGem.gridY] = targetGem;	

			var self = this;
			var group = new meta.Tween.Group(function() {
				self.explodeCombos();
			});	

			// TargetGem.
			targetGem.tween
				.to({ x: targetX, y: targetY }, 190)
				.wait(100)
				.to({ x: targetGem.x, y: targetGem.y }, 190, targetGem.onShuffleComplete)
				.easing("quadInOut")
				.group(group)
				.play();						

			// Entity.
			entity.tween
				.to({ x: entityX, y: entityY }, 190)
				.wait(100)
				.to({ x: entity.x, y: entity.y }, 190, entity.onShuffleComplete)			
				.easing("quadInOut")
				.group(group)
				.play();													
		}	
		// Switch gems if one of them comboed.
		else 
		{
			// TargetGem.
			targetGem.tween
				.to({ x: targetX, y: targetY }, 190, targetGem.onShuffleComplete)
				.easing("quadInOut")
				.group(group)
				.play();						
			
			// Entity.
			entity.tween
				.to({ x: entityX, y: entityY }, 190, entity.onShuffleComplete)			
				.easing("quadInOut")
				.group(group)
				.play();			
		}	
	},

	checkCombo: function(gem)
	{
		var gemID = gem.gemID;
		var gemGridX = gem.gridX;
		var gemGridY = gem.gridY;
		var tag, n;

		// Check horizontal.
		this.numTags = 0;
		this.numCombos = 0;

		this._tagGem(gem);
		
		// LEFT.
		var nextGem;
		var nextGrid = gemGridX;
		for(;;)
		{
			nextGrid--;
			if(nextGrid < 0) { break; }

			nextGem = this.buffer[nextGrid][gemGridY];
			if(nextGem.gemID !== gemID) {
				break;
			}

			this._tagGem(nextGem);
		}

		// RIGHT
		nextGrid = gemGridX;
		for(;;)
		{
			nextGrid++;
			if(nextGrid >= this.cfg.numCellsX) { break; }

			nextGem = this.buffer[nextGrid][gemGridY];
			if(nextGem.gemID !== gemID) {
				break;
			}

			this._tagGem(nextGem);
		}

		if(this.numCombos >= 3) 
		{
			for(n = 0; n < this.numTags; n++) {
				tag = this.tags[n];
				tag.isTagged = true;
				this.combos[this.comboLenght++] = tag;
			}

			this.isCombo = true;
		}

		// Check verticaly.
		this.numTags = 0;
		this.numCombos = 0;

		this._tagGem(gem);
		
		// UP.
		nextGrid = gemGridY;
		for(;;)
		{
			nextGrid--;
			if(nextGrid < 0) { break; }

			nextGem = this.buffer[gemGridX][nextGrid];
			if(nextGem.gemID !== gemID) {
				break;
			}

			this._tagGem(nextGem);
		}

		// BOTTOM
		nextGrid = gemGridY;
		for(;;)
		{
			nextGrid++;
			if(nextGrid >= this.cfg.numCellsY) { break; }

			nextGem = this.buffer[gemGridX][nextGrid];
			if(nextGem.gemID !== gemID) {
				break;
			}

			this._tagGem(nextGem);
		}

		if(this.numCombos >= 3) 
		{
			for(n = 0; n < this.numTags; n++) {
				tag = this.tags[n];
				tag.isTagged = true;
				this.combos[this.comboLenght++] = tag;
			}

			this.isCombo = true;
		}

		return this.isCombo;
	},

	checkAllCombos: function()
	{
		this.blockDrag = true;

		for(var y = 0; y < this.cfg.numCellsY; y++) 
		{
			for(var x = 0; x < this.cfg.numCellsX; x++) {
				this.checkCombo(this.buffer[x][y]);
			}
		}

		this.explodeCombos();
	},	

	_tagGem: function(gem) 
	{
		if(!gem.isTagged) {
			this.tags[this.numTags++] = gem;
		}

		this.numCombos++;
	},


	replaceCombos: function()
	{
		for(var y = 0; y < this.cfg.numCellsY; y++) 
		{
			for(var x = 0; x < this.cfg.numCellsX; x++) {
				this.replaceCombo(this.buffer[x][y]);
			}
		}
	},

	replaceCombo: function(gem)
	{
		var gridX = gem.gridX;
		var gridY = gem.gridY;

		var tmpGem1, tmpGem2;
		for(;;)
		{
			// Left.
			if(gridX - 2 >= 0) 
			{
				tmpGem1 = this.buffer[gridX - 1][gridY];
				tmpGem2 = this.buffer[gridX - 2][gridY];
				if(tmpGem1.gemID === gem.gemID && tmpGem2.gemID === gem.gemID) {
					gem.random();
					continue;
				}
			}

			// Right.
			if(gridX + 2 < this.cfg.numCellsX) 
			{
				tmpGem1 = this.buffer[gridX + 1][gridY];
				tmpGem2 = this.buffer[gridX + 2][gridY];
				if(tmpGem1.gemID === gem.gemID && tmpGem2.gemID === gem.gemID) {
					gem.random();
					continue;
				}
			}

			// Left.
			if(gridY - 2 >= 0) 
			{
				tmpGem1 = this.buffer[gridX][gridY - 1];
				tmpGem2 = this.buffer[gridX][gridY - 2];
				if(tmpGem1.gemID === gem.gemID && tmpGem2.gemID === gem.gemID) {
					gem.random();
					continue;
				}
			}

			// Right.
			if(gridY + 2 < this.cfg.numCellsY) 
			{
				tmpGem1 = this.buffer[gridX][gridY + 1];
				tmpGem2 = this.buffer[gridX][gridY + 2];
				if(tmpGem1.gemID === gem.gemID && tmpGem2.gemID === gem.gemID) {
					gem.random();
					continue;
				}
			}	

			break;		
		}
	},


	explodeCombos: function()
	{
		if(this.comboLenght === 0) {
			this.blockDrag = false;
			return;
		}

		var self = this;
		var group = new meta.Tween.Group(function() {
			self.dropLines();
		});

		for(var n = 0; n < this.comboLenght; n++) {
			var gem = this.combos[n];
			this.combos[n].explode(group);
		}

		this.comboLenght = 0;
	},

	dropLines: function()
	{

		var self = this;
		var group = new meta.Tween.Group(function() {
			self.checkAllCombos();
		});

		var gem;
		var numToDrop;
		for(var x = 0; x < this.cfg.numCellsX; x++) 
		{
			numToDrop = 0;

			for(var y = this.cfg.numCellsY - 1; y >= 0; y--) 
			{
				gem = this.buffer[x][y];
				if(gem.isTagged) 
				{	
					gem.gridY = numToDrop;
					gem.reset();
					this.tags[numToDrop] = gem;
					numToDrop++;
				}
				else if(numToDrop)
				{
					gem.gridY += numToDrop;
					gem.tween
						.to({ y: gem.y + (this.cfg.cellHeight * numToDrop) }, 400, gem.updateGrid)
						.easing("quadOut")
						.group(group)
						.play();
				}
			}

			if(numToDrop > 0)
			{
				var offsetY = 0;
				var columnOffsetY = numToDrop * this.cfg.cellHeight;
				for(var i = 0; i < numToDrop; i++) 
				{
					gem = this.tags[i];
					gem.y = offsetY - columnOffsetY;

					gem.tween
						.to({ y: offsetY }, 400, gem.updateGrid)
						.easing("quadOut")
						.group(group)
						.play();	
						

					offsetY += this.cfg.cellHeight;				
				}
			}
		}
	},


	//
	cfg: null,
	buffer: null,
	plate: null,

	tags: null,
	numTags: 0, numCombos: 0,

	combos: null,
	comboLenght: 0,	
	isCombo: false,

	blockDrag: false,
});