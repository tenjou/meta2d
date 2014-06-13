"use strict";

/**
 * @class Entity.WebGLRenderer
 * @extends Entity.Controller
 * @memberof! <global>
 */
Entity.WebGLRenderer = Entity.Controller.extend
( /** @lends Entity.WebGLRenderer.prototype */ {

	init: function()
	{
		this._super();

		var gl = meta.ctx;

		this._worldTex = new Resource.Texture();
		this._worldTex.fillRect({
			color: "#7AA3CC",
			width: 1, height: 1
		});

		this._highlightTex = new Resource.Texture();
		this._highlightTex.fillRect({
			color: "#339933",
			width: 6, height: 6
		});		

		this._position = new Float32Array([ 0.0, 0.0 ]);
		this._center = new Float32Array([ 0.0, 0.0 ]);
		this._scale = new Float32Array([ 0.0, 0.0 ]);
		this.cameraPos = new Float32Array([ 0.0, 0.0 ]);

		var texCoord = [
			0.0, 0.0,
			1.0, 0.0,
			0.0, 1.0,
			1.0, 1.0 ];
		this.texCoord = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoord);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

		var lineIndices = [ 0, 1, 3, 2, 0 ];
		this._lineIndices = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), gl.STATIC_DRAW);

		this._frameCoord = new Float32Array(4);

		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.activeTexture(gl.TEXTURE0);
		gl.enable(gl.BLEND);		
	},

	ready: function() {
		meta.shader.bindBuffer2f("texCoord", this.texCoord);
	},

	render: function(tDelta)
	{
		var entity;
		var currNode = this.entities.first.next;
		var lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;
			if(entity.isNeedState) {
				entity.updateState();
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}
		}

		if(!this.isNeedRender) { return; }

		var scope = meta;
		var gl = scope.ctx;
		var shader = scope.shader;
		var camera = scope.camera;
		var texture;

		this.clearScreen();

		this.cameraPos[0] = camera._x | 0;
		this.cameraPos[1] = camera._y | 0;
		gl.uniform2fv(gl.getUniformLocation(shader.program, "cameraPos"), this.cameraPos);
		gl.uniform1f(gl.getUniformLocation(shader.program, "zoom"), meta.camera._zoom);
		gl.uniform1i(gl.getUniformLocation(shader.program, "sampler"), 0);

		currNode = this.entities.first.next;
		lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;
			if(!entity.isVisible || !entity.isLoaded || !entity.texture) { continue; }

			texture = entity._texture;
			shader.bindBuffer2f("vertexPos", texture.vbo);

			if(entity._flipX === 1.0) {
				this._position[0] = entity.volume.minX | 0;
			}
			else {
				this._position[0] = (entity.volume.minX + entity.volume.width) | 0;
			}
			if(entity._flipY === 1.0) {
				this._position[1] = entity.volume.minY | 0;
			}
			else {
				this._position[1] = (entity.volume.minY + entity.volume.height) | 0;
			}

			if(!entity.isChild) {
				this._center[0] = entity.volume.x + entity.pivotX;
				this._center[1] = entity.volume.y + entity.pivotY;
			}
			else {
				this._center[0] = entity._parent.childOffsetX;
				this._center[1] = entity._parent.childOffsetY;
			}

			this._scale[0] = entity._scaleX * entity._flipX;
			this._scale[1] = entity._scaleY * entity._flipY;

			this._frameCoord[0] = texture._x + ((entity.currFrame % entity._texture.numFramesX) * texture._xRatio);
			this._frameCoord[1] = texture._y + (Math.floor(entity.currFrame / entity._texture.numFramesX) * texture._yRatio);
			this._frameCoord[2] = texture._widthRatio;
			this._frameCoord[3] = texture._heightRatio;

			gl.uniform1f(gl.getUniformLocation(shader.program, "alpha"), entity._alpha);
			gl.uniform2fv(gl.getUniformLocation(shader.program, "pos"), this._position);
			gl.uniform2fv(gl.getUniformLocation(shader.program, "center"), this._center);
			gl.uniform2fv(gl.getUniformLocation(shader.program, "scale"), this._scale);
			gl.uniform4fv(gl.getUniformLocation(shader.program, "frameCoord"), this._frameCoord);
			gl.uniform1f(gl.getUniformLocation(shader.program, "angle"), entity._angleRad);

			if(texture.fromAtlas) {
				gl.bindTexture(gl.TEXTURE_2D, texture.ptr.image);
			}
			else {
				gl.bindTexture(gl.TEXTURE_2D, texture.image);
			}

			if(entity.ignoreZoom) {
				gl.uniform1f(gl.getUniformLocation(shader.program, "zoom"), 1.0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				gl.uniform1f(gl.getUniformLocation(shader.program, "zoom"), meta.camera._zoom);
			}
			else {
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}

			entity._isNeedDraw = false;
		}

		// Draw bounds.
		if(this.numShowBounds > 0 || this.showBounds)
		{
			gl.disable(gl.BLEND);
			gl.uniform1f(gl.getUniformLocation(shader.program, "alpha"), 1.0);

			currNode = this.entities.first.next;
			for(; currNode !== lastNode; currNode = currNode.next)
			{
				entity = currNode.entity;
				if((entity._showBounds || this.showBounds) && entity.enableDebug && entity.isVisible && entity.isLoaded)
				{
					if(entity._flipX === 1.0) {
						this._position[0] = entity.volume.minX | 0;
					}
					else {
						this._position[0] = (entity.volume.minX + entity.volume.width) | 0;
					}
					if(entity._flipY === 1.0) {
						this._position[1] = entity.volume.minY | 0;
					}
					else {
						this._position[1] = (entity.volume.minY + entity.volume.height) | 0;
					}

					if(!entity.isChild) {
						this._center[0] = entity.volume.x + entity.pivotX;
						this._center[1] = entity.volume.y + entity.pivotY;
					}
					else {
						this._center[0] = entity._parent.childOffsetX;
						this._center[1] = entity._parent.childOffsetY;
					}

					this._scale[0] = entity._scaleX * entity._flipX;
					this._scale[1] = entity._scaleY * entity._flipY;

					if(entity.isHighlight) {
						gl.bindTexture(gl.TEXTURE_2D, this._highlightTex.image);
					}
					else {
						gl.bindTexture(gl.TEXTURE_2D, this._centerTex.image);
					}					

					gl.uniform2fv(gl.getUniformLocation(shader.program, "pos"), this._position);
					gl.uniform2fv(gl.getUniformLocation(shader.program, "center"), this._center);
					gl.uniform2fv(gl.getUniformLocation(shader.program, "scale"), this._scale);
					gl.uniform1f(gl.getUniformLocation(shader.program, "angle"), entity._angleRad);
					shader.bindBuffer2f("vertexPos", entity.texture.vbo);

					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndices);
					gl.lineWidth(2.0);
					gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

					//
					shader.bindBuffer2f("vertexPos", this._centerTex.vbo);

					if(entity.isHighlight) {
						gl.bindTexture(gl.TEXTURE_2D, this._highlightTex.image);
					}
					else {
						gl.bindTexture(gl.TEXTURE_2D, this._centerTex.image);
					}

					this._position[0] = entity.volume.x + entity.pivotX - 3;
					this._position[1] = entity.volume.y + entity.pivotY - 3;
					this._scale[0] = 1.0;
					this._scale[1] = 1.0;

					gl.uniform2fv(gl.getUniformLocation(shader.program, "pos"), this._position);
					gl.uniform2fv(gl.getUniformLocation(shader.program, "scale"), this._scale);

					if(entity.ignoreZoom) {
						gl.uniform1f(gl.getUniformLocation(shader.program, "zoom"), 1.0);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
						gl.uniform1f(gl.getUniformLocation(shader.program, "zoom"), meta.camera._zoom);
					}					
					else {
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
					}
				}
			}

			gl.enable(gl.BLEND);
		}

		var world = meta.world;
		if(world.showBounds)
		{
			shader.bindBuffer2f("vertexPos", this._worldTex.vbo);
			gl.bindTexture(gl.TEXTURE_2D, this._worldTex.image);

			this._scale[0] = world.width;
			this._scale[1] = world.height;
			gl.uniform2fv(gl.getUniformLocation(shader.program, "scale"), this._scale);

			this._position[0] = 0;
			this._position[1] = 0;
			gl.uniform2fv(gl.getUniformLocation(shader.program, "pos"), this._position);

			this._center[0] = 0;
			this._center[1] = 0;
			gl.uniform2fv(gl.getUniformLocation(shader.program, "center"), this._center);

			gl.uniform1f(gl.getUniformLocation(shader.program, "angle"), 0.0);
			gl.uniform1f(gl.getUniformLocation(shader.program, "alpha"), 1.0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndices);
			gl.lineWidth(2.0);
			gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);

			if(world.haveGrid)
			{
				var numX = world.numGridX;
				var numY = world.numGridY;

				this._scale[0] = world.gridWidth;
				this._scale[1] = world.gridHeight;
				gl.uniform2fv(gl.getUniformLocation(shader.program, "scale"), this._scale);

				for(var y = 0; y < numY; y++)
				{
					for(var x = 0; x < numX; x++) {
						this._position[0] = (x * world.gridWidth) + world.gridX;
						this._position[1] = (y * world.gridHeight) + world.gridY;
						gl.uniform2fv(gl.getUniformLocation(shader.program, "pos"), this._position);
						gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);
					}
				}
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}

		this.isNeedRender = false;
	},


	clearScreen: function()
	{
		var gl = meta.ctx;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	},


	//
	_worldTex: null,
	_highlightTex: null,

	_position: null,
	_center: null,
	_scale: null,
	_frameCoord: null
});