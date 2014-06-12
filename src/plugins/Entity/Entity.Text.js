"use strict";

Entity.Text = Entity.Geometry.extend
({
	init: function(obj)
	{
		this.texture = new Resource.Texture();
		this._texture.resize(this._fontSize, this._fontSize);
	},


	setText: function(text)
	{
		this._text = text;

		var ctx;
		if(this._texture.textureType === Resource.TextureType.WEBGL) {
			ctx = this._texture._tmpCtx;
		}
		else {
			ctx = this._texture.ctx;
		}

		ctx.font = this._style + " " + this._fontSizePx + " " + this._font;

		var metrics = ctx.measureText(this._text);
		var width = metrics.width + (this.outlineWidth * 2);
		this.resize(width, this._fontSize * 1.2);

		if(this._texture.textureType === Resource.TextureType.WEBGL) {
			this._texture._tmpImg.width = width;
			this._texture._tmpImg.height = this._fontSize * 1.2;
		}

		// Redraw cached texture.
		ctx.clearRect(0, 0, this.volume.width, this.volume.height);
		ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
		ctx.fillStyle = this._color;
		ctx.textBaseline = "top";

		ctx.fillText(text, this.outlineWidth, 0);

		if(this.isOutline) {
			ctx.lineWidth = this._outlineWidth;
			ctx.strokeStyle = this._outlineColor;
			ctx.strokeText(text, this.outlineWidth, 0);
		}

		if(this._texture.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this._texture.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._texture._tmpImg);
		}

		if(!this._texture._isLoaded) {
			this._texture.isLoaded = true;
		}

		this.isNeedDraw = true;
	},

	resize: function(width, height)
	{
		width = width || 1;
		height = height || this.volume.height;

		this._texture.resize(width, height);
	},

	setFont: function(font) {
		this._font = font;
		this.setText(this._text);
	},

	setSize: function(size) {
		this._fontSize = size;
		this._fontSizePx = size + "px";
		this.setText(this._text);
	},

	setColor: function(color) {
		this._color = color;
		this.setText(this._text);
	},

	setOutlineColor: function(color) {
		this._outlineColor = color;
		this.isOutline = true;
	},

	setOutlineWidth: function(width)
	{
		this._outlineWidth = width;
		if(this._isOutline) {
			this.setText(this._text);
		}
	},

	setStyle: function(style) {
		this._style = style;
		this.setText(this._text);
	},


	set text(text) { this.setText(text); },
	get text() { return this._text; },

	set font(font) { this.setFont(font); },
	get font() { return this._font; },

	set size(size) { this.setSize(size); },
	get size() { return this._fontSize; },

	set color(color) { this.setColor(color); },
	get color() { return this._color; },

	set outlineColor(color) { this.setOutlineColor(color); },
	get outlineColor() { return this._outlineColor; },

	set outlineWidth(width) { this.setOutlineWidth(width); },
	get outlineWidth() { return this._outlineWidth; },

	set style(style) { this.setStyle(style); },
	get style() { return this._style; },

	set isOutline(value)
	{
		if(this._isOutline === value) { return; }
		this._isOutline = value;
		this.setText(this._text);
	},

	get isOutline() { return this._isOutline; },


	//
	_text: "",
	_font: "Arial",
	_fontSize: 18,
	_fontSizePx: "18px",
	_color: "#000000",
	_outlineColor: "#ffffff",
	_outlineWidth: 1,
	_style: "",

	_isOutline: false
});