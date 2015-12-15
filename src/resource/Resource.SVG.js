"use strict";

meta.class("Resource.SVG", "Resource.Texture", 
{
	/**
	 * Fill texture with color.
	 * @param x {number}
	 * @param y {number}
	 * @param width {number}
	 * @param height {number}
	 */
	fillRect: function(x, y, width, height) 
	{
		if((this.flags & this.TextureFlag.RESIZED) === 0) {
			this.resizeSilently(width + x, height + y);
		}

		this.ctx.fillStyle = this._fillStyle;
		this.ctx.fillRect(x, y, width, height);

		this.loaded = true;
	},

	/**
	 * Draw a line
	 * @param x1 {number}
	 * @param y1 {number}
	 * @param x2 {number}
	 * @param y2 {number}
	 */
	line: function(x1, y1, x2, y2)
	{
		if((this.flags & this.TextureFlag.RESIZED) === 0) 
		{
			var minX, maxX, minY, maxY;

			if(x1 < x2) {
				minX = x1;
				maxX = x2;
			}
			else {
				minX = x2;
				maxX = x1;
			}

			if(y1 < y2) {
				minY = y1;
				maxY = y2;
			}
			else {
				minY = y2;
				maxY = y1;
			}

			this.resizeSilently(maxX, maxY);
		}	

		this.ctx.strokeStyle = this._strokeStyle;
		this.ctx.lineWidth = this._lineWidth;

		this.ctx.beginPath();
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.stroke();

		this.loaded = true;
	},

	rect: function(x, y, width, height)
	{
		var offset;
		if(this._lineWidth % 2 === 1) {
			offset = 0.5;
		}
		else {
			offset = 0;
		}

		if((this.flags & this.TextureFlag.RESIZED) === 0) 
		{
			if(offset) {
				this.resizeSilently(width + x + 1, height + y + 1);
			}
			else {
				this.resizeSilently(width + x, height + y);
			}
		}

		this.ctx.save();
		this.ctx.translate(offset, offset);
		this.ctx.beginPath();
		this.ctx.rect(x, y, width, height);

		if(this._fillStyle) {
			this.ctx.fillStyle = this._fillStyle;
			this.ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.stroke();			
		}

		this.ctx.restore();

		this.loaded = true;		
	},

	/**
	 * circle
	 * @param radius {number}
	 */	
	circle: function(radius)
	{
		var offset = this._lineWidth;
		var size = (radius + offset) * 2;

		if((this.flags & this.TextureFlag.RESIZED) === 0) {
			this.resizeSilently(size, size);
		}
		
		this.ctx.beginPath();
		this.ctx.arc(radius + offset, radius + offset, radius, 0, Math.PI * 2, false);
		this.ctx.closePath();

		if(this._fillStyle) {
			this.ctx.fillStyle = this._fillStyle;
			this.ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.stroke();			
		}

		this.loaded = true;
	},

	/**
	 * Tile source texture on top.
	 */
	tileAuto: function(texture, center, offsetX, offsetY)
	{
		if(typeof(texture) === "string") {
			var newTexture = meta.resources.textures[texture];
			if(!newTexture) {
				console.warn("(Resource.Texture.tileAuto): Could not get texture with name: " + texture);
				return;							
			}
			texture = newTexture;
		}
		else if(!texture) {
			console.warn("(Resource.Texture.tileAuto): Invalid texture");
			return;
		}

		// If tiling texture is not loaded yet - wait for it:
		if(!texture._loaded) 
		{
			this.loaded = false;

			var self = this;
			texture.subscribe(function(data, event) {
				self.tileAuto(texture, center, offsetX, offsetY);
			}, this);
			return;
		}

		offsetX = offsetX || 0;
		offsetY = offsetY || 0;

		var numX = Math.ceil(this.fullWidth / texture.fullWidth) || 1;
		var numY = Math.ceil(this.fullHeight/ texture.fullHeight) || 1;	
		var textureWidth = numX * (texture.fullWidth + offsetX) + offsetX;
		var textureHeight = numY * (texture.fullHeight + offsetY) + offsetY;	

		var textureOffsetX = offsetX;
		var textureOffsetY = offsetY;

		if(center) {
			textureOffsetX = -(textureWidth - this.fullWidth) * 0.5;
			textureOffsetY = -(textureHeight - this.fullHeight) * 0.5;			
		}

		var posX = textureOffsetX;
		var posY = textureOffsetY;
		for(var x = 0; x < numX; x++)
		{
			for(var y = 0; y < numY; y++) {
				this.ctx.drawImage(texture.canvas, posX, posY);
				posY += texture.frameHeight + offsetY;
			}

			posX += texture.frameWidth + offsetX;
			posY = textureOffsetY;
		}

		this.loaded = true;	
	},

	tile: function(texture, numX, numY, offsetX, offsetY)
	{
		if(typeof(texture) === "string") {
			var newTexture = meta.resources.textures[texture];
			if(!newTexture) {
				console.warn("(Resource.Texture.tile): Could not get texture with name: " + texture);
				return;							
			}
			texture = newTexture;
		}
		else if(!texture) {
			console.warn("(Resource.Texture.tile): Invalid texture");
			return;
		}

		// If tiling texture is not loaded yet - wait for it:
		if(!texture._loaded) 
		{
			this.loaded = false;

			var self = this;
			texture.subscribe(function(data, event) {
				self.tile(data, numX, numY, offsetX, offsetY);
			}, this);
			return;
		}

		var textureWidth = numX * (texture.fullWidth + offsetX) + offsetX;
		var textureHeight = numY * (texture.fullHeight + offsetY) + offsetY;

		this.resizeSilently(textureWidth, textureHeight);

		var textureOffsetX = offsetX;
		var textureOffsetY = offsetY;
		var posX = textureOffsetX;
		var posY = textureOffsetY;
		for(var x = 0; x < numX; x++)
		{
			for(var y = 0; y < numY; y++) {
				this.ctx.drawImage(texture.canvas, posX, posY);
				posY += texture.frameHeight + offsetY;
			}

			posX += texture.frameWidth + offsetX;
			posY = textureOffsetY;
		}

		this.loaded = true;
	},

	shape: function(buffer)
	{	
		var scope = meta;	
		var unitSize = 1;

		// Calculate bounds.
		var minX = Number.POSITIVE_INFINITY, minY = minX, maxX = Number.NEGATIVE_INFINITY, maxY = maxX;

		var item, i, x, y;
		var numItems = buffer.length;
		for(i = 0; i < numItems; i += 2)
		{
			x = buffer[i] * unitSize | 0; 
			y = buffer[i + 1] * unitSize | 0;

			if(x < minX) { minX = x; }
			if(y < minY) { minY = y; }
			if(x > maxX) { maxX = x; }
			if(y > maxY) { maxY = y; }

			buffer[i] = x;
			buffer[i + 1] = y;
		}

		if(minX > 0) { minX = 0; }
		if(minY > 0) { minY = 0; }

		var ctx = this.ctx;
		var halfLineWidth = this._lineWidth / 2;
		var offsetX = -minX + halfLineWidth;
		var offsetY = -minY + halfLineWidth;

		if((this.flags & this.TextureFlag.RESIZED) === 0) 
		{
			this.resizeSilently((maxX - minX + this._lineWidth), 
						maxY - minY + this._lineWidth);
		}

		ctx.lineWidth = this._lineWidth;
		if(this._lineCap) {
			ctx.lineCap = this._lineCap;
		}
		if(this._lineDash) {
			ctx.setLineDash(this._lineDash);
		}

		ctx.translate(0.5, 0.5);
		ctx.beginPath();
		ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
		for(i = 2; i < numItems; i += 2) {
			ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
		}

		if(this.closePath) {
			ctx.closePath();
		}

		if(this._fillStyle) {
			this.ctx.fillStyle = this._fillStyle;
			this.ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.stroke();			
		}

		this.loaded = true;
	},

	/**
	 * Fill texture with arc.
	 */
	arc: function(radius, startAngle, endAngle, counterClockwise)
	{
		if((this.flags & this.TextureFlag.RESIZED) === 0) {
			var size = (radius + this._lineWidth) * 2;
			this.resizeSilently(size, size);
		}

		this.ctx.beginPath();
		this.ctx.arc(radius + this._lineWidth, radius + this._lineWidth, radius, startAngle, endAngle, false);

		if(this.closePath) {
			this.ctx.closePath();
		}

		if(this._fillStyle) {
			this.ctx.fillStyle = this._fillStyle;
			this.ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.stroke();			
		}

		this.loaded = true;
	},

	/**
	 * Draw a rounded rectangle. 
	 */
	roundRect: function(width, height, radius)
	{
		var offset;
		if(this._lineWidth % 2 === 1) {
			offset = 0.5;
		}
		else {
			offset = 0;
		}

		if((this.flags & this.TextureFlag.RESIZED) === 0) 
		{
			if(offset) {
				this.resizeSilently(width + 1, height + 1);
			}
			else {
				this.resizeSilently(width, height);
			}
		}

		var halfWidth = Math.ceil(this._lineWidth / 2);

		this.ctx.save();
		this.ctx.translate(offset, offset);
		this.ctx.beginPath();
		this.ctx.moveTo(halfWidth + radius, halfWidth);
		this.ctx.lineTo(width - halfWidth - radius, halfWidth);
		this.ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
		this.ctx.lineTo(width - halfWidth, height - halfWidth - radius);
		this.ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
		this.ctx.lineTo(halfWidth + radius, height - halfWidth);
		this.ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
		this.ctx.lineTo(halfWidth, radius + halfWidth);
		this.ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
		this.ctx.closePath();

		if(this._fillStyle) {
			this.ctx.fillStyle = this._fillStyle;
			this.ctx.fill();
		}

		if(this._strokeStyle || !this._fillStyle) {
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.stroke();			
		}

		this.ctx.restore();

		this.loaded = true;			
	},

	gradient: function(buffer)
	{
		var gradient = this.ctx.createLinearGradient(0, 0, 0, this.fullHeight);

		var numStops = buffer.length;
		for(var n = 0; n < numStops; n += 2) {
			gradient.addColorStop(buffer[n], buffer[n + 1]);
		}

		this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.fullWidth, this.fullHeight);

		this.loaded = true;
	},

	grid: function(numX, numY, sizeX, sizeY)
	{
		var width = numX * sizeX;
		var height = numY * sizeY;

		if((this.flags & this.TextureFlag.RESIZED) === 0) {
			this.resizeSilently(width + this.lineWidth, height + this.lineWidth);
		}

		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.lineWidth;

		var lineOffset = this.lineWidth * 0.5;
		this.ctx.save();
		this.ctx.translate(lineOffset, lineOffset);
		
		var offset = 0;
		for(var x = 0; x <= numX; x++) {
			this.ctx.moveTo(offset, 0);
			this.ctx.lineTo(offset, height);
			offset += sizeX;
		}
		offset = 0;
		for(var y = 0; y <= numY; y++) {
			this.ctx.moveTo(-lineOffset, offset);
			this.ctx.lineTo(width + lineOffset, offset);
			offset += sizeY;
		}		

		this.ctx.stroke();
		this.ctx.restore();

		this.loaded = true;				
	},

	set lineWidth(value) {
		this._lineWidth = value;
	},

	get lineWidth() { return this._lineWidth; },

	set fillStyle(hex) {
		this._fillStyle = hex;
	},

	get fillStyle() { return this._fillStyle; },

	set strokeStyle(hex) {
		this._strokeStyle = hex;
	},

	get strokeStyle() { return this._strokeStyle; },

	Cache: function(name, data) {
		this.name = name;
		this.data = data;
	},

	//
	_lineWidth: 2,
	_lineCap: "",
	_lineDash: "",

	_fillStyle: "",
	_strokeStyle: "",

	closePath: false
});
