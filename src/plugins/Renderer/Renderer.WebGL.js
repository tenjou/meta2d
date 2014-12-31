"use strict";

var Renderer = {};

/**
 * @class Entity.WebGLRenderer
 * @extends Entity.Controller
 * @memberof! <global>
 */
Renderer.WebGL = Entity.Controller.extend
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

		var shader = meta.shader;
		this.locCameraPos = gl.getUniformLocation(shader.program, "cameraPos");
		this.locZoom = gl.getUniformLocation(shader.program, "zoom");
		this.locSampler = gl.getUniformLocation(shader.program, "sampler");
		this.locAlpha = gl.getUniformLocation(shader.program, "alpha");
		this.locPos = gl.getUniformLocation(shader.program, "pos");
		this.locCenter = gl.getUniformLocation(shader.program, "center");
		this.locScale = gl.getUniformLocation(shader.program, "scale");
		this.locFrameCoord = gl.getUniformLocation(shader.program, "frameCoord");
		this.locAngle = gl.getUniformLocation(shader.program, "angle");	
	},

	ready: function() {
		meta.shader.bindBuffer2f("texCoord", this.texCoord);
	},

	render: function(tDelta)
	{
		this.updateFlag |= 2;

		var entity, i;
		for(i = 0; i < this.numEntities; i++)
		{
			entity = this.entities[i];
			
			if(entity.isNeedStyle) {
				entity._style.update(entity);
			}
			if(entity._texture && entity.isAnimating) {
				entity._updateAnim(tDelta);
			}
		}

		if(!this.isNeedRender) { 
			this.updateFlag &= ~2;
			return; 
		}

		var scope = meta;
		var gl = scope.ctx;
		var shader = scope.shader;
		var camera = scope.camera;
		var unitSize = scope.unitSize;
		var texture;
		var clipMinX, clipMinY, clipMaxX, clipMaxY;

		this.clearScreen();		

		this.cameraPos[0] = camera._x * meta.unitSize | 0;
		this.cameraPos[1] = camera._y * meta.unitSize | 0;
		gl.uniform2fv(this.locCameraPos, this.cameraPos);
		gl.uniform1f(this.locZoom, meta.camera._zoom * meta.unitRatio);
		gl.uniform1i(this.locSampler, 0);

		for(i = 0; i < this.numEntities; i++)
		{
			entity = this.entities[i];

			if(!entity.isVisible || !entity.isLoaded || !entity.texture) { continue; }

			texture = entity._texture;
			shader.bindBuffer2f("vertexPos", texture.vbo);

			// Clipping.
			if(this._clipVolume !== entity.clipVolume)
			{
				if(entity.clipVolume) 
				{
					if(!this._clipVolume) {
						gl.enable(gl.SCISSOR_TEST);
					}

					//
					this._clipVolume = entity.clipVolume;
					clipMinX = (this._clipVolume.minX + camera._x) * camera._zoom;
					clipMaxX = (this._clipVolume.maxX + camera._x) * camera._zoom;
					clipMinY = (camera.volume.height - (this._clipVolume.maxY + camera._y)) * camera._zoom;
					clipMaxY = (camera.volume.height - (this._clipVolume.minY + camera._y)) * camera._zoom;

					gl.scissor(clipMinX | 0, clipMinY | 0, Math.ceil(clipMaxX - clipMinX), Math.ceil(clipMaxY - clipMinY));									
				}
				else {
					gl.disable(gl.SCISSOR_TEST);
					this._clipVolume = null;
				}
			}

			// Flip.
			if(entity._flipX === 1.0) {
				this._position[0] = entity.volume.minX * unitSize | 0;
			}
			else {
				this._position[0] = (entity.volume.minX + entity.volume.width) * unitSize | 0;
			}
			if(entity._flipY === 1.0) {
				this._position[1] = entity.volume.minY * unitSize | 0;
			}
			else {
				this._position[1] = (entity.volume.minY + entity.volume.height) * unitSize | 0;
			}

			this._center[0] = (entity.volume.x - entity.pivotX) * unitSize;
			this._center[1] = (entity.volume.y - entity.pivotY) * unitSize;
			this._scale[0] = entity.totalScaleX * entity._flipX;
			this._scale[1] = entity.totalScaleY * entity._flipY;

			this._frameCoord[0] = texture._x + ((entity.currFrame % entity._texture.numFramesX) * texture._xRatio);
			this._frameCoord[1] = texture._y + (Math.floor(entity.currFrame / entity._texture.numFramesX) * texture._yRatio);
			this._frameCoord[2] = texture._widthRatio;
			this._frameCoord[3] = texture._heightRatio;

			gl.uniform1f(this.locAlpha, entity.totalAlpha);
			gl.uniform2fv(this.locPos, this._position);
			gl.uniform2fv(this.locCenter, this._center);
			gl.uniform2fv(this.locScale, this._scale);
			gl.uniform4fv(this.locFrameCoord, this._frameCoord);
			gl.uniform1f(this.locAngle, entity.totalAngleRad);

			if(texture.fromAtlas) {
				gl.bindTexture(gl.TEXTURE_2D, texture.ptr.image);
			}
			else {
				gl.bindTexture(gl.TEXTURE_2D, texture.image);
			}

			if(entity.ignoreZoom) {
				gl.uniform1f(this.locZoom, 1.0);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				gl.uniform1f(this.locZoom, meta.camera._zoom);
			}
			else {
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}

			entity._isNeedDraw = false;
		}

		if(this._clipVolume) {
			gl.disable(gl.SCISSOR_TEST);
		}

		// Draw bounds.
		if(this.numShowBounds > 0 || this.showBounds)
		{
			gl.disable(gl.BLEND);
			gl.uniform1f(this.locAlpha, 1.0);
			gl.lineWidth(2.0);

			for(i = 0; i < this.numEntities; i++)
			{
				entity = this.entities[i];
				if((entity.showBounds || this.showBounds) && !entity.disableDebug && entity.isVisible && entity.isLoaded)
				{
					if(entity._flipX === 1.0) {
						this._position[0] = entity.volume.minX * unitSize | 0;
					}
					else {
						this._position[0] = (entity.volume.minX + entity.volume.width) * unitSize | 0;
					}
					if(entity._flipY === 1.0) {
						this._position[1] = entity.volume.minY * unitSize | 0;
					}
					else {
						this._position[1] = (entity.volume.minY + entity.volume.height) * unitSize | 0;
					}

					if(!entity.isChild) {
						this._center[0] = (entity.volume.x - entity.pivotX) * unitSize;
						this._center[1] = (entity.volume.y - entity.pivotY) * unitSize;
					}
					else {
						this._center[0] = (entity._parent.volume.x - entity._parent.pivotX + entity.volume.x) * unitSize;
						this._center[1] = (entity._parent.volume.y - entity._parent.pivotY + entity.volume.y) * unitSize;
					}

					this._scale[0] = entity.totalScaleX * entity._flipX;
					this._scale[1] = entity.totalScaleY * entity._flipY;

					if(entity.isHighlight) {
						gl.bindTexture(gl.TEXTURE_2D, this._highlightTex.image);
					}
					else {
						gl.bindTexture(gl.TEXTURE_2D, this._centerTex.image);
					}					

					gl.uniform2fv(this.locPos, this._position);
					gl.uniform2fv(this.locCenter, this._center);
					gl.uniform2fv(this.locScale, this._scale);
					gl.uniform1f(this.locAngle, entity.totalAngleRad);
					shader.bindBuffer2f("vertexPos", entity.texture.vbo);

					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndices);
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

					gl.lineWidth(2.0);
					this._position[0] = (entity.volume.x - entity.pivotX - 3) * unitSize;
					this._position[1] = (entity.volume.y - entity.pivotY - 3) * unitSize;
					this._scale[0] = unitSize;
					this._scale[1] = unitSize;

					gl.uniform2fv(this.locPos, this._position);
					gl.uniform2fv(this.locScale, this._scale);

					if(entity.ignoreZoom) {
						gl.uniform1f(this.locZoom, 1.0);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
						gl.uniform1f(this.locZoom, meta.camera._zoom);
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
			gl.uniform2fv(this.locScale, this._scale);

			this._position[0] = 0;
			this._position[1] = 0;
			gl.uniform2fv(this.locPos, this._position);

			this._center[0] = 0;
			this._center[1] = 0;
			gl.uniform2fv(this.locCenter, this._center);

			gl.uniform1f(this.locAngle, 0.0);
			gl.uniform1f(this.locAlpha, 1.0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._lineIndices);
			gl.lineWidth(2.0);
			gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);

			if(world.haveGrid)
			{
				var numX = world.numGridX;
				var numY = world.numGridY;

				this._scale[0] = world.gridWidth;
				this._scale[1] = world.gridHeight;
				gl.uniform2fv(this.locScale, this._scale);

				for(var y = 0; y < numY; y++)
				{
					for(var x = 0; x < numX; x++) {
						this._position[0] = (x * world.gridWidth) + world.gridX;
						this._position[1] = (y * world.gridHeight) + world.gridY;
						gl.uniform2fv(this.locPos, this._position);
						gl.drawElements(gl.LINE_STRIP, 5, gl.UNSIGNED_SHORT, 0);
					}
				}
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}

		this.isNeedRender = false;
		this.updateFlag &= ~2;
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
	_frameCoord: null,

	_clipVolume: null, 

	locCameraPos: null,
	locZoom: null,
	locSampler: null,
	locAlpha: null,
	locPos: null,
	locCenter: null,
	locScale: null,
	locFrameCoord: null,
	locAngle: null
});