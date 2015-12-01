"use strict";

meta.class("Entity.Text", "Entity.Geometry", 
{
	onCreate: function(params)
	{
		this.texture = new Resource.Texture();
		this._texture.resize(this._fontSize, this._fontSize);
		this._textBuffer = new Array(1);
		this.text = params;
	},

	initArg: function() {},

	updateTxt: function()
	{
		var n, i, fontHeight;
		var ctx = this._texture.ctx;
		var width = 0;
		var posX = 0;
		var posY = 0;
		var numLines = this._textBuffer.length;	

		if(this._bitmapFont) 
		{
			if(!this._bitmapFont.loaded) { return; }

			var canvas = this._bitmapFont.texture.canvas;
			var chars = this._bitmapFont.chars;
			var charRect = null;
			var numChars, tmpWidth, currText;

			fontHeight = this._bitmapFont.height;

			for(n = 0; n < numLines; n++) 
			{
				currText = this._textBuffer[n];
				numChars = currText.length;
				tmpWidth = 0;

				for(i = 0; i < numChars; i++)
				{
					charRect = chars[currText.charCodeAt(i)];
					if(!charRect) { continue; }

					tmpWidth += charRect.kerning;
				}

				if(tmpWidth > width) {
					width = tmpWidth;
				}
			}

			this._texture.clear();
			this._texture.resize(width, fontHeight * numLines);

			for(n = 0; n < numLines; n++) 
			{
				currText = this._textBuffer[n];
				numChars = currText.length;

				for(i = 0; i < numChars; i++)
				{
					charRect = chars[currText.charCodeAt(i)];
					
					if(!charRect) { continue; }
					if(charRect.width < 1 || charRect.height < 1) {
						continue;
					}

					ctx.drawImage(canvas, charRect.x, charRect.y, charRect.width, charRect.height, 
						posX, posY + charRect.offsetY, charRect.width, charRect.height);
					posX += charRect.kerning;
				}

				posY += fontHeight;
				posX = 0;
			}
		}
		else
		{
			ctx.font = this._style + " " + this._fontSizePx + " " + this._font;

			var metrics;
			for(n = 0; n < numLines; n++) 
			{
				metrics = ctx.measureText(this._textBuffer[n]);
				if(metrics.width > width) {
					width = metrics.width;
				}
			}

			if(this._shadow) {
				width += this._shadowBlur * 2;
				posX += this._shadowBlur;
			}

			fontHeight = (this._fontSize * 1.3);

			this._texture.resize(width, fontHeight * numLines);

			ctx.clearRect(0, 0, this.volume.initWidth, this.volume.initHeight);
			ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
			ctx.fillStyle = this._color;
			ctx.textBaseline = "top";

			if(this._shadow) {
				ctx.shadowColor = this._shadowColor;
				ctx.shadowOffsetX = this._shadowOffsetX;
				ctx.shadowOffsetY = this._shadowOffsetY;
				ctx.shadowBlur = this._shadowBlur;
			}

			if(this._outline) {
				ctx.lineWidth = this._outlineWidth;
				ctx.strokeStyle = this._outlineColor;
			}		

			for(n = 0; n < numLines; n++)
			{
				ctx.fillText(this._textBuffer[n], posX, posY);

				if(this._outline) {
					ctx.strokeText(this._textBuffer[n], posY, posY);
				}

				posY += fontHeight;
			}
		}

		this.renderer.needRender = true;
	},

	set text(text) 
	{ 
		if(text !== void(0))
		{
			if(typeof(text) === "number") {
				this._text = text + "";
				this._textBuffer[0] = this._text;
			}
			else 
			{
				this._text = text;

				var newlineIndex = text.indexOf("\n");
				if(newlineIndex !== -1) {
					this._textBuffer = text.split("\n");
				}
				else {
					this._textBuffer[0] = this._text;
				}
			}
		}
		else {
			this._text = "";
			this._textBuffer[0] = this._text;
		}
		
		this.updateTxt();
	},

	get text() { return this._text; },

	set font(font) 
	{
		var fontResource = meta.resources.getResource(font, Resource.Type.FONT);
		if(!fontResource) {
			this._font = font;
			this._bitmapFont = null;
		}
		else 
		{
			this._bitmapFont = fontResource;

			if(!fontResource._loaded) {
				this._texture.clear();
				fontResource.subscribe(this._onFontEvent, this);
				return;
			}
		}

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

	set style(style) 
	{ 
		if(this._style === style) { return; }
		this._style = style;
		
		this.updateTxt();
	},

	get style() { return this._style; },	

	set outlineColor(color) 
	{ 
		if(this._outlineColor === color) { return; }
		this._outlineColor = color;
		this._outline = true;

		this.updateTxt();
	},

	get outlineColor() { return this._outlineColor; },

	set outlineWidth(width) 
	{ 
		if(this._outlineWidth === width) { return; }
		this._outlineWidth = width;
		this._outline = true;
		
		this.updateTxt();
	},

	get outlineWidth() { return this._outlineWidth; },

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
		this._shadow = true;

		this.updateTxt();
	},

	get shadowColor() { return this._shadowColor; },

	set shadowBlur(value)
	{
		if(this._shadowBlur === value) { return; }
		this._shadowBlur = value;
		this._shadow = true;

		this.updateTxt();
	},

	get shadowBlur() { return this._shadowBlur; },

	set shadowOffsetX(value)
	{
		if(this._shadowOffsetX === value) { return; }
		this._shadowOffsetX = value;
		this._shadow = true;

		this.updateTxt();
	},

	set shadowOffsetY(value)
	{
		if(this._shadowOffsetY === value) { return; }
		this._shadowOffsetY = value;
		this._shadow = true;

		this.updateTxt();
	},	

	get shadowOffsetX() { return this._shadowOffsetY; },
	get shadowOffsetY() { return this._shadowOffsetY; },

	_onFontEvent: function(data, event) {
		this.updateTxt();
	},

	//
	_bitmapFont: null,

	_text: "",
	_textBuffer: null,

	_font: "Tahoma",
	_fontSize: 12,
	_fontSizePx: "12px",
	_color: "#fff",
	_style: "",

	_outline: false,
	_outlineColor: "#000",
	_outlineWidth: 1,

	_shadow: true,
	_shadowColor: "#000",
	_shadowBlur: 3,
	_shadowOffsetX: 0,
	_shadowOffsetY: 0
});
