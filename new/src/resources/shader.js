"use strict";

meta.class("meta.Shader", "meta.Resource",
{
	cleanup: function()
	{
		var gl = meta.engine.gl;

		gl.deleteProgram(this.program);
		gl.deleteShader(this.$vertexShader);
		gl.deleteShader(this.$fragmentShader);

		this.program = null;
		this.$vertexShader = null;
		this.$fragmentShader = null;
	},

	compile: function()
	{
		if(!this.$vertexShader) { return; }
		if(!this.$fragmentShader) { return; }

		var gl = meta.engine.gl;

		this.program = gl.createProgram();
		gl.attachShader(this.program, this.$vertexShader);
		gl.attachShader(this.program, this.$fragmentShader);
		gl.linkProgram(this.program);

		if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)) 
		{
			console.warn("(meta.Shader.compile) Shader program failed to link: " + 
				gl.getShaderInfoLog(this.program));

			gl.deleteProgram(this.program);
			gl.deleteShader(this.$vertexShader);
			gl.deleteShader(this.$fragmentShader);
			this.program = null;
			this.$vertexShader = null;
			this.$fragmentShader = null;

			return;
		}

		this.loadAttribs();
		this.loadUniforms();
	},

	use: function() {
		meta.engine.gl.useProgram(this.program);
	},

	loadAttribs: function()
	{
		this.attrib = {};

		var gl = meta.engine.gl;

		var num = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		for(var n = 0; n < num; n++) {
			var attrib = gl.getActiveAttrib(this.program, n);
			var attribLoc = gl.getAttribLocation(this.program, attrib.name);
			gl.enableVertexAttribArray(attribLoc);
			this.attrib[attrib.name] = attribLoc;
		}
	},

	loadUniforms: function()
	{
		this.uniform = {};

		var gl = meta.engine.gl;

		var num = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		for(var n = 0; n < num; n++) {
			var uniform = gl.getActiveUniform(this.program, n);
			var name = uniform.name.replace("[0]", "");
			this.uniform[name] = gl.getUniformLocation(this.program, name);
		}
	},

	set vertexShader(src) 
	{
		var gl = meta.engine.gl;

		if(!this.$vertexShader) {
			this.$vertexShader = gl.createShader(gl.VERTEX_SHADER);
		}

		if(src instanceof Array) {
			src = src.join("\n");
		}

		gl.shaderSource(this.$vertexShader, src);
		gl.compileShader(this.$vertexShader);

		if(!gl.getShaderParameter(this.$vertexShader, gl.COMPILE_STATUS)) 
		{
			console.warn("(meta.Shader.vertexShader) [" + this.id + "]: " + 
				gl.getShaderInfoLog(this.$vertexShader));

			gl.deleteShader(this.$vertexShader);
			this.$vertexShader = null;
			return;
		}

		if(this.$fragmentShader) {
			this.compile();
		}
	},

	get vertexShader() {
		return this.$vertexShader;
	},

	set fragmentShader(src) 
	{
		var gl = meta.engine.gl;

		if(!this.$fragmentShader) {
			this.$fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		}

		if(src instanceof Array) {
			src = src.join("\n");
		}		

		gl.shaderSource(this.$fragmentShader, src);
		gl.compileShader(this.$fragmentShader);

		if(!gl.getShaderParameter(this.$fragmentShader, gl.COMPILE_STATUS)) 
		{
			console.warn("(meta.Shader.fragmentShader) [" + this.id + "]: " + 
				gl.getShaderInfoLog(this.$fragmentShader));

			gl.deleteShader(this.$fragmentShader);
			this.$fragmentShader = null;
			return;
		}

		if(this.$vertexShader) {
			this.compile();
		}		
	},

	get fragmentShader() {
		return this.$fragmentShader;
	},

	//
	type: "shader",

	attributre: null,
	uniform: null,

	$vertexShader: null,
	$fragmentShader: null,
});

meta.on("preload", function()
{
	meta.new(meta.Shader, {
		id: "sprite",
		vertexShader: [
			"attribute vec3 vertexPos;",
			"attribute vec2 uvCoords;",

			"uniform mat4 projMatrix;",
			"uniform float angle;",

			"varying highp vec2 var_uvCoords;",

			"void main(void) {",
			"	float angleX = sin(angle);",
			"	float angleY = cos(angle);",
			"	vec2 rotatedPos = vec2(vertexPos.x * angleY + vertexPos.y * angleX, vertexPos.y * angleY - vertexPos.x * angleX);",
			"	gl_Position = projMatrix * vec4(rotatedPos, vertexPos.z, 1.0);",
			"	var_uvCoords = vec2(uvCoords.s, uvCoords.t);",
			"}"		
		],
		fragmentShader: [
			"varying highp vec2 var_uvCoords;",

			"uniform sampler2D texture;",

			"void main(void) {",
			"	gl_FragColor = texture2D(texture, vec2(var_uvCoords.s, var_uvCoords.t));",
			"}"
		]
	});

	meta.new(meta.Shader, {
		id: "tiling",
		vertexShader: [
			"#define PI 3.1415926535897932384626433832795",

			"attribute vec3 vertexPos;",
			"attribute vec2 uvCoords;",

			"uniform mat4 projMatrix;",
			"uniform float tilesX;",
			"uniform float tilesY;",
			"uniform float offsetX;",
			"uniform float offsetY;",				

			"varying highp vec2 var_uvCoords;",

			"void main(void) {",
			"	gl_Position = projMatrix * vec4(vertexPos, 1.0);",
			"	var_uvCoords = vec2(uvCoords.s * tilesX + offsetX, uvCoords.t * tilesY + offsetY);",
			"}"		
		],
		fragmentShader: [
			"varying highp vec2 var_uvCoords;",

			"uniform sampler2D texture;",

			"void main(void) {",
			"	gl_FragColor = texture2D(texture, vec2(var_uvCoords.s, var_uvCoords.t));",
			"}"
		]
	});	
});