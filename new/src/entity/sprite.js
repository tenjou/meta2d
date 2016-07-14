"use strict";

meta.class("meta.Sprite",
{
	init: function(params)
	{
		this.create(params);
	},

	create: function(params) 
	{
		this.loadParams(params);
	},

	remove: function() 
	{
		this.$x = this.$y = this.$z = 0;
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
		if(typeof texture === "string") {
			texture = meta.resources.getTexture(texture);
		}

		if(this.$texture) 
		{
			if(this.$texture.id === texture.id) { return; }

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
		console.log("event", event);
	},

	set shader(id)
	{
		if(this.$shader.id === id) { return; }

		if(this.$shader) {
			this.$shader.unwatch(this);
		}

		this.$shader = meta.resources.getShader(id);

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

	Flag: {
		REMOVED: 1 << 0,
		INSTANCE_ENABLED: 1 << 1,
		INSTANCE_VISIBLE: 1 << 2,
		ROOT: 1 << 3
	},

	//
	$view: null,
	parent: null,

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
	pivotY: 0
});
