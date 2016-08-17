"use strict";

meta.class("meta.Tiling", "meta.Sprite",
{
	create: function(params) 
	{
		this.$shader = meta.resources.get("shader", "tiling");

		this._super(params);
	},

	cleanup: function()
	{
		this._super();

		if(this.$autoResize) {
			meta.off("resize", this.updateAutoResize, this);
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

		var width = this.texture.width;
		var height = this.texture.height;

		var numTilesX = (this.volume.width / width);
		gl.uniform1f(this.$shader.uniform.tilesX, numTilesX);

		var numTilesY = (this.volume.height / height);
		gl.uniform1f(this.$shader.uniform.tilesY, numTilesY);

		var offsetX = (meta.camera.x % width);
		
		if(offsetX !== 0) {
			offsetX = (1.0 / width) * offsetX;
		}

		var offsetY = (meta.camera.y % height);
		if(offsetY !== 0) {
			offsetY = (1.0 / height) * offsetY;
		}

		gl.uniform1f(this.$shader.uniform.offsetX, offsetX);
		gl.uniform1f(this.$shader.uniform.offsetY, offsetY);

		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	},

	updateFromTexture: function()
	{
		this._super();

		if(this.$autoResize) {
			this.updateAutoResize(meta.engine);
		}
	},

	set autoResize(value)
	{
		if(this.$autoResize === value) { return; }
		this.$autoResize = value;

		if(value) {
			meta.on("resize", this.updateAutoResize, this);
			this.updateAutoResize(meta.engine);
		}
		else {
			meta.off("resize", this.updateAutoResize, this);
		}
	},

	get autoResize() {
		return this.$autoResize;
	},

	updateAutoResize: function(engine) {
		this.resize(engine.width, engine.height);
	},

	//
	$autoResize: false
});
