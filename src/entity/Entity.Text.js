"use strict";

meta.class("Entity.Text", "Entity.Geometry", 
{
	onCreate: function(params)
	{
		this.texture = new Resource.Texture();
		this._texture.resize(this._fontSize, this._fontSize);
		this._lineBuffer = new Array(1);
		this.text = params;
	},

	initArg: function() {},

	updateTxt: function()
	{
		var ctx = this._texture.ctx;

		if(this._bitmapFont) {
			this.updateTxt_bitmapFont(ctx);
		}
		else {
			this.updateTxt_canvasFont(ctx);
		}

		this.renderer.needRender = true;
	},

	updateTxt_bitmapFont: function(ctx)
	{
		if(!this._bitmapFont.loaded) { return; }

		var canvas = this._bitmapFont.texture.canvas;
		var chars = this._bitmapFont.chars;
		var charRect = null;
		var numChars, tmpWidth, currText;

		fontHeight = this._bitmapFont.height;

		for(var n = 0; n < numLines; n++) 
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
	},

	updateTxt_canvasFont: function(ctx)
	{
		ctx.font = this._style + " " + this._fontSizePx + " " + this._font;

		this._maxWidth = 0;

		var lineBuffer;
		var numLines = this._lineBuffer.length;
		if(this._limitWidth > 0)
		{
			lineBuffer = this.calcLineBuffer(ctx);
			numLines = lineBuffer.length;
		}
		else 
		{
			lineBuffer = this._lineBuffer;

			var metrics;
			for(var n = 0; n < numLines; n++) 
			{
				metrics = ctx.measureText(lineBuffer[n]);
				if(metrics.width > this._maxWidth) {
					this._maxWidth = metrics.width;
				}
			}
		}

		var posX = 0;
		var posY = 0;

		if(this._shadow) {
			this._maxWidth += this._shadowBlur * 2;
			posX += this._shadowBlur;
		}

		var fontHeight = (this._fontSize * 1.3);

		this._texture.resize(this._maxWidth, fontHeight * numLines);

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

		for(var n = 0; n < numLines; n++)
		{
			ctx.fillText(lineBuffer[n], posX, posY);

			if(this._outline) {
				ctx.strokeText(lineBuffer[n], posY, posY);
			}

			posY += fontHeight;
		}
	},

	calcLineBuffer: function(ctx)
	{
		var lineBuffer = [];

		var text = "";
		var prevText = "";
		var width = 0;
		var word, words, numWords, metrics, i;

		var numLines = this._lineBuffer.length;
		for(var n = 0; n < numLines; n++)
		{
			words = this._wordBuffer[n];
			numWords = words.length;

			if(numWords === 1) 
			{
				word = words[0];
				metrics = ctx.measureText(word);

				if(metrics.width > this._maxWidth) {
					this._maxWidth = metrics.width;
				}
				lineBuffer.push(word);
			}
			else
			{
				for(i = 0; i < numWords; i++) 
				{
					word = words[i];
					
					if(text) {
						prevText = text;
						text += " " + word;
					}
					else {
						text = word;
					}

					metrics = ctx.measureText(text);

					if((width + metrics.width) > this._limitWidth) 
					{
						if(!prevText) 
						{
							lineBuffer.push(word);

							if(metrics.width > this._maxWidth) {
								this._maxWidth = metrics.width;
							}

							text = "";
						}
						else
						{
							lineBuffer.push(prevText);

							if(width > this._maxWidth) {
								this._maxWidth = width;
							}								

							text = "";
							prevText = "";
							width = 0;

							if(i === (numWords - 1)) 
							{
								lineBuffer.push(word);

								metrics = ctx.measureText(text);
								if(metrics.width > this._maxWidth) {
									this._maxWidth = metrics.width;
								}
							}
						}

						continue;
					}
					else if(i === (numWords - 1)) 
					{
						lineBuffer.push(text);

						text = "";
						prevText = "";
						width = 0;

						if(metrics.width > this._maxWidth) {
							this._maxWidth = metrics.width;
						}							
					}
					else {
						width += metrics.width;
					}
				}
			}
		}	

		return lineBuffer;	
	},

	set text(text) 
	{ 
		if(text !== void(0))
		{
			if(typeof(text) === "number") {
				this._text = text + "";
				this._lineBuffer[0] = this._text;
			}
			else 
			{
				this._text = text;

				var newlineIndex = text.indexOf("\n");
				if(newlineIndex !== -1) {
					this._lineBuffer = text.split("\n");
				}
				else {
					this._lineBuffer[0] = this._text;
				}
			}
		}
		else {
			this._text = "";
			this._lineBuffer[0] = this._text;
		}

		if(this._limitWidth > 0) 
		{
			var numLines = this._lineBuffer.length;
			this._wordBuffer.length = numLines;
			for(var n = 0; n < numLines; n++) {
				this._wordBuffer[n] = this._lineBuffer[n].split(" ");
			}
		}
		
		this.updateTxt();
	},

	get text() { return this._text; },

	set font(font) 
	{
		var fontResource = meta.resources.fonts[font];
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

	set limitWidth(value) 
	{
		if(this._limitWidth === value) { return; }
		this._limitWidth = value;

		if(!this._wordBuffer) {
			this._wordBuffer = []
		}
		
		this.text = this._text;
	},

	get limitWidth() {
		return this._limitWidth;
	},

	//
	_bitmapFont: null,

	_text: "",
	_lineBuffer: null,
	_wordBuffer: null,

	_limitWidth: 0,
	_maxWidth: 0,

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
