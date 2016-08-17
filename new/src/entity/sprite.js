"use strict";

meta.class("meta.Sprite",
{
	init: function(params)
	{
		this.volume = new meta.AABB(0, 0, 0, 0);
		this.create(params);
	},

	create: function(params) 
	{
		this.flags = 0;

		this.loadParams(params);

		if(!this.$shader) {
			this.$shader = meta.resources.get("shader", "sprite");
		}
	},

	cleanup: function()
	{
		if(this.flags & this.Flag.REMOVED) { return; }
		this.flags |= this.Flag.REMOVED;

		this.volume.reset();
	},

	remove: function() 
	{
		if(this.$layer) {
			this.$layer.remove(this);
		}
		else {
			this.cleanup();
		}
	},

	loadParams: function(params)
	{
		if(!params) { return; }

		if(typeof params === "string") {
			this.texture = params;
		}
		else if(params instanceof meta.Texture) {
			this.texture = params;
		}		
		else
		{
			for(var key in params) {
				this[key] = params[key];
			}
		}
	},

	render: function(gl, buffer)
	{
		if(!this.texture) { return; }
		if(!this.texture.loaded) { return; }

		buffer[0] = this.volume.minX;
		buffer[1] = this.volume.minY;
		buffer[2] = this.volume.maxX;
		buffer[3] = this.volume.minY;
		buffer[4] = this.volume.maxX;
		buffer[5] = this.volume.maxY;
		buffer[6] = this.volume.minX;
		buffer[7] = this.volume.maxY;
		
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);	

		gl.bindTexture(gl.TEXTURE_2D, this.texture.instance);

		gl.uniform1f(this.$shader.uniform.angle, this.$angle);

		var numTilesX = (this.volume.width / this.texture.width);
		gl.uniform1f(this.$shader.uniform.tilesX, numTilesX);

		var numTilesY = (this.volume.height / this.texture.height);
		gl.uniform1f(this.$shader.uniform.tilesY, numTilesY);

		var offsetX = (meta.camera.x % 256);
		
		if(offsetX !== 0) {
			offsetX = (1.0 / 256) * offsetX;
		}

		var offsetY = (meta.camera.y % 256);
		if(offsetY !== 0) {
			offsetY = (1.0 / 256) * offsetY;
		}		

		gl.uniform1f(this.$shader.uniform.offsetX, offsetX);
		gl.uniform1f(this.$shader.uniform.offsetY, offsetY);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	},

	position: function(x, y)
	{
		this.volume.position(x, y);
		this.updatePosition();
	},

	move: function(deltaX, deltaY)
	{
		this.volume.move(deltaX, deltaY);
		this.updatePosition();
	},

	updatePosition: function()
	{

	},

	updateZ: function()
	{
		this.totalZ = this.$z;
		meta.renderer.needSort = true;
	},

	set x(x) {
		this.volume.position(x, this.volume.y);
		this.updatePosition();
	},

	set y(y) {
		this.volume.position(this.volume.x, y);
		this.updatePosition();
	},

	get x() {
		return this.volume.x;
	},

	get y() {
		return this.volume.y;
	},

	set z(value) {
		this.$z = value;
		this.updateZ();
	},

	get z() {
		return this.$z;
	},

	set angle(degree) 
	{
		var newAngle = (degree * Math.PI) / 180.0;

		if(this.$angle === newAngle) { return; }
		this.$angle = newAngle;
	},

	set angleRad(angle) 
	{
		if(this.$angle === angle) { return; }
		this.$angle = angle;
	},

	get angle() { 
		return (this.$angle * 180.0) / Math.PI; 
	},

	get angleRad() {
		return this.$angle;
	},

	resize: function(width, height) {
		this.volume.resize(width, height);
		this.updateAnchor();
	},

	set width(width) 
	{
		if(this.volume.width === width) { return; }
		this.volume.resize(width, this.volume.height);
		this.updateAnchor();
	},

	set height(height) 
	{
		if(this.volume.height === height) { return; }
		this.volume.resize(this.volume.width, height);
		this.updateAnchor();
	},

	get width() {
		return this.volume.width;
	},

	get height() {
		return this.volume.height;
	},

	anchor: function(x, y)
	{
		this.$anchorX = x;
		this.$anchorY = y;
		this.updateAnchor();
	},

	set anchorX(x) 
	{
		if(this.$anchorX === x) { return; }
		this.$anchorX = x;
		this.updateAnchor();
	},

	set anchorY(y) 
	{
		if(this.$anchorY === y) { return; }
		this.$anchorY = y;
		this.updateAnchor();
	},

	get anchorX() {
		return this.$anchorX;
	},

	get anchorY() {
		return this.$anchorY;
	},

	updateAnchor: function() {

	},

	pivot: function(x, y)
	{
		if(this.$pivotX === x && this.$pivotY === y) { return; }
		this.$pivotX = x;
		this.$pivotY = y;
	},

	set pivotX(x) 
	{
		if(this.$pivotX === x) { return; }
		this.$pivotX = x;
	},

	set pivotY(y) 
	{
		if(this.$pivotY === y) { return; }
		this.$pivotY = y;
	},

	get pivotX() {
		return this.$pivotX;
	},

	get pivotY() {
		return this.$pivotY;
	},

	scale: function(x, y)
	{
		if(this.$scaleX === x && this.$scaleY === y) { return; }
		this.$scaleX = x;
		this.$scaleY = y;
	},

	set scaleX(x) 
	{
		if(this.$scaleX === x) { return; }
		this.$scaleX = x;
	},

	set scaleY(y)
	{
		if(this.$scaleY === y) { return; }
		this.$scaleY = y;
	},

	get scaleX() {
		return this.$scaleX;
	},

	get scaleY() {
		return this.$scaleY;
	},

	onClick: null,

	onPress: null,

	set layer(layer)
	{
		if(this.$layer) {
			this.$layer.remove(this);
		}

		this.$setLayer(layer);
	},

	get layer() {
		return this.$layer;
	},

	$setLayer: function(layer) 
	{
		this.$layer = layer;

		if(this.children) 
		{
			for(var n = 0; n < this.children.n++; n++) {
				this.children[n].$setLayer(layer);
			}
		}
	},

	set texture(texture)
	{
		if(typeof texture === "string") 
		{
			if(texture === "") {
				texture = null;
			}
			else {
				texture = meta.resources.getTexture(texture);
			}
		}

		if(this.$texture) 
		{
			if(texture && this.$texture.id === texture.id) { return; }

			this.$texture.unwatch(this);
		}

		this.$texture = texture;

		if(this.$texture) {
			this.$texture.watch(this.handleTexture, this);
		}
	},

	get texture() {
		return this.$texture;
	},

	handleTexture: function(event)
	{
		if(event === "loaded" || event === "updated") {
			this.updateFromTexture();
		}
	},

	updateFromTexture: function()
	{
		this.volume.resize(this.$texture.width, this.$texture.height);
	},

	set shader(shader)
	{
		if(typeof shader === "string") {
			shader = meta.resources.getShader(shader);
		}

		if(this.$shader) 
		{
			if(this.$shader.id === shader.id) { return; }

			this.$shader.unwatch(this);
		}

		this.$shader = shader;

		if(this.$shader) {
			this.$shader.watch(this.handleShader, this);
		}
	},

	get shader() {
		return this.$shader;
	},

	handleShader: function(event, data)
	{

	},

	set data(data)
	{
		if(this.$data === data) { return; }

		if(this.$data) {
			this.$data.unwatch(this.handleData, this);
		}

		this.$data = data;
		
		if(this.$data) 
		{
			var raw = data.raw;
			for(var key in raw) 
			{
				var value = this[key];
				var newValue = raw[key];

				if(value === undefined || value === newValue) { continue; }
				this[key] = raw[key];
			}
			
			this.$data.watch(this.handleData, this);
		}
	},

	get data() {
		return this.$data;
	},

	handleData: function(action, key, value, index, data)
	{
		switch(action)
		{
			case "set": 
			{
				if(this[key] === undefined) { return; }
				this[key] = value;
			} break;
		}
	},

	Flag: {
		REMOVE: 1 << 0,
		REMOVED: 1 << 1,
		INSTANCE_ENABLED: 1 << 2,
		INSTANCE_VISIBLE: 1 << 3,
		ROOT: 1 << 4,
		RENDERING: 1 << 5
	},

	//
	$layer: null,
	parent: null,
	children: null,
	volume: null,

	flags: 0,

	$z: 0,
	totalZ: 0,
	$angle: null,
	$texture: null,
	$shader: null,

	$scaleX: 1.0,
	$scaleY: 1.0,
	$anchorX: 0,
	$anchorY: 0,
	$pivotX: 0,
	$pivotY: 0,

	$data: null
});
