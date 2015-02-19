"use strict";

Entity.Text = Entity.Geometry.extend
({
	init: function(params)
	{
		this.texture = new Resource.Texture();
		this._texture.resize(this._fontSize, this._fontSize);

		var type = typeof(params);
		if(type === "string" || type === "number") {
			this._text = params;
		}	
		
		this.updateTxt();
	},

	initFromParam: function() {},

	updateTxt: function()
	{
		var ctx = this._texture.ctx;
		ctx.font = this._style + " " + this._fontSizePx + " " + this._font;

		var metrics = ctx.measureText(this._text);
		var width = metrics.width + (this.outlineWidth * 2);
		this.resize(width, this._fontSize * 1.2);

		ctx.clearRect(0, 0, this.volume.width, this.volume.height);
		ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
		ctx.fillStyle = this._color;
		ctx.textBaseline = "top";

		if(this._shadow) {
			ctx.shadowColor = this._shadowColor;
			ctx.shadowOffsetX = this._shadowOffsetX;
			ctx.shadowOffsetY = this._shadowOffsetY;
			ctx.shadowBlur = this._shadowBlur;
		}

		ctx.fillText(this._text, this._outlineWidth, 0);

		if(this._outline) {
			ctx.lineWidth = this._outlineWidth;
			ctx.strokeStyle = this._outlineColor;
			ctx.strokeText(this._text, this._outlineWidth, 0);
		}

		if(!this._texture._loaded) {
			this._texture.loaded = true;
		}

		this.renderer.needRender = true;
	},

	set text(text) { 
		this._text = text;
		this.updateTxt();
	},

	get text() { return this._text; },

	set font(font) {
		this._font = font;
		this.updateTxt();
	},

	get font() { return this._font; },

	set size(size) { 
		this._fontSize = size;
		this._fontSizePx = size + "px";
		this.updateTxt();
	},

	get size() { return this._fontSize; },

	set color(color) {
		this._color = color;
		this.updateTxt();
	},

	get color() { return this._color; },

	set outlineColor(color) { 
		this._outlineColor = color;
		this.outline = true;
	},

	get outlineColor() { return this._outlineColor; },

	set outlineWidth(width) 
	{ 
		if(this._outlineWidth === width) { return; }
		this._outlineWidth = width;

		if(this._outline) {
			this.updateTxt();
		}
	},

	get outlineWidth() { return this._outlineWidth; },

	set style(style) 
	{ 
		if(this._style === style) { return; }
		this._style = style;
		
		this.updateTxt();
	},

	get style() { return this._style; },

	set outline(value)
	{
		if(this._outline === value) { return; }
		this._outline = value;

		this.updateTxt();
	},

	get outline() { return this._outline; },

	set shadow(value) 
	{
		if(this._shadow === value) { return; }
		this._shadow = value;

		this.updateTxt();
	}, 

	get shadow() { return this._shadow; },

	set shadowColor(value) 
	{
		if(this._shadowColor === value) { return; }
		this._shadowColor = value;

		this.updateTxt();
	},

	get shadowColor() { return this._shadowColor; },

	set shadowBlur(value)
	{
		if(this._shadowBlur === value) { return; }
		this._shadowBlur = value;

		this.updateTxt();
	},

	get shadowBlur() { return this._shadowBlur; },

	set shadowOffsetX(value)
	{
		if(this._shadowOffsetX === value) { return; }
		this._shadowOffsetX = value;

		this.updateTxt();
	},

	set shadowOffsetY(value)
	{
		if(this._shadowOffsetY === value) { return; }
		this._shadowOffsetY = value;

		this.updateTxt();
	},	

	get shadowOffsetX() { return this._shadowOffsetY; },
	get shadowOffsetY() { return this._shadowOffsetY; },

	//
	_text: "",
	_font: "Verdana",
	_fontSize: 12,
	_fontSizePx: "12px",
	_color: "#000000",
	_style: "",

	_outline: false,
	_outlineColor: "#ffffff",
	_outlineWidth: 1,

	_shadow: false,
	_shadowColor: "#000000",
	_shadowBlur: 2,
	_shadowOffsetX: 1,
	_shadowOffsetY: 1
});
