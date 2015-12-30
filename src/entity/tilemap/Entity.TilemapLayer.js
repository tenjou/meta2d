"use strict";

meta.class("Entity.TilemapLayer", "Entity.Geometry",
{
	updateFromData: function()
	{		
		this.resize(
			this.tilesX * this.tileWidth + this.tileOffsetX, 
			this.tilesY * this.tileHeight + this.tileOffsetY);

		var num = this._data.length;

		if(!this._dataInfo) {
			this._dataInfo = new Array(num);
		}
		else if(this._dataInfo.length !== num) {
			this._dataInfo.length = num;
		}

		// if has entities in unhandled cell:
		if(this._unhandledCell)
		{
			this._cells = new Array(this.tilesX * this.tilesY);
			this._outsideCell = [];
			
			var numUnhandled = this._unhandledCell.length;
			for(var n = 0; n < numUnhandled; n++) {
				this._attachToCell(this._unhandledCell[n]);
			}

			this._unhandledCell = null;
		}

		this._tilesets = this.parent.tilesets;
		this._numTilesets = this._tilesets.length;

		for(var n = 0; n < num; n++) {
			this._updateDataInfoCell(n);
		}

		this.renderer.needRender = true;
	},

	_updateDataInfoCell: function(id) 
	{
		var gid = this._data[id];

		if(!gid) {
			this._dataInfo[id] = null;
		}
		else 
		{
			if(gid & 0x20000000 || gid & 0x40000000 || gid & 0x80000000) 
			{
				if(!this._dataFlags) {
					this._dataFlags = new Uint32Array(this._data.length);
				}

				var flag = 0;
				flag |= (gid & 0x20000000);
				flag |= (gid & 0x40000000);
				flag |= (gid & 0x80000000);
				this._dataFlags[id] = flag;

				gid &= 536870911;
			}

			// Find the correct tileset/texture:
			var tileset = this._tilesets[0];
			for(var i = 1; i < this._numTilesets; i++) 
			{
				if(gid < this._tilesets[i].gid) {
					break;
				}

				tileset = this._tilesets[i];
			}

			this._dataInfo[id] = tileset.getCell(gid);
		}
	},

	setGid: function(x, y, gid)
	{
		var id = x + (y * this.tilesX);
		this._data[id] = gid;

		if(this.parent.loaded) {
			this._updateDataInfoCell(id);
			this.renderer.needRender = true;
		}
	},

	getGid: function(x, y) 
	{
		var id = x + (y * this.tilesX);

		if(id < 0) {
			return 0;
		}
		if(id >= this.numTiles) {
			return 0;
		}

		return this.data[id];
	},

	getInfo: function(x, y)
	{
		var id = x + (y * this.tilesX);

		if(id < 0) {
			return null;
		}
		if(id >= this.numTiles) {
			return null;
		}

		return this._dataInfo[id];
	},

	getFlags: function(x, y)
	{
		var id = x + (y * this.tilesX);

		if(id < 0) {
			return null;
		}
		if(id >= this.numTiles) {
			return null;
		}

		return this._dataFlags[id];
	},

	saveData: function()
	{
		if(!this.data) {
			console.warn("(Entity.Tilemap.saveData) No data available for saving");
			return;
		}

		if(!this.savedData) {
			this.savedData = new Uint32Array(this.numTiles);
		}
		else if(this.savedData.length !== this.numTiles) {
			this.savedData.length = this.numTiles;
		}

		for(var n = 0; n < this.numTiles; n++) {
			this.savedData[n] = this.data[n];
		}
	},

	restoreData: function()
	{
		if(!this.savedData) { 
			console.warn("(Entity.Tilemap.restoreData) No saved data available");
			return; 
		}

		if(this.savedData.length !== this.numTiles) {
			console.warn("(Entity.Tilemap.restoreData): Incompatible data saved");
			this.savedData = null;
			return; 
		}

		for(var n = 0; n < this.numTiles; n++) {
			this.data[n] = this.savedData[n];
		}

		this.updateFromData();
	},

	convertToEntities: function(zOffsetY)
	{
		this.layerFlags |= this.LayerFlag.CONVERTED_TO_ENTITIES;

		if(this.parent.flags & this.Flag.LOADED) {
			this._convertToEntities(zOffsetY);
		}

		this.enabled = false;
	},

	_convertToEntities: function(zOffsetY)
	{
		zOffsetY = zOffsetY || 1;

		var texture, entity;
		var id = 0;
		for(var y = 0; y < this.tilesY; y++)
		{
			for(var x = 0; x < this.tilesX; x++)
			{
				texture = this._dataInfo[id++];
				if(!texture) { continue; }

				entity = new Entity.Geometry(texture);
				entity.position(this.getPosX(x, y), this.getPosY(x, y));
				entity.pivot(0, 1);
				entity.z = zOffsetY * y;
				meta.view.attach(entity);
			}
		}
	},

	attach: function(entity)
	{
		if(!entity) { 
			console.warn("(Entity.TilemapLayer) Invalid entity passed");
			return;
		}

		if(!(entity instanceof Entity.TileGeometry)) {
			console.warn("(Entity.TilemapLayer) Entity must have extended Entity.TileGeometry");
			return;
		}

		if(this.parent.loaded) 
		{
			if(!this._cells) {
				this._cells = new Array(this.tilesX * this.tilesY);
			}

			this._attachToCell(entity);
		}
		else 
		{
			if(!this._unhandledCell) {
				this._unhandledCell = [ entity ];
			}
			else {
				this._unhandledCell.push(entity);
			}
		}
	},

	_attachToCell: function(entity)
	{
		if(entity._x !== 0 || entity._y !== 0) {
			this.calcEntityCell(entity);	
		}
		else {
			this.calcEntityPos(entity);
		}

		var index = entity.cellX + (entity.cellY * this.tilesX);
		if(index < 0 && index > this.numTiles) {
			this._outsideCell.push(entity);
		}
		else 
		{
			var buffer = this._cells[index];
			if(!buffer) {
				buffer = [ entity ];
				this._cells[index] = buffer;
			}
			else {
				buffer.push(entity);
			}
		}
	},

	detach: function(entity)
	{

	},

	tileOffset: function(x, y)
	{
		this.tileOffsetX = x;
		this.tileOffsetY = y;
		this.offset(x, -y);
	},

	set data(data) 
	{
		this._data = data;
		this.numTiles = this.tilesX * this.tilesY;		

		if(this.parent.flags & this.Flag.LOADED) {
			this.updateFromData();
		}
	},

	get data() {
		return this._data;
	},

	LayerFlag: {
		CONVERTED_TO_ENTITIES: 1 << 1
	},

	//
	name: "Undefined",
	tilesX: 0, tilesY: 0,
	numTiles: 0,
	tileWidth: 0, tileHeight: 0,
	tileHalfWidth: 0, tileHalfHeight: 0,
	tileOffsetX: 0, tileOffsetY: 0,

	_data: null,
	_dataInfo: null,
	_dataFlags: null,
	_cells: null,
	_outsideCell: null,
	_unhandledCell: null,

	_tilesets: null,
	_numTilesets: 0,

	layerFlags: 0
});

Entity.TilemapLayer.PosInfo = function(cellX, cellY) {
	this.cellX = cellX;
	this.cellY = cellY;
	this.x = 0;
	this.y = 0;
};