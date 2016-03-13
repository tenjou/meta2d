"use strict";

meta.class("Entity.Tilemap", "Entity.Geometry",
{
	init: function(tilesX, tilesY, tileWidth, tileHeight)
	{
		this._super();

		if(tilesX)
		{
			if(typeof(tilesX) === "string") {
				this.load(tilesX);
			}
			else {
				this.create(tilesX, tilesY, tileWidth, tileHeight);
			}
		} 
	},

	initArg: function(arg) {},

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
		this.properties = {};

		this.tilesX = tilesX;
		this.tilesY = tilesY;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.type = type ? type : "orthogonal";

		// switch(this.type)
		// {
		// 	case this.Type.ORTHOGONAL:
		// 		this.updateSizeOrtho();
		// 		break;

		// 	case this.Type.ISOMETRIC:
		// 		this.updateSizeIso
		// 		break;

		// 	case this.Type.HEXAGONAL:
		// 		layer = new Entity.TilemapHexLayer();
		// 		break;

		// 	default:
		// 		console.warn("(Entity.Tilemap.createLayer) Trying to create unsupported layer type");
		// 		break;
		// }		

		this.resize(tilesX * tileWidth, tilesY * tileHeight);

		this.tilesets = [];
		this.detachAll();
	},

	createTileset: function(gid, resource, tileWidth, tileHeight, margin, spacing)
	{
		if(gid < 1) {
			console.warn("(Entity.Tilemap.createTileset) gid argument should be 1 or larger number");
			return;
		}

		var texture = null;
		var spriteSheet = null;

		if(typeof(resource) === "string") 
		{
			var name = meta.getNameFromPath(resource);

			texture = meta.resources.textures[name];
			if(!texture) 
			{
				spriteSheet = meta.resources.spriteSheets[name];
				if(!spriteSheet)
				{
					spriteSheet = new Resource.SpriteSheet();
					spriteSheet.name = name;
					spriteSheet.loadFromImg(resource, tileWidth, tileHeight, margin, spacing);
					meta.resources.spriteSheets[name] = spriteSheet;
				}

				texture = spriteSheet.texture;
			}
		}
		else if(resource instanceof Resource.Texture) {
			texture = resource;
		}
		else if(resource instanceof Resource.SpriteSheet) {
			spriteSheet = resource;
			texture = resource.texture;
		}

		if(!texture) {
			console.warn("(Entity.Tilemap.createTileset) Invalid texture passed");
			return;
		}

		var tileset = new meta.Tileset(gid, texture, spriteSheet, tileWidth, tileHeight);
		this.tilesets.push(tileset);
		
		if(!texture._loaded) {
			this.loaded = false;
			this.numToLoad++;
			texture.subscribe(this.handleTilesetEvent, this);
		}

		if(this.numToLoad === 0) {
			this.finishLoading();
		}

		return tileset;
	},

	createLayer: function(data, tilesX, tilesY, name)
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

			case this.Type.HEXAGONAL:
				layer = new Entity.TilemapHexLayer();
				break;

			default:
				console.warn("(Entity.Tilemap.createLayer) Trying to create unsupported layer type");
				break;
		}

		layer.tilesX = (tilesX === void(0)) ? this.tilesX : tilesX;
		layer.tilesY = (tilesY === void(0)) ? this.tilesY : tilesY;
		layer.tileWidth = this.tileWidth;
		layer.tileHeight = this.tileHeight;
		layer.tileHalfWidth = this.tileWidth * 0.5;
		layer.tileHalfHeight = this.tileHeight * 0.5;
		layer.properties = {};
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
		for(var n = 0; n < num; n++) {
			tileset = this.tilesets[n];
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
		this.properties = json.properties;

		var tileset, tilesetInfo;
		var tilesets = json.tilesets;
		var num = tilesets.length;
		for(var n = 0; n < num; n++) 
		{
			tilesetInfo = tilesets[n];

			tileset = this.createTileset(
				tilesetInfo.firstgid, this.folderPath + tilesetInfo.image, 
				tilesetInfo.tilewidth, tilesetInfo.tileheight);
			tileset.properties = tilesetInfo.tileproperties;
		}

		var layer, layerInfo;
		var layers = json.layers;
		num = layers.length;
		for(n = 0; n < num; n++)
		{
			layerInfo = layers[n];
			layer = this.createLayer(layerInfo.data, layerInfo.width, layerInfo.height, layerInfo.name);

			if(layerInfo.properties) {
				layer.properties = layerInfo.properties;
			}
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

			switch(node.nodeName)
			{
				case "tileset":
					this._parse_tmx_tileset(node);
					break;

				case "layer":
					this._parse_tmx_layer(node);
					break;

				case "properties":
					this.properties = this._parse_tmx_properties(node);
					break;
			}
		}

		if(this.numToLoad === 0) {
			this.loaded = true;
		}
	},

	_parse_tmx_tileset: function(node)
	{
		var imgPath = "";
		var properties = {};
		var tileProperties;

		var childNode;
		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var n = 0; n < numNodes; n++)
		{
			childNode = childNodes[n];
			if(childNode.nodeType !== 1) { continue; }

			switch(childNode.nodeName)
			{
				case "image":
					imgPath = this.folderPath + childNode.getAttribute("source");
					break;

				case "tile":
				{
					tileProperties = this._parse_tmx_tile(childNode);
					if(tileProperties) {
						properties[childNode.getAttribute("id")] = tileProperties;
					}	
				} break;
			}
		}

		var spacingStr = node.getAttribute("spacing");
		var spacing = spacingStr ? parseInt(spacingStr) : 0;

		var marginStr = node.getAttribute("margin");
		var margin = marginStr ? parseInt(marginStr) : 0;		

		var tileset = this.createTileset(
			parseInt(node.getAttribute("firstgid")),
			imgPath,
			parseInt(node.getAttribute("tilewidth")),
			parseInt(node.getAttribute("tileheight")),
			margin, spacing);	
		tileset.properties = properties;
	},

	_parse_tmx_tile: function(node)
	{
		var properties = null;

		var childNode;
		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var n = 0; n < numNodes; n++)
		{
			childNode = childNodes[n];
			if(childNode.nodeType !== 1) { continue; }

			switch(childNode.nodeName)
			{
				case "properties":
					properties = this._parse_tmx_properties(childNode);
					break;
			}
		}

		console.log(properties);

		return properties;
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

		var properties = null;
		var data;

		var childNodes = node.childNodes;
		var numNodes = childNodes.length;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];
			if(node.nodeType !== 1) { continue; }

			switch(node.nodeName)
			{
				case "data":
					data = this._parse_tmx_data(node, tilesX, tilesY);
					break;

				case "properties":
					properties = this._parse_tmx_properties(node);
					break;
			}
		}

		var layer = this.createLayer(data, tilesX, tilesY, name);
		if(properties) {
			layer.properties = properties;
		}
		layer.hidden = !visible;
	},

	_parse_tmx_data: function(node, tilesX, tilesY)
	{
		var num = tilesX * tilesY;
		var encoding = node.getAttribute("encoding");
		var data;

		if(encoding)
		{
			var strData = null;

			if(encoding === "csv")
			{
				strData = node.textContent.split(",");
				if(strData.length !== num) {
					console.warn("(Entity.Tilemap._parse_tmx): Layer resolution does not match with data size");
					return;
				}

				data = new Uint32Array(num);
				
				for(var n = 0; n < num; n++) {
					data[n] = parseInt(strData[n]);
				}				
			}
			else if(encoding === "base64")
			{
				var compression = node.getAttribute("compression");
				if(compression) {
					console.warn("(Entity.Tilemap._parse_tmx): Unsupported compression - " + compression);
					return;
				}

				data = meta.decodeBinaryBase64(node.textContent);
			}
			else {
				console.warn("(Entity.Tilemap._parse_tmx): Unsupported layer encoding used: " + encoding);
				return;
			}
		}
		else
		{
			var id = 0;
			var dataNodes = node.childNodes;

			num = dataNodes.length;
			data = new Uint32Array(num);

			for(n = 0; n < num; n++) 
			{
				node = dataNodes[n];
				if(node.nodeType !== 1) { continue; }

				data[id++] = parseInt(node.getAttribute("gid"));
			}
		}

		return data;
	},

	_parse_tmx_properties: function(node)
	{
		var properties = {};

		var childNodes = node.childNodes;
		var num = childNodes.length;

		var childNode;
		for(var n = 0; n < num; n++) 
		{
			childNode = childNodes[n];
			if(childNode.nodeType !== 1) { continue; }

			properties[childNode.getAttribute("name")] = childNode.getAttribute("value");
		}

		return properties;
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

	handleTilesetEvent: function(data, event)
	{
		if(event === Resource.Event.LOADED) 
		{
			this.numToLoad--;
			if(this.numToLoad === 0) {
				this.finishLoading();
			}
		}
	},

	Type: {
		UNKNOWN: "",
		ORTHOGONAL: "orthogonal",
		ISOMETRIC: "isometric",
		HEXAGONAL: "hexagonal"
	},

	LayerInfoFlag: {
		FLIP_HORIZONTALLY: 0x80000000,
		FLIP_VERTICALLY: 0x40000000,
		FLIP_DIAGONALLY: 0x20000000
	},	

	//
	tilesets: null,
	properties: null,

	path: "",
	folderPath: "",
	numToLoad: 0,

	tilesX: 0,
	tilesY: 0,
	tileWidth: 0,
	tileHeight: 0,
	type: "orthogonal"
});

meta.Tileset = function(gid, texture, spriteSheet, tileWidth, tileHeight) 
{
	this.gid = gid;
	this.texture = texture;
	this.spriteSheet = spriteSheet;
	this.properties = null;
	this.tileWidth = tileWidth;
	this.tileHeight = tileHeight;
};

meta.Tileset.prototype = 
{
	getCell: function(gid)
	{
		if(this.spriteSheet)
		{
			gid -= this.gid;
			return this.spriteSheet.frames[gid];
		}
			
		return this.texture;
	}
};