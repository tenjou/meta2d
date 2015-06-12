"use strict";

meta.class("Resource.Font", "Resource.Basic", 
{
	init: function(path, tag)
	{
		if(path) {
			this.load(Resource.ctrl.rootPath + path);
		}			
	},

	load: function(path)
	{
		if(this.loading) { return; }
		this.loaded = false;

		if(!path) { return; }
		this.path = path;

		// Check if path is missing it's extension:
		var wildCardIndex = this.path.lastIndexOf(".");
		if(wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
			this.path += ".fnt";
			this.format = "fnt";
		}
		else {
			this.format = this.path.substr(wildCardIndex + 1)
		}

		var parseFunc = this["parse_" + this.format];
		if(!parseFunc) {
			console.warn("(Resource.Font.load) Unsupported format: " + this.format);
			return;
		}

		this.chars = new Array(256);

		Resource.ctrl.addToLoad(this);

		this.texture = new Resource.Texture(path);
		this.texture.subscribe(this, this._onTextureEvent);

		var self = this;
		meta.ajax({
			url: this.path,
			success: function(data) { parseFunc.call(self, data); },
			error: function() { self._onError(); }
		});
	},

	parse_fnt: function(data) 
	{
		this.tokenizer.setup(data);
		this.tokenizer.nextToken();
		while(this.tokenizer.token.type !== 0) {
			this._parseToken_fnt();	
		}

		this._loadedFormat = true;
		if(this.texture._loaded) {
			Resource.ctrl.loadSuccess(self);
			this.loaded = true;
		}
	},

	_parseToken_fnt: function()
	{
		var token = this.tokenizer.token;
		var line = token.line;

		switch(token.str) 
		{
			case "char": 
			{
				var rect = new this.Rect();

				for(;;)
				{
					token = this.tokenizer.nextToken();
					if(token.line !== line) { break; }

					switch(token.str) 
					{
						case "id":
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							this.chars[token.value] = rect;
							break;

						case "x":
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							rect.x = token.value;	
							break;		

						case "y":
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							rect.y = token.value;	
							break;	

						case "width":
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							rect.width = token.value;	
							break;	

						case "height":
						{
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							rect.height = token.value;	

							if(this.height < token.value) {
								this.height = token.value;
							}
						} break;								

						case "xadvance":
							this.tokenizer.nextToken();
							token = this.tokenizer.nextToken();
							rect.kerning = token.value;	
							break;																																	
					}
				}
			} break;

			default:
				this.tokenizer.nextToken();
				break;
		}
	},

	_onTextureEvent: function(data, event)
	{
		switch(event)
		{
			case Resource.Event.LOADED: 
			{
				this._loadedFormat = true;
				if(this.texture._loaded) {
					Resource.ctrl.loadSuccess(self);
					this.loaded = true;
				}
			} break;

			case Resource.Event.FAILED: {

			} break;
		}	
	},

	Rect: function() {
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
		this.kerning = 0;
	},

	//
	tokenizer: meta.tokenizer,

	type: Resource.Type.FONT,
	format: "",

	texture: null,
	chars: null,
	height: 1,

	_loadedFormat: false
});

