"use strict"

var vertices = [
	0, 0,
	200, 0,
	200, 200,
	0, 200
];

var indices = [
	0, 1, 2,
	0, 2, 3
];

var uvCoords = [
  0.0,  0.0,
  1.0,  0.0,
  1.0,  1.0,
  0.0,  1.0,
];

var vbo = null;
var uv, indiceBuffer;
var texture;

meta.renderer = 
{
	setup: function()
	{
		var gl = meta.engine.gl;

		this.gl = gl;
		this.bgColor = "#000000FF";

		vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		uv = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uv);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);

		indiceBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		gl.activeTexture(gl.TEXTURE0);
	},

	render: function()
	{
		var gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var projMatrix = new meta.math.Matrix4();
		projMatrix.ortho(0, meta.engine.width, meta.engine.height, 0, 0, 1);
		gl.uniformMatrix4fv(this.currShader.uniform.projMatrix, false, projMatrix.m);

		if(!texture.loaded) { return; }

		gl.bindTexture(gl.TEXTURE_2D, texture.instance);
		gl.uniform1i(this.currShader.uniform.texture, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(this.currShader.attrib.vertexPos, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, uv);
		gl.vertexAttribPointer(this.currShader.attrib.uvCoords, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);

		for(var n = 0; n < this.entities.length; n++)
		{
			var entity = this.entities[n];

			var modelViewMatrix = new meta.math.Matrix4();
			modelViewMatrix.translate(entity.$x, entity.$y, 0);

			gl.uniformMatrix4fv(this.currShader.uniform.modelViewMatrix, false, modelViewMatrix.m);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}
	},

	onResize: function()
	{
		this.gl.viewport(0, 0, meta.engine.width, meta.engine.height);
	},

	addEntities: function(entities)
	{
		for(var n = 0; n < entities.length; n++) {
			this.addEntity(entities[n]);
		}
	},

	removeEntities: function(entities)
	{
		for(var n = 0; n < entities.length; n++) {
			this.removeEntity(entities[n]);
		}
	},

	addEntity: function(entity)
	{
		this.entities.push(entity);
	},

	removeEntity: function(entity)
	{

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
	entities: [],
	entitiesRemove: [],

	$bgColor: null,
	currShader: null,
};
