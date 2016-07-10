"use strict";

meta.class("Resource.SpriteSheet", "Resource.Basic", 
{
	onInit: function(param, path)
	{
		if(typeof(param) === "string") {
			path = param;
			param = void(0);
		}
		else
		{
			for(var key in param) {
				this[key] = param[key];
			}
		}

		if(path)
		{
			// Check if specific format is defined.
			var wildCardIndex = path.lastIndexOf(".");
			if(wildCardIndex !== -1 && (path.length - wildCardIndex) <= 5) {
				this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
				path = path.substr(0, wildCardIndex);
			}

			this.path = meta.resources.rootPath + path;
			if(!this.format) {
				this.format = "xml";
			}

			this.load(this.path);			
		}
	},

	load: function()
	{	
		if(this.loading) { return; }	

		this.loading = true;
		this.loaded = false;	
		this._atlasLoaded = false;	

		if(!this.texture) {
			this.texture = new Resource.Texture(this.path);
		}
		else if(typeof(this.texture) === "string") {
			this.texture = new Resource.Texture(this.texture);
		}

		this.texture.subscribe(this._onTextureEvent, this);	

		var self = this;
		var atlasPath = this.path + "." + this.format;
		this._request = new XMLHttpRequest();
		this._request.open("GET", atlasPath, true);
		this._request.onreadystatechange = function() {
			self._onStateChange();
		}	
		this._request.send();	

		meta.resources.addToLoad(this);
	},

	loadData: function(data, format)
	{
		format = format || this.format;
		if(!format) {
			format = "xml";
		}

		this.format = format;

		var result = false;
		if(format === "xml") {
			var parser = new DOMParser();
			var xml = parser.parseFromString(data, "text/xml");
			result = this.loadXML(xml);
		}
		else if(format === "json") {
			var json = JSON.parse(data);
			result = this.loadJSON(json);
		}
		else if(format === "plist") {
			var parser = new DOMParser();
			var plist = parser.parseFromString(data, "text/xml");
			result = this.loadPlist(plist);
		}
		else {
			console.warn("(Resource.SpriteSheet.loadData):", "Trying to load an unsupported format - " + this.format);
		}

		this.loaded = result;
		return result;
	},

	_createTexture: function(name, x, y, width, height)
	{
		var texture = meta.resources.createTexture(name);
		texture.ptr = this.texture;
		texture.canvas = this.texture.canvas;
		texture.x = x;
		texture.y = y;
		texture.width = width;
		texture.height = height;
		texture.loaded = true;

		return texture;
	},

	loadFromImg: function(path, frameWidth, frameHeight, margin, spacing)
	{
		var self = this;

		this.texture = new Resource.Texture(path);
		this.texture.subscribe(function() {
			self._generateFromImg(frameWidth, frameHeight, margin, spacing);
		});
	},

	_generateFromImg: function(frameWidth, frameHeight, margin, spacing)
	{
		var trueFrameWidth = frameWidth + (2 * spacing);
		var trueFrameHeight = frameWidth + (2 * spacing);

		var rawFramesX = (this.texture.trueFullWidth / trueFrameWidth);
		var rawFramesY = (this.texture.trueFullHeight / trueFrameHeight);
		var framesX = Math.floor(rawFramesX);
		var framesY = Math.floor(rawFramesY);

		var numFrames = framesX * framesY;
		this.frames = new Array(numFrames);

		var offset = margin;
		var id = 0;
		var posX, posY;		

		// uneven?
		if(rawFramesX !== framesX || rawFramesY !== framesY)
		{
			var maxWidth = this.texture.trueFullWidth;
			var maxHeight = this.texture.trueFullHeight;
			var width, height;
			var offsetX, offsetY;

			for(var y = 0; y < framesY; y++)
			{
				width = 0;
				height += frameHeight;
				if(height > maxHeight) {
					offsetY = maxHeight - height;
				}
				else {
					offsetY = 0;
				}

				for(var x = 0; x < framesX; x++)
				{
					width += frameWidth;
					if(width > maxWidth) {
						offsetX = maxWidth - width;
					}
					else {
						offsetX = 0;
					}

					posX = x * frameWidth + (x * (margin * 2)) + offset;
					posY = y * frameHeight + (y * (margin * 2)) + offset;
					this.frames[id] = this._createTexture(this.texture.name + "$$" + id, 
										posX, posY, frameWidth + offsetX, frameHeight + offsetY);

					id++;
				}
			}
		}
		else
		{
			for(var y = 0; y < framesY; y++)
			{
				for(var x = 0; x < framesX; x++)
				{
					posX = x * frameWidth + (x * (margin * 2)) + offset;
					posY = y * frameHeight + (y * (margin * 2)) + offset;
					this.frames[id] = this._createTexture(this.texture.name + "$$" + id, posX, posY, frameWidth, frameHeight);

					id++;
				}
			}
		}

		this.loaded = true;
	},	

	loadXML: function(xml)
	{
		if(!xml) {
			console.warn("(Resource.SpriteSheet.loadXML) Invalid XML file.");
			return false;
		}

		var childNodes = xml.documentElement.childNodes;
		var numNodes = childNodes.length;
		var node;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];

			// Starling
			if(node.nodeName === "SubTexture") 
			{
				this._createTexture(
					node.getAttribute("name"),
					parseInt(node.getAttribute("x")),
					parseInt(node.getAttribute("y")),
					parseInt(node.getAttribute("width")),
					parseInt(node.getAttribute("height")));
			}
			// Generic XML
			else if(node.nodeName === "sprite") 
			{
				this._createTexture(
					node.getAttribute("n"),
					parseInt(node.getAttribute("x")),
					parseInt(node.getAttribute("y")),
					parseInt(node.getAttribute("w")),
					parseInt(node.getAttribute("h")));
			}
			// Plist
			else if(node.nodeName === "dict") {
				return this.loadPlist(xml);
			}
		} 

		return true;
	},

	loadPlist: function(plist)
	{
		if(!plist) {
			console.warn("(Resource.SpriteSheet.loadPlist) Invalid Plist file");
			return false;
		}

		var childNodes = plist.documentElement.childNodes;
		var numNodes = childNodes.length;
		var node;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];

			if(node.nodeName === "dict") {
				return this._loadPlist_dict(node);
			}
		}
	},

	_loadPlist_dict: function(node)
	{
		var nodes = node.childNodes;
		var numNodes = nodes.length;
		var command = "";
		for(var i = 0; i < numNodes; i++)
		{
			node = nodes[i];
			if(node.nodeName === "key") {
				command = node.textContent;
			}
			else if(node.nodeName === "dict") 
			{
				if(!command) { continue; }

				if(command === "frames") {
					this._loadPlist_frames(node);
				}
			}
		}
	},

	_loadPlist_frames: function(node)
	{
		var nodes = node.childNodes;
		var numNodes = nodes.length;
		var name = "";
		for(var i = 0; i < numNodes; i++)
		{
			node = nodes[i];
			if(node.nodeName === "key") {
				name = node.textContent;
			}
			else if(node.nodeName === "dict") {
				this._loadPlist_frame(node, name);
			}
		}		
	},

	_loadPlist_frame: function(node, name)
	{
		var nodes = node.childNodes;
		var numNodes = nodes.length;
		var command = "", data;
		for(var i = 0; i < numNodes; i++)
		{
			node = nodes[i];
			if(node.nodeName === "key") {
				command = node.textContent;
			}
			else if(node.nodeName === "string") 
			{
				if(command === "frame") 
				{
					data = node.textContent.match(/[0-9]+/g);

					this._createTexture(
						name,
						parseInt(data[0]),
						parseInt(data[1]),
						parseInt(data[2]),
						parseInt(data[3]));				
					return;
				}
			}
		}	
	},

	loadJSON: function(json)
	{
		if(!json) {
			console.warn("(Resource.SpriteSheet.loadFromJSON) Invalid JSON file.");
			return false;
		}

		if(json.frames instanceof Array) {
			this._loadJSON_array(json);
		}
		else {
			this._loadJSON_hash(json);
		}

		return true;
	},

	_loadJSON_array: function(json)
	{
		var frame, frameInfo;
		var frames = json.frames;
		var numFrames = frames.length;
		for(var i = 0; i < numFrames; i++) 
		{
			frame = frames[i];
			frameInfo = frame.frame;

			this._createTexture(frame.filename, frameInfo.x, frameInfo.y, frameInfo.w, frameInfo.h);
		}		
	},

	_loadJSON_hash: function(json)
	{
		var frame;
		var frames = json.frames;
		for(var key in frames)
		{
			frame = frames[key].frame;

			this._createTexture(key, frame.x, frame.y, frame.w, frame.h);
		}		
	},

	_onTextureEvent: function(data, event)
	{
		if(event === Resource.Event.LOADED) 
		{
			this.texture.unsubscribe(this);
			if(this._atlasLoaded) {
				this.loadData(this._response, this.format);
				meta.resources.loadSuccess(this);
				this._response = null;	
			}
		}
	},

	_onStateChange: function()
	{
		if(this._request.readyState === 4)
		{
			if(this._request.status === 200) 
			{
				this._atlasLoaded = true;
				this._response = this._request.response;
				this._request = null;
				if(this.texture._loaded) {
					this.loadData(this._response, this.format);
					meta.resources.loadSuccess(this);
					this._response = null;
				}
			}
			else 
			{
				this._loaded = false;
				this._request.onreadystatechange = null;
				this._request = null;
				meta.resources.loadFailed(this);
			}
		}		
	},

	//
	type: Resource.Type.SPRITE_SHEET,
	format: "",
	texture: null,
	frames: null,

	_request: null,
	_response: null,

	_atlasLoaded: false
});
