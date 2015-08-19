"use strict";

meta.class("Entity.TilemapLayer", "Entity.Geometry",
{
	draw: function(ctx) 
	{
		if(!this.parent.loaded) { return; }

		var cameraVolume = meta.camera.volume;

		var startTileX = Math.floor((cameraVolume.minX - this.volume.minX) / this.tileWidth);
		var startTileY = Math.floor((cameraVolume.minY - this.volume.minY) / this.tileHeight);
		var endTileX = Math.ceil((cameraVolume.maxX - this.volume.minX) / this.tileWidth);
		var endTileY = Math.ceil((cameraVolume.maxY - this.volume.minY) / this.tileHeight);

		if(startTileX < 0) {
			startTileX = 0;
		}
		if(startTileY < 0) {
			startTileY = 0;
		}
		if(endTileX > this.tilesX) {
			endTileX = this.tilesX;
		}
		if(endTileY > this.tilesY) {
			endTileY = this.tilesY;
		}

		var minX = this.volume.minX + (startTileX * this.tileWidth);
		var minY = this.volume.minY + (startTileY * this.tileHeight);

		var id = 0, info;
		var posX = minX | 0;
		var posY = minY | 0;

		if(this._dataFlags)
		{
			var flags = 0;

			for(var y = startTileY; y < endTileY; y++)
			{
				id = startTileX + (y * this.tilesX);

				for(var x = startTileX; x < endTileX; x++)
				{
					info = this._dataInfo[id];
					if(info) 
					{
						flags = this._dataFlags[id];
						if(flags) 
						{
							var flipX = 1.0;
							var flipY = 1.0;
							var offsetX = 0;
							var offsetY = 0;

							ctx.save();

							// FLIPPED_DIAGONALLY_FLAG 
							if(flags & 0x20000000) 
							{
								ctx.rotate(Math.PI / 2);

								// FLIPPED_HORIZONTALLY_FLAG & FLIPPED_VERTICALLY_FLAG 
								if(flags & 0x80000000 && flags & 0x40000000) {	
									flipX = -1.0;
									offsetX = this.tileWidth;
									offsetY = this.tileHeight;
								}
								// FLIPPED_VERTICALLY_FLAG 
								else if(flags & 0x80000000) {
									offsetY = this.tileWidth;
								}
								// FLIPPED_VERTICALLY_FLAG 
								else if(flags & 0x40000000) {
									flipX = -1.0;
									flipY = -1.0;
									offsetX = this.tileWidth;
								}
								else {
									flipY = -1;
								}
							}	
							else
							{
								// FLIPPED_HORIZONTALLY_FLAG
								if(flags & 0x80000000) {
									flipX = -1.0;
									offsetX = this.tileWidth;
								}

								// FLIPPED_VERTICALLY_FLAG 
								if(flags & 0x40000000) {
									flipY = -1.0;
									offsetY = this.tileHeight;
								}	
							}
							
							ctx.scale(flipX, flipY);

							ctx.drawImage(info.canvas, 
								info.posX, info.posY, this.tileWidth, this.tileHeight, 
								posX * flipX - offsetX, 
								posY * flipY - offsetY, 
								this.tileWidth, this.tileHeight);

							ctx.restore();
						}
						else
						{
							ctx.drawImage(info.canvas, 
								info.posX, info.posY, this.tileWidth, this.tileHeight, 
								posX, posY, this.tileWidth, this.tileHeight);
						}
					}

					id++;
					posX += this.tileWidth;
				}

				posX = minX | 0;
				posY += this.tileHeight;
			}
		}
		else
		{
			for(var y = startTileY; y < endTileY; y++)
			{
				id = startTileX + (y * this.tilesX);

				for(var x = startTileX; x < endTileX; x++)
				{
					info = this._dataInfo[id++];
					if(info) 
					{
						ctx.drawImage(info.canvas, 
							info.posX, info.posY, this.tileWidth, this.tileHeight, 
							posX, posY, this.tileWidth, this.tileHeight);
					}

					posX += this.tileWidth;
				}

				posX = minX;
				posY += this.tileHeight;
			}
		}
	},

	updateFromData: function()
	{
		this.totalTiles = this.tilesX * this.tilesY;
		this.resize(this.tilesX * this.tileWidth, this.tilesY * this.tileHeight);

		var num = this._data.length;

		if(!this._dataInfo) {
			this._dataInfo = new Array(num);
		}
		else if(this._dataInfo.length !== num) {
			this._dataInfo.length = num;
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

	setTile: function(x, y, gid)
	{
		var id = x + (y * this.tilesX);
		this._data[id] = gid;

		if(this.parent.loaded) {
			this._updateDataInfoCell(id);
			this.renderer.needRender = true;
		}
	},

	gridFromWorldPos: function(worldX, worldY) 
	{
		var gridX = Math.floor((worldX - this.volume.minX) / this.tileWidth);
		var gridY = Math.floor((worldY - this.volume.minY) / this.tileHeight);
		var id = gridX + (gridY * this.tilesX);
		
		if(id < 0) { 
			return null;
		}
		if(id >= this.totalTiles) {
			return null;
		}

		return [ gridX, gridY ];
	},

	createBackup: function()
	{
		if(!this.data) {
			console.warn("(Entity.Tilemap.saveBackup) No data available for backup");
			return;
		}

		if(!this.backup) {
			this.backup = new Uint32Array(this.totalTiles);
		}
		else if(this.backup.length !== this.totalTiles) {
			this.backup.length = this.totalTiles;
		}

		for(var n = 0; n < this.totalTiles; n++) {
			this.backup[n] = this.data[n];
		}
	},

	useBackup: function()
	{
		if(!this.backup) { 
			console.warn("(Entity.Tilemap.saveBackup) No backup available");
			return; 
		}

		if(this.backup.length !== this.totalTiles) {
			console.warn("(Entity.Tilemap.saveBackup) Incompatible backup");
			return; 
		}

		for(var n = 0; n < this.totalTiles; n++) {
			this.data[n] = this.backup[n];
		}

		this.updateFromData();
	},

	set data(data) 
	{
		this._data = data;

		if(this.parent.loaded) {
			this.updateFromData();
		}
	},

	get data() {
		return this._data;
	},

	//
	tilesX: 0,
	tilesY: 0,
	totalTiles: 0,
	tileWidth: 0,
	tileHeight: 0,
	_data: null,
	_dataInfo: null,
	_dataFlags: null,

	_tilesets: null,
	_numTilesets: 0
});

meta.class("Entity.Tilemap", "Entity.Geometry",
{
	initArg: function(path) 
	{
		if(!path) { return; }
		this.load(path);
	},

	load: function(path)
	{
		if(!path) { 
			console.warn("(Entity.Tilemap.load) Invalid path specified");
			return; 
		}

		var index = path.lastIndexOf(".") + 1;
		var pathIndex = path.lastIndexOf("/");
		var ext = path.substr(index);

		this.path = path;
		this.folderPath = path.substr(0, pathIndex + 1);
		this.loaded = false;
		this.tilesets = [];

		var self = this;
		var parseFunc = this["_parse_" + ext];
		if(!parseFunc) {
			console.warn("(Entity.Tilemap.load) Unsupported file format: " + ext);
			return; 
		}
		
		meta.resources.loadFile(path, function(data) { 
			parseFunc.call(self, data);
		});
	},

	create: function(tilesX, tilesY, tileWidth, tileHeight)
	{
		this.tilesX = tilesX;
		this.tilesY = tilesY;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;

		this.resize(tilesX * tileWidth, tilesY * tileHeight);

		this.tilesets = [];
		this.detachAll();
	},

	createTileset: function(gid, texture, tileWidth, tileHeight)
	{
		if(gid < 1) {
			console.warn("(Entity.Tilemap.createTileset) gid argument should be 1 or larger number");
			return;
		}

		var tileset = new meta.Tileset(this, gid, texture, tileWidth || 0, tileHeight || 0);
		this.tilesets.push(tileset);
	},

	createLayer: function(tilesX, tilesY, data)
	{
		var layer = new Entity.TilemapLayer();
		layer.tilesX = tilesX;
		layer.tilesY = tilesY;
		layer.tileWidth = this.tileWidth;
		layer.tileHeight = this.tileHeight;
		layer.resize(tilesX * this.tileWidth, tilesY * this.tileHeight);
		this.attach(layer);

		layer.data = data;

		return layer;
	},

	finishLoading: function()
	{
		var num = this.children.length;
		for(var n = 0; n < num; n++) {
			this.children[n].updateFromData();
		}

		this.loaded = true;
	},

	_parse_json: function(data)
	{
		var json = JSON.parse(data);

		this.create(json.width, json.height, json.tilewidth, json.tileheight);

		var tileset;
		var tilesets = json.tilesets;
		var num = tilesets.length;
		for(var n = 0; n < num; n++) 
		{
			tileset = tilesets[n];
			this.createTileset(tileset.firstgid, this.folderPath + tileset.image, tileset.tileWidth, tileset.tileHeight);
		}

		var layer;
		var layers = json.layers;
		num = layers.length;
		for(n = 0; n < num; n++)
		{
			layer = layers[n];
			this.createLayer(layer.width, layer.height, layer.data);
		}

		if(this.numToLoad === 0) {
			this.loaded = true;
		}
	},

	_parse_tmx: function(data)
	{
		var parser = new DOMParser();
		var xml = parser.parseFromString(data, "text/xml");
		var node = xml.documentElement;

		this.create(
			parseInt(node.getAttribute("width")),
			parseInt(node.getAttribute("height")),
			parseInt(node.getAttribute("tilewidth")),
			parseInt(node.getAttribute("tilewidth")));

		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];
			if(node.nodeType !== 1) { continue; }

			if(node.nodeName === "tileset") 
			{
				this.createTileset(
					parseInt(node.getAttribute("firstgid")),
					this.folderPath + node.childNodes[1].getAttribute("source"),
					parseInt(node.getAttribute("tilewidth")),
					parseInt(node.getAttribute("tileheight")));
			}
			else if(node.nodeName === "layer") {
				this._parse_tmx_layer(node);
			}
			else if(node.nodeName === "objectgroup") {

			}
		}

		if(this.numToLoad === 0) {
			this.loaded = true;
		}
	},

	_parse_tmx_layer: function(node)
	{
		var tilesX = parseInt(node.getAttribute("width"));
		var tilesY = parseInt(node.getAttribute("height"));

		var dataNode = node.children[0];
		var encoding = dataNode.getAttribute("encoding");

		var n;
		var num = tilesX * tilesY;
		var data = new Uint32Array(num);

		if(encoding)
		{
			var strData = null;

			if(encoding === "csv")
			{
				strData = dataNode.innerHTML.split(",");
				if(strData.length !== num) {
					console.warn("(Entity.Tilemap._parse_tmx) Layer resolution does not match with data size");
					return;
				}
			}
			else {
				console.warn("(Entity.Tilemap._parse_tmx) Unsupported layer encoding used: " + encoding);
				return;
			}

			for(n = 0; n < num; n++) {
				data[n] = parseInt(strData[n]);
			}
		}
		else
		{
			var id = 0;
			var dataNodes = dataNode.childNodes;
			num = dataNodes.length;
			for(n = 0; n < num; n++) 
			{
				node = dataNodes[n];
				if(node.nodeType !== 1) { continue; }

				data[id++] = parseInt(node.getAttribute("gid"));
			}
		}

		this.createLayer(tilesX, tilesY, data);
	},

	LayerFlag: {
		FLIP_HORIZONTALLY: 0x80000000,
		FLIP_VERTICALLY: 0x40000000,
		FLIP_DIAGONALLY: 0x20000000
	},

	//
	tilesets: null,

	path: "",
	folderPath: "",
	numToLoad: 0,

	tilesX: 0,
	tilesY: 0,
	tileWidth: 0,
	tileHeight: 0
});

meta.Tileset = function(parent, gid, texture, tileWidth, tileHeight) 
{
	this.parent = parent;
	this.gid = gid;
	this.tileWidth = tileWidth;
	this.tileHeight = tileHeight;
	this.tilesX = 0;
	this.tilesY = 0;
	this._texture = null;
	this.cells = null;

	this.texture = texture;
};

meta.Tileset.prototype = 
{
	_onTextureEvent: function(data, event)
	{
		if(event === Resource.Event.LOADED) 
		{
			data.unsubscribe(this);
			this.updateTexture();

			this.parent.numToLoad--;
			if(this.parent.numToLoad === 0) {
				this.parent.finishLoading();
			}
		}
	},

	updateTexture: function() 
	{
		if(this.tileWidth === 0) {
			this.tileWidth = this._texture.fullWidth;
			this.tilesX = 1;
		}
		else {
			this.tilesX = (this._texture.fullWidth / this.tileWidth) | 0;
		}
		
		if(this.tileHeight === 0) {
			this.tileHeight = this._texture.fullHeight;
			this.tilesY = 1;
		}
		else {
			this.tilesY = (this._texture.fullHeight / this.tileHeight) | 0;
		}

		this.cells = new Uint32Array(this.tilesX * this.tilesY);
	},

	getCell: function(gid)
	{
		gid -= this.gid;

		var cell = this.cells[gid];
		if(cell) {
			return cell;
		}

		var posX = (gid % this.tilesX) * this.tileWidth;
		var posY = ((gid / this.tilesX) | 0) * this.tileHeight;
		cell = new this.Cell(this._texture.canvas, posX, posY);
		this.cells[gid] = cell;

		return cell;
	},

	set texture(src) 
	{
		if(src instanceof Resource.Texture) {
			this._texture = src;
		}
		else 
		{
			var wildcardIndex = src.lastIndexOf(".");
			var slashIndex = src.lastIndexOf("/");
			if(slashIndex === -1) {
				slashIndex = 0;
			}
			var imgName = src.substr(slashIndex + 1, wildcardIndex - slashIndex - 1);

			var texture = meta.resources.getTexture(imgName);
			if(!texture) {
				texture = new Resource.Texture(src);
			}

			this._texture = texture;
		}

		if(!this._texture.loaded) {
			this.parent.numToLoad++;
			this._texture.subscribe(this, this._onTextureEvent);
		}
		else {
			this.updateTexture();
		}
	},

	get texture() {
		return this._texture;
	},

	Cell: function(canvas, posX, posY) {
		this.canvas = canvas;
		this.posX = posX;
		this.posY = posY;
	}
};
