"use strict";

Resource.SpriteSheet = Resource.Basic.extend
({
	init: function(param, path)
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
			if(wildCardIndex !== -1 && (path.length - wildCardIndex) >= 4) {
				this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
				path = path.substr(0, wildCardIndex);
			}

			this.path = Resource.ctrl.rootPath + path;
			if(!this.format) {
				this.format = "xml";
			}
		}

		// if(this.texture) {
		// 	this.texture = new Resource.Texture(this.texture);
		// 	Resource.ctrl.add(this.texture);
		// }

		// if(this.atlas) {
		// 	this.loadFromAtlas();
		// }
	},

	load: function()
	{	
		if(this.isLoading) { return; }	

		this.isLoading = true;
		this.isLoaded = false;	
		this._isAtlasLoaded = false;	

		if(!this.texture) {
			this.texture = new Resource.Texture(this.path);
		}
		else if(typeof(this.texture) === "string") {
			this.texture = new Resource.Texture(this.texture);
		}

		if(!this.texture._isLoaded) 
		{
			this.texture.subscribe(this, this._onTextureEvent);

			if(!this.texture._isLoading) {
				this.texture.load();
			}
		}		

		var self = this;
		var atlasPath = this.path + "." + this.format;
		this._request = new XMLHttpRequest();
		this._request.open("GET", atlasPath, false);
		this._request.onreadystatechange = function() {
			self._onStateChange();
		}	
		this._request.send();	

		Resource.ctrl.addToLoad(this);


		// this.texture.subscribe(this, this._onTextureEvent);
		// this.texture.load();

		// console.log(this.atlas);
	},

	loadData: function(data, format)
	{
		format = format || this.format;
		if(!format) {
			format = "xml";
		}

		this.format = format;
		this.isLoaded = true;

		if(format === "xml") {
			var parser = new DOMParser();
			var xml = parser.parseFromString(data, "text/xml");
			return this.loadXML(xml);
		}
		else if(format === "json") {
			var json = JSON.parse(data);
			return this.loadJSON(json);
		}
		else if(format === "plist") {
			var parser = new DOMParser();
			var plist = parser.parseFromString(data, "text/xml");
			return this.loadPlist(plist);
		}
		else {
			console.warn("[Resource.SpriteSheet.loadData]:", "Trying to load an unsupported format - " + this.format);
		}
		
		return false;
	},

	loadXML: function(xml)
	{
		if(!xml) {
			console.warn("[Resource.SpriteSheet.loadXML]:", "Invalid XML file.");
			return false;
		}

		var childNodes = xml.documentElement.childNodes;
		var numNodes = childNodes.length;
		var node;
		for(var i = 0; i < numNodes; i++)
		{
			node = childNodes[i];

			// Starling
			if(node.nodeName === "SubTexture") {
				this._loadXML_Starling(node);
			}
			// Generic XML
			else if(node.nodeName === "sprite") {
				this._loadXML_genericXML(node);
			}
			// Plist
			else if(node.nodeName === "dict") {
				return this.loadPlist(xml);
			}
		}

		return true;
	},

	_loadXML_Starling: function(node)
	{
		var texture = new Resource.Texture();
		texture.ptr = this.texture;			
		texture.name = node.getAttribute("name");
		texture.x = node.getAttribute("x");
		texture.y = node.getAttribute("y");
		texture._width = node.getAttribute("width");
		texture._height = node.getAttribute("height");
		texture.fromAtlas = true;
		texture.update();
		Resource.ctrl.add(texture);	
	},

	_loadXML_genericXML: function(node)
	{
		var texture = new Resource.Texture();
		texture.ptr = this.texture;			
		texture.name = node.getAttribute("n");
		texture.x = node.getAttribute("x");
		texture.y = node.getAttribute("y");
		texture._width = node.getAttribute("w");
		texture._height = node.getAttribute("h");
		texture.fromAtlas = true;
		texture.update();
		Resource.ctrl.add(texture);	
	},

	loadPlist: function(plist)
	{
		if(!plist) {
			console.warn("[Resource.SpriteSheet.loadPlist]:", "Invalid Plist file.");
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
		var texture = new Resource.Texture();
		texture.ptr = this.texture;
		texture.name = name;

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
					texture.x = parseInt(data[0]);
					texture.y = parseInt(data[1]);
					texture._width = parseInt(data[2]);
					texture._height = parseInt(data[3]);
					texture.fromAtlas = true;
					texture.update();
					Resource.ctrl.add(texture);						
					return;
				}
			}
		}	
	},

	loadJSON: function(json)
	{
		if(!json) {
			console.warn("[Resource.SpriteSheet.loadFromJSON]:", "Invalid JSON file.");
			return false;
		}

		if(json.frames instanceof Array) {
			this._loadFromJSON_array(json);
		}
		else {
			this._loadFromJSON_hash(json);
		}

		return true;
	},

	_loadFromJSON_array: function(json)
	{
		var frame, texture;
		var frames = json.frames;
		var numFrames = frames.length;
		for(var i = 0; i < numFrames; i++) 
		{
			frame = frames[i];
			texture = new Resource.Texture();
			texture.ptr = this.texture;			
			texture.name = frame.filename;

			frame = frame.frame;
			texture.x = frame.x;
			texture.y = frame.y
			texture._width = frame.w;
			texture._height = frame.h;
			texture.fromAtlas = true;
			texture.update();
			Resource.ctrl.add(texture);	
		}		
	},

	_loadJSON_hash: function(json)
	{
		var frame, texture;
		var frames = json.frames;
		for(var key in frames)
		{
			texture = new Resource.Texture();
			texture.ptr = this.texture;			
			texture.name = key;

			frame = frames[key].frame;
			texture.x = frame.x;
			texture.y = frame.y
			texture._width = frame.w;
			texture._height = frame.h;
			texture.fromAtlas = true;
			texture.update();
			Resource.ctrl.add(texture);	
		}		
	},


	loadAtlas: function()
	{
		if(typeof(this.atlas) !== "object") {
			console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "Incorrect atlas object, expected to be an Array.");
			return false;
		}

		var frames = [];
		var item, texture, name;
		var numItems = this.atlas.length;
		for(var i = 0; i < numItems; i++) 
		{
			item = this.atlas[i];
			name = item.name || this.params;

			if(!name) {
				console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "No name defined for atlas item in " + this.name + " spritesheet.");
				continue;
			}

			item.x = item.x || this.params.x || 0;
			item.y = item.y || this.params.y || 0;
			item.width = item.width || this.params.width || 1;
			item.height = item.height || this.params.height || 1;	
			frames.push(item);			

			texture = new Resource.Texture();
			texture.ptr = this.texture;			
			texture.name = name;
			texture.x = item.x;
			texture.y = item.y;
			texture._width = item.width;
			texture._height = item.height;
			texture.numFrames = item.numFrames || this.params.numFrames || 1;
			texture.fromAtlas = true;
			Resource.ctrl.add(texture);
		}

		this.texture._frames = frames;
		this.atlas = null;
		this.isLoaded = true;

		return true;
	},


	_onTextureEvent: function(data, event)
	{
		if(event === Resource.Event.LOADED) 
		{
			this.texture.unsubscribe(this);
			if(this._isAtlasLoaded) {
				this.loadData(this._response, this.format);
				Resource.ctrl.loadSuccess(this);
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
				this._isAtlasLoaded = true;
				this._response = this._request.response;
				this._request = null;
				if(this.texture._isLoaded) {
					this.loadData(this._response, this.format);
					Resource.ctrl.loadSuccess(this);
					this._response = null;
				}
			}
			else {
				this._isLoading = false;
				this._request.onreadystatechange = null;
				this._request = null;
				Resource.ctrl.loadFailed(this);
			}
		}		
	},


	//
	type: Resource.Type.SPRITE_SHEET,
	format: "",
	atlas: null,
	params: null,
	texture: null,

	_request: null,
	_response: null,

	_isAtlasLoaded: false
});