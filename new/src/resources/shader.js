"use strict";

meta.class("meta.Shader", "meta.Resource",
{
	create: function(params)
	{
		this.loadParams(params);
		this.compile();
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
		meta.renderer.currShader = this;
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

        console.log("attribs", this.attrib)
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

        console.log("uniform", this.uniform)
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
	},

	get fragmentShader() {
		return this.$fragmentShader;
	},

	//
	attributre: null,
	uniform: null,

	$vertexShader: null,
	$fragmentShader: null,
});
