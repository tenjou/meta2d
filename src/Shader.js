"use strict";

meta.shaders = {};

/**
 * WebGL GSLS shader object.
 * @constructor
 * @memberof! <global>
 */
meta.Shader = function()
{
	this.program = null;
	this.attrib = {};
	this.uniform = {};

	this._vertexShader = null;
	this._fragmentShader = null;
};

meta.Shader.prototype =
{
	compile: function()
	{
		var gl = meta.ctx;

		this.program = gl.createProgram();
		gl.attachShader(this.program, this._vertexShader);
		gl.attachShader(this.program, this._fragmentShader);
		gl.linkProgram(this.program);

		if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			console.error("[meta.Shader.compile]:", "Unable to initialize the shader program.");
			return false;
		}

		return true;
	},

	use: function() {
		meta.ctx.useProgram(this.program);
	},

	bindAttrib: function(name)
	{
		if(!name) {
			console.error("[meta.Shader.bindAttrib]:", "No name specified!");
			return;
		}

		var gl = meta.ctx;
		this.attrib[name] = gl.getAttribLocation(this.program, name);
		gl.enableVertexAttribArray(this.attrib[name]);
	},

	bindBuffer2f: function(name, buffer)
	{
		var gl = meta.ctx;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(this.attrib[name], 2, gl.FLOAT, false, 0, 0);
	},

	bindBuffer3f: function(name, buffer)
	{
		var gl = meta.ctx;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(this.attrib[name], 3, gl.FLOAT, false, 0, 0);
	},

	uniformMatrix: function(name, matrix)
	{
		var gl = meta.ctx;

		var uniform = this.uniform[name];
		if(!uniform) {
			uniform = gl.getUniformLocation(this.program, name);
			this.uniform[name] = uniform;
		}

		gl.uniformMatrix4fv(uniform, false, matrix.m);
	},


	set vertexShader(value)
	{
		var gl = meta.ctx;

		this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(this._vertexShader, value);
		gl.compileShader(this._vertexShader);

		if(!gl.getShaderParameter(this._vertexShader, gl.COMPILE_STATUS))
		{
			console.error("[meta.Shader.vetexShader]:", gl.getShaderInfoLog(this._vertexShader));
		}
	},

	get vertexShader() {
		return this._vertexShader;
	},


	set fragmentShader(value)
	{
		var gl = meta.ctx;

		this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(this._fragmentShader, value);
		gl.compileShader(this._fragmentShader);

		if(!gl.getShaderParameter(this._fragmentShader, gl.COMPILE_STATUS))
		{
			console.error("[meta.Shader.fragmentShader]:", "An error occurred compiling the shaders: " +
				gl.getShaderInfoLog(this._fragmentShader));
		}
	},

	get fragmentShader() {
		return this._fragmentShader;
	}
};

/**
 * Set shader by name.
 * @param name {string} Name of shader.
 * @returns {meta.Shader|null}
 */
meta.setShader = function(name)
{
	if(!name) {
		console.error("[meta.setShader]:", "No name specified.");
		return null;
	}

	var shader = meta.shaders[name];
	if(!shader) {
		console.error("[meta.setShader]:", "No shader found with a name: " + name);
		return null;
	}

	meta.shader = shader;
	shader.use();

	return shader;
};

/**
 * Get shader by name.
 * @param name {string} Name of shader.
 * @returns {meta.Shader|null}
 */
meta.getShader = function(name)
{
	if(!name) {
		console.error("[meta.getShader]:", "No name specified.");
		return null;
	}

	var shader = meta.shaders[name];
	if(!shader) {
		console.error("[meta.getShader]:", "No shader found with a name: " + name);
		return null;
	}

	return shader;
};