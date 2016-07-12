"use strict"

var vertices = [
	1.0, 1.0, 0.0,
	-1.0, 1.0, 0.0,
	1.0, -1.0, 0.0,
	-1.0, -1.0, 0.0
];

var vbo = null;
var shader = null;

meta.renderer = 
{
	setup: function()
	{
		this.gl = meta.engine.gl;
		this.bgColor = "#000000FF";

		vbo = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.gl.viewport(0, 0, 640, 480);
	},

	render: function()
	{
		var gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var projMatrix = new meta.math.Matrix4();
		projMatrix.perspective(45, 640 / 480, 0.1, 100.0);

		var modelViewMatrix = new meta.math.Matrix4();
		modelViewMatrix.translate(0, 0, -6);
		projMatrix.m[14] = projMatrix.m[11];
		projMatrix.m[11] = -1;
		console.log(projMatrix.m);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(this.currShader.attrib.vertexPos, 3, gl.FLOAT, false, 0, 0);
		gl.uniformMatrix4fv(this.currShader.uniform.modelViewMatrix, false, modelViewMatrix.m);
		gl.uniformMatrix4fv(this.currShader.uniform.projMatrix, false, projMatrix.m);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);		
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
	$bgColor: null,
	currShader: null
};
