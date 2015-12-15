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
		if(id >= this.totalTiles) {
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
		if(id >= this.totalTiles) {
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
		if(id >= this.totalTiles) {
			return null;
		}

		return this._dataFlags[id];
	},

	saveData: function()
	{
		if(!this.data) {
			console.warn("(Entity.Tilemap.saveData): No data available for saving");
			return;
		}

		if(!this.savedData) {
			this.savedData = new Uint32Array(this.totalTiles);
		}
		else if(this.savedData.length !== this.totalTiles) {
			this.savedData.length = this.totalTiles;
		}

		for(var n = 0; n < this.totalTiles; n++) {
			this.savedData[n] = this.data[n];
		}
	},

	restoreData: function()
	{
		if(!this.savedData) { 
			console.warn("(Entity.Tilemap.restoreData): No saved data available");
			return; 
		}

		if(this.savedData.length !== this.totalTiles) {
			console.warn("(Entity.Tilemap.restoreData): Incompatible data saved");
			this.savedData = null;
			return; 
		}

		for(var n = 0; n < this.totalTiles; n++) {
			this.data[n] = this.savedData[n];
		}

		this.updateFromData();
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
		this.totalTiles = this.tilesX * this.tilesY;		

		if(this.parent.flags & this.Flag.LOADED) {
			this.updateFromData();
		}
	},

	get data() {
		return this._data;
	},

	//
	name: "Undefined",
	tilesX: 0, tilesY: 0,
	totalTiles: 0,
	tileWidth: 0, tileHeight: 0,
	tileHalfWidth: 0, tileHalfHeight: 0,
	tileOffsetX: 0, tileOffsetY: 0,

	_data: null,
	_dataInfo: null,
	_dataFlags: null,

	_tilesets: null,
	_numTilesets: 0
});

meta.class("Entity.TilemapOrthoLayer", "Entity.TilemapLayer",
{
	gridFromPos: function(worldX, worldY) 
	{
		var gridX = Math.floor((worldX - this.volume.minX) / this.tileWidth);
		var gridY = Math.floor((worldY - this.volume.minY) / this.tileHeight);

		return [ gridX, gridY ];
	},

	draw: function(ctx) 
	{
		if((this.parent.flags & this.Flag.LOADED) === 0) { return; }

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

		var minX = Math.floor(this.volume.minX + (startTileX * this.tileWidth));
		var minY = Math.floor(this.volume.minY + (startTileY * this.tileHeight));

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
								info.posX, info.posY, info.width, info.height, 
								posX, posY, info.width, info.height);
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
							info.posX, info.posY, info.width, info.height, 
							posX, posY, info.width, info.height);
					}

					posX += this.tileWidth;
				}

				posX = minX;
				posY += this.tileHeight;
			}
		}
	},
});

meta.class("Entity.TilemapIsoLayer", "Entity.TilemapLayer",
{
	gridFromPos: function(worldX, worldY) 
	{
		var adjScreenX = worldX - (this.tilesX * this.tileHalfWidth) - (this.volume.x + this.offsetX);
		var adjScreenY = worldY - (this.volume.y - this.offsetY);

		var gridX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		var gridY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);

		return [ gridX, gridY ];
	},

	draw: function(ctx) 
	{
		if((this.parent.flags & this.Flag.LOADED) === 0) { return; }

		var cameraVolume = meta.camera.volume;

		var startTileX = 0;
		var endTileX = this.tilesX;
		var startTileY = 0;
		var endTileY = this.tilesY;

		// var minX = Math.floor(this.volume.minX + (startTileX * this.tileWidth));
		// var minY = Math.floor(this.volume.minY + (startTileY * this.tileHeight));
		var minX = 0;
		var minY = this.offsetY;

		var id = 0, info;
		var posX = minX | 0;
		var posY = minY | 0;

		var halfWidth = this.tileWidth * 0.5;
		var halfHeight = this.tileHeight * 0.5;

		startTileX = 0;
		startTileY = 0;
		endTileX = this.tilesX;
		endTileY = this.tilesY;

		//this.tilesY = 2;

		// var centerX = this.tilesX * halfWidth;
		// var centerY = this.tilesY * halfHeight;
		// var startPosX = cameraVolume.minX - centerX;
		// var startPosY = cameraVolume.minY - centerY;
		// var endPosX = cameraVolume.maxX - centerX + halfWidth;
		// var endPosY = cameraVolume.maxY - centerY + halfHeight;
		
		// var minTileX = Math.floor(startPosX / halfWidth);
		// var minTileY = Math.floor(startPosY / halfHeight);
		// var maxTileX = Math.ceil(endPosX / halfWidth);
		// var maxTileY = Math.ceil(endPosY / halfHeight);
		// console.log(minTileX, minTileY, maxTileX, maxTileY);

		// if(minTileX < 0) {

		// }

		var offsetX = -1;
		var offsetY = 1;

		offsetX = 0;
		offsetY = 0;

		if(this._dataFlags)
		{		
			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = -(y * halfWidth) + ((this.tilesX - 1) * halfWidth) + minX;
				posY = (y * halfHeight) - halfHeight + minY;		
				// posX = -(y * halfWidth);
				// posY = y * halfHeight;

				for(var x = startTileX; x < endTileX; x++)
				{
					info = this._dataInfo[id++];
					if(info) 
					{
						ctx.drawImage(info.canvas, 
							info.posX, info.posY, info.width, info.height, 
							posX, posY, info.width, info.height);
					}

					posX += halfWidth;
					posY += halfHeight;
				}
			}	
		}
		else
		{
			//this.tilesY = 1;
			//console.log(this._dataInfo[2]);

			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = (this.tilesX * halfWidth) - (y * halfWidth) - halfWidth;
				posY = (y * halfHeight) + this.tileOffsetY;

				// //posX = -(y * halfWidth);
				// //posY = y * halfHeight;		

				// posX = 0;
				// posY = 0;		

				for(var x = startTileX; x < this.tilesX; x++)
				{
					info = this._dataInfo[id++];
					if(info) 
					{
						ctx.drawImage(info.canvas, 
							info.posX, info.posY, info.width, info.height, 
							posX, posY - info.height + this.tileHeight, info.width, info.height);
					}

					posX += halfWidth + offsetX;
					posY += halfHeight + offsetY;
				}
			}			
		}

		//console.log(numDraw);
	}
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
			console.warn("(Entity.Tilemap.load): Invalid path specified");
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
			console.warn("(Entity.Tilemap.load): Unsupported file format: " + ext);
			return; 
		}
		
		meta.resources.loadFile(path, function(data) { 
			parseFunc.call(self, data);
		});
	},

	create: function(tilesX, tilesY, tileWidth, tileHeight, type)
	{
		this.tilesX = tilesX;
		this.tilesY = tilesY;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.type = type ? type : "orthogonal";

		this.resize(tilesX * tileWidth, tilesY * tileHeight);

		this.tilesets = [];
		this.detachAll();
	},

	createTileset: function(gid, texture, tileWidth, tileHeight, margin, spacing)
	{
		if(gid < 1) {
			console.warn("(Entity.Tilemap.createTileset): gid argument should be 1 or larger number");
			return;
		}

		var tileset = new meta.Tileset(this, gid, texture, tileWidth || 0, tileHeight || 0, margin, spacing);
		this.tilesets.push(tileset);
	},

	createLayer: function(tilesX, tilesY, data, name)
	{
		var layer;

		switch(this.type)
		{
			case this.Type.ORTHOGONAL:
				layer = new Entity.TilemapOrthoLayer();
				break;

			case this.Type.ISOMETRIC:
				layer = new Entity.TilemapIsoLayer();
				break;
		}

		layer.tilesX = tilesX;
		layer.tilesY = tilesY;
		layer.tileWidth = this.tileWidth;
		layer.tileHeight = this.tileHeight;
		layer.tileHalfWidth = this.tileWidth * 0.5;
		layer.tileHalfHeight = this.tileHeight * 0.5;
		this.attach(layer);

		layer.data = data;

		if(name) {
			layer.name = name;
		}

		return layer;
	},

	finishLoading: function()
	{
		var tileOffsetY = 0;

		var tileset, tilesetOffsetY;
		var num = this.tilesets.length;
		for(var n = 0; n < num; n++)
		{
			tileset = this.tilesets[n];
			tilesetOffsetY = tileset.tileHeight - this.tileHeight;
			if(tilesetOffsetY > tileOffsetY) {
				tileOffsetY = tilesetOffsetY;
			}
		}

		if(this.children)
		{
			num = this.children.length;
			for(n = 0; n < num; n++) 
			{
				var child = this.children[n];
				if(child instanceof Entity.TilemapLayer)
				{
					child.tileOffset(0, tileOffsetY);
					child.updateFromData();
				}
			}	
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

		var layer, layerInfo;
		var layers = json.layers;
		num = layers.length;
		for(n = 0; n < num; n++)
		{
			layerInfo = layers[n];
			layer = this.createLayer(layerInfo.width, layerInfo.height, layerInfo.data, layerInfo.name);
			if(layerInfo.visible) {
				layer.visible = layerInfo.visible;
			}
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
			parseInt(node.getAttribute("tileheight")),
			node.getAttribute("orientation"));

		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];
			if(node.nodeType !== 1) { continue; }

			if(node.nodeName === "tileset") {
				this._parse_tmx_tileset(node);
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

	_parse_tmx_tileset: function(node)
	{
		var imgPath = "";

		var childNode;
		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var n = 0; n < numNodes; n++)
		{
			childNode = childNodes[n];
			if(childNode.nodeType !== 1) { continue; }

			if(childNode.nodeName === "image") {
				imgPath = this.folderPath + childNode.getAttribute("source");
			}
		}

		var spacingStr = node.getAttribute("spacing");
		var spacing = spacingStr ? parseInt(spacingStr) : 0;

		var marginStr = node.getAttribute("margin");
		var margin = marginStr ? parseInt(marginStr) : 0;		

		this.createTileset(
			parseInt(node.getAttribute("firstgid")),
			imgPath,
			parseInt(node.getAttribute("tilewidth")),
			parseInt(node.getAttribute("tileheight")),
			margin, spacing);
	},

	_parse_tmx_layer: function(node)
	{
		var name = node.getAttribute("name");
		var tilesX = parseInt(node.getAttribute("width"));
		var tilesY = parseInt(node.getAttribute("height"));

		var visible = true;
		var visibleStr = node.getAttribute("visible");
		if(visibleStr) {
			visible = parseInt(visible);
		}

		var dataNode = node.firstElementChild;
		var encoding = dataNode.getAttribute("encoding");
		var data;

		var num = this.tilesX * tilesY;

		if(encoding)
		{
			var strData = null;

			if(encoding === "csv")
			{
				strData = dataNode.textContent.split(",");
				if(strData.length !== num) {
					console.warn("(Entity.Tilemap._parse_tmx): Layer resolution does not match with data size");
					return;
				}

				data = new Uint32Array(num);
				var num = tilesX * tilesY;
				for(var n = 0; n < num; n++) {
					data[n] = parseInt(strData[n]);
				}				
			}
			else if(encoding === "base64")
			{
				var compression = dataNode.getAttribute("compression");
				if(compression) {
					console.warn("(Entity.Tilemap._parse_tmx): Unsupported compression - " + compression);
					return;
				}

				data = meta.decodeBinaryBase64(dataNode.textContent);
			}
			else {
				console.warn("(Entity.Tilemap._parse_tmx): Unsupported layer encoding used: " + encoding);
				return;
			}
		}
		else
		{
			var id = 0;
			var dataNodes = dataNode.childNodes;

			num = dataNodes.length;
			data = new Uint32Array(num);

			for(n = 0; n < num; n++) 
			{
				node = dataNodes[n];
				if(node.nodeType !== 1) { continue; }

				data[id++] = parseInt(node.getAttribute("gid"));
			}
		}

		var layer = this.createLayer(tilesX, tilesY, data, name);
		layer.hidden = !visible;
	},

	getLayer: function(name)
	{
		if(!name) {
			return null;
		}
		if(!this.children) {
			return null;
		}

		var num = this.children.length;
		for(var n = 0; n < num; n++) {
			if(this.children[n].name === name) {
				return this.children[n];
			}
		}

		return null;
	},

	Type: {
		UNKNOWN: "",
		ORTHOGONAL: "orthogonal",
		ISOMETRIC: "isometric",
		HEXAGONAL: "hexagonal"
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
	tileHeight: 0,
	type: "orthogonal"
});

meta.Tileset = function(parent, gid, texture, tileWidth, tileHeight, margin, spacing) 
{
	this.parent = parent;
	this.gid = gid;
	this.tileWidth = tileWidth;
	this.tileHeight = tileHeight;
	this.margin = margin || 0;
	this.spacing = spacing || 0;
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

		var x = (gid % this.tilesX);
		var y = ((gid / this.tilesX) | 0);
		var posX = x * this.tileWidth + (x * (this.margin * 2)) + this.margin;
		var posY = y * this.tileHeight + (y * (this.margin * 2)) + this.margin;

		cell = new this.Cell(this._texture.canvas, posX, posY, this.tileWidth, this.tileHeight);
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

			var texture = meta.resources.textures[imgName];
			if(!texture) {
				texture = new Resource.Texture(src);
			}

			this._texture = texture;
		}

		if(!this._texture._loaded) {
			this.parent.numToLoad++;
			this.parent.flags &= ~this.parent.Flag.LOADED;
			this._texture.subscribe(this._onTextureEvent, this);
		}
		else {
			this.updateTexture();
		}
	},

	get texture() {
		return this._texture;
	},

	Cell: function(canvas, posX, posY, width, height) {
		this.canvas = canvas;
		this.posX = posX;
		this.posY = posY;
		this.width = width;
		this.height = height;
	}
};
