"use strict";

meta.class("meta.Sprite"
{
	init: function()
	{
		this.$position = new meta.vector2(0, 0);
	},

	create: function()
	{
		
	},

	remove: function()
	{

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
		if(this.$texture.id === id) { return; }

		if(this.$texture) {
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

	handleTexture: function(event, data)
	{

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
