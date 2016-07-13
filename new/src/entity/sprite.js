"use strict";

meta.class("meta.Sprite",
{
	init: function(params)
	{
		this.$position = new meta.math.Vector2(0, 0);
		this.create(params);
	},

	create: function(params) 
	{
		this.loadParams(params);
	},

	remove: function() 
	{
		this.$position.set(0, 0);
	},

	loadParams: function(params)
	{
		if(!params) { return; }

		if(typeof params === "string") {
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
		this.$position(x, y);
		this.updatePosition();
	},

	updatePosition: function()
	{

	},

	anchor: function(x, y)
	{

	},

	pivot: function(x, y)
	{

	},

	onClick: null,

	onPress: null,

	set texture(id)
	{
		if(this.$texture) 
		{
			if(this.$texture.id === id) { return; }

			this.$texture.unwatch(this);
		}

		this.$texture = meta.resources.getTexture(id);

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

	},

	//
	$poolIndex: -1,
	$flags: 0,

	$position: null,
	$angle: null,
	$texture: null,
	$shader: null,

	anchorX: 0,
	anchorY: 0,
	pivotX: 0,
	pivotY: 0
});
