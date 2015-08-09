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

				//console.log(gidX, gidY)

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

	createLayer: function(name, tilesX, tiles)
	{

	},

	_parse_json: function(data)
	{
		console.log("json");

		this.loaded = true;
	},

	_parse_tmx: function(data)
	{
		var parser = new DOMParser();
		var xml = parser.parseFromString(data, "text/xml");

		var node = xml.documentElement;
		this.tilesX = parseInt(node.getAttribute("width"));
		this.tilesY = parseInt(node.getAttribute("height"));
		this.tileWidth = parseInt(node.getAttribute("tilewidth"));
		this.tileHeight = parseInt(node.getAttribute("tilewidth"));

		this.resize(this.tilesX * this.tileWidth, this.tilesY * this.tileHeight);

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
				break;
			}
			else if(node.nodeName === "objectgroup") {

			}
		}

		this.loaded = true;
	},

	_parse_tmx_tileset: function(node)
	{
		var imgNode = node.childNodes[1];
		var imgSrc = imgNode.getAttribute("source");
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

		var tileset = new this.Tileset();
		tileset.gid = parseInt(node.getAttribute("firstgid"));
		tileset.name = node.getAttribute("name");
		tileset.tileWidth = parseInt(node.getAttribute("tileWidth"));
		tileset.tileHeight = parseInt(node.getAttribute("tileHeight"));
		tileset.texture = texture;

		this.tilesets.push(tileset);
	},

	_parse_tmx_layer: function(node)
	{
		var layer = new Entity.TilemapLayer();
		layer.name = node.getAttribute("name");
		layer.tilesX = parseInt(node.getAttribute("width"));
		layer.tilesY = parseInt(node.getAttribute("height"));
		layer.tileWidth = this.tileWidth;
		layer.tileHeight = this.tileHeight;
		layer.resize(layer.tilesX * this.tileWidth, layer.tilesY * this.tileHeight);

		var n;
		var num = layer.tilesX * layer.tilesY;
		var data = new Uint32Array(num);
		var dataNode = node.children[0];

		var encoding = dataNode.getAttribute("encoding");
		if(encoding === "csv")
		{
			var strData = dataNode.innerHTML.split(",");
			if(strData.length !== num) {
				console.warn("(Entity.Tilemap.parse) Layer resolution does not match with data size");
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

				data[id++] = node.getAttribute("gid");
			}
		}

		layer.data = data;
		layer.tileset = this.tilesets[0];
		this.attach(layer);
	},

	Tileset: function() {
		this.gid = 0;
		this.texture = null;
		this.tileWidth = 0;
		this.tileHeight = 0;
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
