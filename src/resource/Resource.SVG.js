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
		if(this.fullWidth < 2 && this.fullHeight < 2) {
			this.resizeSilently(width + x, height + y);
			this.ctx.fillStyle = this._fillStyle;
		}

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
		if(this.fullWidth < 2 && this.fullHeight < 2) {
			this.resize(x2, y2);
			this.ctx.lineWidth = this._lineWidth;
			this.ctx.strokeStyle = this._strokeStyle;
		}		

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

		if(this.fullWidth < 2 && this.fullHeight < 2) 
		{
			if(offset) {
				this.resizeSilently(width + x + 1, height + y + 1);
			}
			else {
				this.resizeSilently(width + x, height + y);
			}
			
			this.ctx.fillStyle = this._fillStyle;
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
		if(this.fullWidth < 2 && this.fullHeight < 2) {
			var size = (radius + this._lineWidth) * 2;
			this.resize(size, size);
			this.ctx.fillStyle = this._fillStyle;
		}

		this.ctx.beginPath();
		this.ctx.arc(radius + this._lineWidth, radius + this._lineWidth, radius, 0, Math.PI * 2, false);
		this.ctx.closePath();
		this.ctx.fill();

		if(this._strokeStyle) {
			this.ctx.strokeStyle = this._strokeStyle;
			this.ctx.lineWidth = 2;
			this.ctx.stroke();
		}

		this.loaded = true;
	},

	/**
	 * Tile source texture on top.
	 * @param params {Object} Parameters.
	 * @param params.texture {Resource.Texture|String} Texture object or name of the texture in resources pool.
	 * @param params.x {Number=} Offset on x axis.
	 * @param params.y {Number=} Offset on y axis.
	 * @param params.width {Number=} Width of area to tile.
	 * @param params.height {Number=} Height of area to tile.
	 */
	tile: function(params, height, texture)
	{
		if(!params) {
			console.warn("[Resource.Texture.tile]:", "No parameters specified.");
			return;
		}

		if(typeof(params.texture) === "string") {
			params.texture = meta.resources.getTexture(params.texture);
		}

		if(!params.texture) {
			console.warn("[Resource.Texture.tile]:", "Undefined texture.");
			return;
		}

		var texture = params.texture;

		// If source texture is not yet loaded. Create chace and wait for it.
		if(!texture._loaded) 
		{
			if(!texture._isLoading) {
				texture.load();
			}

			this._loadCache = { name: "tile", data: params };
			this.loaded = false;
			texture.subscribe(this, this.onTextureCacheEvent);
			return;
		}

		var scope = meta;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.width = params.width || texture.fullWidth;
		params.height = params.height || texture.fullHeight;
		params.width *= scope.unitSize;
		params.height *= scope.unitSize;

		this.resize(params.width, params.height);

		if(params.center) {
			params.x += (this.fullWidth & (texture.fullWidth - 1)) / 2;
			params.y += (this.fullHeight & (texture.fullHeight - 1)) / 2;		
		}

		var ctx = this.ctx;
		var posX = params.x;
		var posY = params.y;
		var numX = Math.ceil(this.fullWidth / texture.fullWidth) || 1;
		var numY = Math.ceil(this.fullHeight/ texture.fullHeight) || 1;


		if(posX > 0) {
			numX += Math.ceil(posX / texture.fullWidth);
			posX -= texture.fullWidth;
		}
		if(posY > 0) {
			numY += Math.ceil(posY / texture.fullHeight);
			posY -= texture.fullHeight;
		}

		var origY = posY;

		for(var x = 0; x < numX; x++)
		{
			for(var y = 0; y < numY; y++) {
				ctx.drawImage(texture.image, posX, posY);
				posY += texture.trueHeight;
			}

			posX += texture.trueWidth;
			posY = origY;
		}

		this.loaded = true;
	},

	/**
	 * Stroke/fill lines.	 
	 */
	stroke: function(buffer)
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
		this.resizeSilently((maxX - minX + this._lineWidth), 
			maxY - minY + this._lineWidth);

		ctx.lineWidth = this._lineWidth;
		if(this._lineCap) {
			ctx.lineCap = this._lineCap;
		}
		if(this._lineDash) {
			ctx.setLineDash(this._lineDash);
		}

		ctx.beginPath();
		ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
		for(i = 2; i < numItems; i += 2) {
			ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
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

	border: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.strokeBorder]:", "No parameters specified.");
			return;
		}

		params.width = params.width || this.trueFullWidth;
		params.height = params.height || this.trueFullHeight;

		var lineWidth = 1;
		if(params.borderWidth) {
			lineWidth = params.borderWidth;
		}

		params.buffer = [ 0, 0, params.width - lineWidth, 0, params.width - lineWidth, 
			params.height - lineWidth, 0, params.height - lineWidth, 0, 0 ];

		this.stroke(params);
	},

	/**
	 * Fill texture with arc.
	 * @param params {Object} Parameters.
	 * @param [params.x=0] {Number=} Offset from the left.
	 * @param [params.y=0] {Number=} Offset from the top.
	 * @param params.color {Hex} Color of the filled arc.
	 * @param [params.borderColor="#000000"] {Hex=} Color of the filled rect.
	 * @param params.radius {Number=} Radius of arc.
	 * @param [params.startAngle=0] {Number=} Starting angle from where arch is being drawn from.
	 * @param [params.endAngle=Math.PI*2] {Number=} End angle to where arc form is drawn.
	 * @param [params.borderWidth=1] {Number=} Thickness of the line.
	 * @param [params.drawOver=false] {Boolean=} Flag - draw over previous texture content.
	 */
	arc: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.arc]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.radius = params.radius || 5;
		params.startAngle = params.startAngle || 0;
		params.endAngle = params.endAngle || (Math.PI * 2);
		params.borderWidth = params.borderWidth || 1;
		if(!params.color && !params.borderColor) {
			params.borderColor = params.borderColor || "#000000";
		}

		if(params.closePath === void(0)) {
			params.closePath = true;
		} else {
			params.closePath = params.closePath;
		}

		var size = params.radius * 2 + params.borderWidth;
		if(!params.drawOver) {
			this.resize(params.x + size + 1, params.y + size + 1);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.lineWidth = params.borderWidth;
		
		ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
		
		if(params.closePath) 
		{
			ctx.beginPath();
			ctx.arc(
				params.x + params.radius + (params.borderWidth / 2) + 0.5, 
				params.y + params.radius + (params.borderWidth / 2) + 0.5,
				params.radius, params.startAngle, params.endAngle, false);
			ctx.closePath();
		}
		else
		{
			ctx.arc(params.x + params.radius + (params.borderWidth / 2), params.y + params.radius + (params.borderWidth / 2),
				params.radius, params.startAngle, params.endAngle, false);
		}		

		if(params.color) {
			ctx.fillStyle = params.color;
			ctx.fill();
		} 

		if(params.borderColor) {
			ctx.strokeStyle = params.borderColor;
			ctx.stroke();
		}		

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	/**
	 * Draw a rounded rectangle. 
	 */
	roundRect: function(params, height, radius, color, borderWidth)
	{
		if(typeof(params) !== "object") 
		{
			this.roundRect({ 
				width: params, height: height,
				radius: radius,
				color: color,
				borderWidth: borderWidth
			});
			return;
		}		
		if(!params) {
			console.warn("[Resource.Texture.rect]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		var width = params.width || 1;
		var height = params.height || 1;
		params.color = params.color || "#0000000";
		var radius = params.radius || 1;
		var borderWidth = params.borderWidth || 3;

		if(!params.drawOver) {
			this.resize(width, height);
		}		

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}		

		ctx.strokeStyle = params.color;
		ctx.lineWidth = borderWidth;

		var halfWidth = Math.ceil(borderWidth / 2);

		if(borderWidth % 2 === 1)
		{
			ctx.save();
			ctx.translate(0.5, 0.5);
			ctx.beginPath();
			ctx.moveTo(halfWidth + radius, halfWidth);
			ctx.lineTo(width - halfWidth - radius, halfWidth);
			ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
			ctx.lineTo(width - halfWidth, height - halfWidth - radius);
			ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
			ctx.lineTo(halfWidth + radius, height - halfWidth);
			ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
			ctx.lineTo(halfWidth, radius + halfWidth);
			ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		else 
		{
			ctx.beginPath();
			ctx.moveTo(halfWidth + radius, halfWidth);
			ctx.lineTo(width - halfWidth - radius, halfWidth);
			ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
			ctx.lineTo(width - halfWidth, height - halfWidth - radius);
			ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
			ctx.lineTo(halfWidth + radius, height - halfWidth);
			ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
			ctx.lineTo(halfWidth, radius + halfWidth);
			ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
			ctx.closePath();
			ctx.stroke();			
		}

		if(params.fillColor) {
			ctx.fillStyle = params.fillColor;
			ctx.fill();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	bazier: function(color, path, params)
	{
		this.isLoaded = true;
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

		this.resize(width + this.lineWidth, height + this.lineWidth);

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

		// // Init.
		// if(typeof(params) === "number") 
		// {
		// 	this.grid({ cellWidth: params, cellHeight: cellHeight, 
		// 		numCellsX: numCellsX, numCellsY: numCellsY
		// 	});
		// 	return;
		// }

		// if(!params) {
		// 	console.warn("[Resource.Texture.grid]:", "No params specified.");
		// 	return;
		// }

		// var cellWidth = params.cellWidth || 1;
		// var cellHeight = params.cellHeight || 1;
		// var numCellsX = params.numCellsX || 1;
		// var numCellsY = params.numCellsY || 1;
		// params.x = params.x || 0;
		// params.y = params.y || 0;
		// params.color = params.color || "#000000";
		// params.borderWidth = params.borderWidth || 1;
		// params.drawOver = params.drawOver || false;

		// var width = params.x + (params.cellWidth * params.numCellsX) + 1;
		// var height = params.y + (params.cellHeight * params.numCellsY) + 1;	

		// if(!params.drawOver) {
		// 	this.resize(width, height);
		// }		

		// var ctx = this.ctx;	
		// if(this.textureType) {
		// 	this._createCachedImg();
		// 	ctx = this._cachedCtx;
		// }

		// // Rendering.
		// ctx.strokeStyle = params.color;
		// ctx.lineWidth = params.borderWidth;

		// ctx.save();
		// ctx.translate(0.5, 0.5);

		// for(var x = 0; x < (numCellsX + 1); x++) {
		// 	ctx.moveTo((x * cellHeight), 0);
		// 	ctx.lineTo((x * cellHeight), height);
		// }

		// for(var y = 0; y < (numCellsY + 1); y++) {
		// 	ctx.moveTo(0, (y * cellHeight));
		// 	ctx.lineTo(width, (y * cellHeight));
		// }

		// ctx.stroke();
		// ctx.restore();

		// // Update.
		// if(this.textureType) {
		// 	var gl = meta.ctx;
		// 	gl.bindTexture(gl.TEXTURE_2D, this.image);
		// 	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		// }

		// this.isLoaded = true;					
	},


	/**
	 * Callback used if ond to another texture.
	 * @param event {*} Event type.
	 * @param data {*} Event data.
	 */
	onTextureEvent: function(event, data)
	{
		if(event === Resource.Event.LOADED) {
			this.tile(data);
			data.unsubscribe(this);
		}
	},

	set lineWidth(value) {
		this._lineWidth = value;
		this.ctx.lineWidth = value;
	},

	get lineWidth() { return this._lineWidth; },

	set fillStyle(hex) {
		this._fillStyle = hex;
		this.ctx.fillStyle = hex;
	},

	get fillStyle() { return this._fillStyle; },

	set strokeStyle(hex) {
		this._strokeStyle = hex;
		this.ctx.strokeStyle = hex;
	},

	get strokeStyle() { return this._strokeStyle; },	

	//
	_lineWidth: 2,
	_lineCap: "",
	_lineDash: "",

	_fillStyle: "",
	_strokeStyle: ""
});
