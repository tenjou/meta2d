"use strict";

meta.class("Entity.TilemapLayer", "Entity.Geometry",
{
	draw: function(ctx) 
	{
		if(!this.parent.loaded) { return; }

		var cameraVolume = meta.camera.volume;

		var numCellsX = cameraVolume.minX;
		var numCellsY = 0;
		//console.log(numCellsX, numCellsY);

		var gid = 0, id = 0;
		var canvas = this.tileset.texture.canvas;
		var posX = this.volume.minX;
		var posY = this.volume.minY;
		for(var y = 0; y < this.tilesY; y++)
		{
			for(var x = 0; x < this.tilesX; x++)
			{
				gid = this.data[id++];

				if(gid === 0) { 
					posX += this.tileWidth;
					continue; 
				}

				gid--;
				var gidX = (gid % 8) * this.tileWidth;
				var gidY = ((gid / 8) | 0) * this.tileHeight;

				ctx.drawImage(canvas, gidX, gidY, this.tileWidth, this.tileHeight, posX, posY, this.tileWidth, this.tileHeight);
				posX += this.tileWidth;
			}

			posX = this.volume.minX;
			posY += this.tileHeight;
		}
	},

	//
	name: "untitled",
	tilesX: 0,
	tilesY: 0,
	tileWidth: 0,
	tileHeight: 0,
	tileset: null,
	data: null
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

	createTileset: function(gid, tileWidth, tileHeight, imgSrc)
	{
		var wildcardIndex = imgSrc.lastIndexOf(".");
		var slashIndex = imgSrc.lastIndexOf("/");
		if(slashIndex === -1) {
			slashIndex = 0;
		}
		var imgName = imgSrc.substr(slashIndex, wildcardIndex, wildcardIndex - slashIndex);

		var texture = meta.resources.getTexture(imgName);
		if(!texture) {
			texture = new Resource.Texture(this.folderPath + imgSrc);
		}

		var tileset = new this.Tileset(gid, tileWidth, tileHeight, texture);
		this.tilesets.push(tileset);
	},

	createLayer: function(name, tilesX, tilesY, data)
	{
		var layer = new Entity.TilemapLayer();
		layer.name = name;
		layer.tilesX = tilesX;
		layer.tilesY = tilesY;
		layer.tileWidth = this.tileWidth;
		layer.tileHeight = this.tileHeight;
		layer.resize(tilesX * this.tileWidth, tilesY * this.tileHeight);
		layer.data = data;
		layer.tileset = this.tilesets[0];
		this.attach(layer);

		return layer;
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
			this.createTileset(tileset.firstgid, tileset.tileWidth, tileset.tileHeight, tileset.image);
		}

		var layer;
		var layers = json.layers;
		num = layers.length;
		for(n = 0; n < num; n++)
		{
			layer = layers[n];
			this.createLayer(layer.name, layer.width, layer.height, layer.data);
		}

		this.loaded = true;
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
					parseInt(node.getAttribute("tileWidth")),
					parseInt(node.getAttribute("tileHeight")),
					node.childNodes[1].getAttribute("source"));
			}
			else if(node.nodeName === "layer") {
				this._parse_tmx_layer(node);
				break;
			}
			else if(node.nodeName === "objectgroup") {

			}
		}

		this.loaded = true;
	},

	_parse_tmx_layer: function(node)
	{
		var name = node.getAttribute("name");
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

		this.createLayer(name, tilesX, tilesY, data);
	},

	Tileset: function(gid, tileWidth, tileHeight, texture) {
		this.gid = gid;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.texture = texture;
	},

	//
	tilesets: null,

	path: "",
	folderPath: "",

	tilesX: 0,
	tilesY: 0,
	tileWidth: 0,
	tileHeight: 0
});
