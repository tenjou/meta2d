"use strict";

meta.class("meta.Sprite",
{
	init: function(params)
	{
		this.$volume = new meta.AABB(0, 0, 0, 0);
		this.create(params);
	},

	create: function(params) 
	{
		this.flags = 0;

		this.loadParams(params);
	},

	cleanup: function()
	{
		if(this.flags & this.Flag.REMOVED) { return; }
		this.flags |= this.Flag.REMOVED;

		this.$x = this.$y = this.$z = 0;
	},

	remove: function() 
	{
		if(this.$view) {
			this.$view.remove(this);
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

	position: function(x, y)
	{
		this.$x = 0;
		this.$y = 0;
		this.updatePosition();
	},

	move: function(deltaX, deltaY)
	{
		this.$x += deltaX;
		this.$y += deltaY;
		this.updatePosition();
	},

	updatePosition: function()
	{

	},

	updateZ: function()
	{

	},

	set x(value) {
		this.$x = value;
		this.updatePosition();
	},

	set y(value) {
		this.$y = value;
		this.updatePosition();
	},

	set z(value) {
		this.$z = value;
		this.updateZ();
	},

	get x() {
		return this.$x;
	},

	get y() {
		return this.$y;
	},

	get z() {
		return this.$z;
	},

	anchor: function(x, y)
	{

	},

	pivot: function(x, y)
	{

	},

	onClick: null,

	onPress: null,

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
			this.$volume.resize(this.$texture.width, this.$texture.height);
		}
	},

	set shader(id)
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
	$view: null,
	parent: null,
	$volume: null,

	flags: 0,

	$x: 0,
	$y: 0,
	$z: 0,
	$angle: null,
	$texture: null,
	$shader: null,

	anchorX: 0,
	anchorY: 0,
	pivotX: 0,
	pivotY: 0,

	$data: null
});
