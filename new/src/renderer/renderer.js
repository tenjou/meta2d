"use strict"

meta.renderer = 
{
	setup: function()
	{
		var gl = meta.engine.gl;

		this.gl = gl;
		this.bgColor = 0xdddddd;

		this.prepareVBO();

		gl.activeTexture(gl.TEXTURE0);

		gl.enable(gl.BLEND);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
		gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		var spriteShader = meta.new(meta.Shader, {
			id: "sprite",
			vertexShader: [
				"#define PI 3.1415926535897932384626433832795",

				"attribute vec3 vertexPos;",
				"attribute vec2 uvCoords;",

				"uniform mat4 modelViewMatrix;",
				"uniform mat4 projMatrix;",
				"uniform float angle;",

				"varying highp vec2 var_uvCoords;",

				"void main(void) {",
				"	float angleX = sin(angle);",
				"	float angleY = cos(angle);",
				"	vec2 rotatedPos = vec2(vertexPos.x * angleY + vertexPos.y * angleX, vertexPos.y * angleY - vertexPos.x * angleX);",
				"	gl_Position = projMatrix * modelViewMatrix * vec4(rotatedPos, vertexPos.z, 1.0);",
				"	var_uvCoords = uvCoords;",
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
		spriteShader.use();

		this.entities.length = 16;
		this.entitiesRemove.length = 8;

		meta.on("update", this.update, this);
	},

	prepareVBO: function()
	{
		var gl = meta.engine.gl;

		var indices = [
			0, 1, 2,
			0, 2, 3
		];

		var uvCoords = [
			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0,
		];

		this.vertices = new Float32Array(8);
		this.vbo = gl.createBuffer();

		this.uv = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoords), gl.STATIC_DRAW);

		this.indiceBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	},

	update: function(tDelta)
	{
		if(this.numEntitiesRemove > 0) 
		{
			for(var n = 0; n < this.numEntitiesRemove; n++) 
			{
				var entity = this.entitiesRemove[n];
				var index = this.entities.indexOf(entity);
				if(index === -1) {
					console.warn("(meta.renderer.update) Trying to remove entity that is not part of visible entities");
					continue;
				}

				this.numEntities--;
				this.entities[index] = this.entities[this.numEntities];
			}

			this.numEntitiesRemove = 0;
		}

		if(this.needSort) 
		{
			this.entities.sort(this.sortFunc);

			this.needSort = false;
			this.needRender = true;
		}
	},

	render: function()
	{
		var gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT);

		var projMatrix = new meta.Matrix4();
		projMatrix.ortho(0, meta.engine.width, meta.engine.height, 0, 0, 1);
		projMatrix.translate(-meta.camera.x, -meta.camera.y, 0);
		gl.uniformMatrix4fv(this.currShader.uniform.projMatrix, false, projMatrix.m);

		gl.uniform1i(this.currShader.uniform.texture, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.vertexAttribPointer(this.currShader.attrib.vertexPos, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv);
		gl.vertexAttribPointer(this.currShader.attrib.uvCoords, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);

		for(var n = 0; n < this.numEntities; n++)
		{
			var entity = this.entities[n];
			var texture = entity.texture;

			if(!texture) { return; }
			if(!texture.loaded) { return; }

			var minX = -texture.width * entity.$pivotX;
			var minY = -texture.height * entity.$pivotY;
			var maxX = minX + texture.width;
			var maxY = minY + texture.height;

			this.vertices[0] = minX;
			this.vertices[1] = minY;
			this.vertices[2] = maxX;
			this.vertices[3] = minY;
			this.vertices[4] = maxX;
			this.vertices[5] = maxY;
			this.vertices[6] = minX;
			this.vertices[7] = maxY;

			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);			

			gl.bindTexture(gl.TEXTURE_2D, entity.texture.instance);

			var modelViewMatrix = new meta.Matrix4();
			modelViewMatrix.translate(entity.$x, entity.$y, 0);

			gl.uniformMatrix4fv(this.currShader.uniform.modelViewMatrix, false, modelViewMatrix.m);
			gl.uniform1f(this.currShader.uniform.angle, entity.$angle);
			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}

		this.needRender = false;
	},

	sortFunc: function(a, b) {
		return a.totalZ - b.totalZ;
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
		if(entity.flags & entity.Flag.RENDERING) { return; }
		entity.flags |= entity.Flag.RENDERING;

		if(this.numEntities === this.entities.length) {
			this.entities.length += 8;
		}

		this.entities[this.numEntities++] = entity;
	},

	removeEntity: function(entity)
	{
		if((entity.flags & entity.Flag.RENDERING) === 0) { return; }
		entity.flags &= ~entity.Flag.RENDERING;

		if(this.numEntitiesRemove === this.entitiesRemove.length) {
			this.entitiesRemove.length += 8;
		}

		this.entitiesRemove[this.numEntitiesRemove++] = entity;
	},

	set bgColor(hex) 
	{
		if(this.$bgColor.getHex() === hex) { return; }

		this.$bgColor.setHex(hex);

		this.gl.clearColor(this.$bgColor.r, this.$bgColor.g, this.$bgColor.b, 1.0);
	},

	get color() {
		this.$bgColor;
	},

	//
	entities: [],
	numEntities: 0,

	entitiesRemove: [],
	numEntitiesRemove: 0,

	vbo: null,
	uv: null,
	indiceBuffer: null,

	$bgColor: new meta.Color(0, 0, 0),
	currShader: null,
};
