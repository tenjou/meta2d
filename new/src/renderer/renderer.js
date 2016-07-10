"use strict"

meta.renderer = 
{
	setup: function()
	{
		this.gl = meta.engine.gl;
		this.bgColor = "#000000FF";
	},

	render: function()
	{
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	},

	onResize: function()
	{
		this.gl.viewport(0, 0, meta.engine.width, meta.engine.height);
	},

	set bgColor(color) 
	{
		if(this.$bgColor === color) { return; }

		// If color does not contain an alpha:
		if(color.length === 7) {
			color += "FF";
		}

		this.$bgColor = color;
		var colorNumber = parseInt(color.slice(1), 16);

		var red = (colorNumber >> 24) / 0xff;
		var green = ((colorNumber >> 16) & 0xff) / 0xff;
		var blue = ((colorNumber >> 8) & 0xff) / 0xff;
		var alpha = (colorNumber & 0xff) / 0xff;

		this.gl.clearColor(red, green, blue, alpha);
	},

	get color() {
		this.$bgColor;
	},

	//
	$bgColor: null
};
