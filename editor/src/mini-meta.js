"use strict";

var canvas = null;
var gl = null;
var shader = null;
var adding = true;
var texture = null;
var ready = false;
var verticeBuffer = null;

var camera = new Float32Array(2);
var viewportSize = new Float32Array(2);
var inverseTextureSize = new Float32Array(2);

function Shader(gl, program) 
{
	var count, i, attrib, uniform, name;

	this.gl = gl;
	this.program = program;

	this.attrib = {};
	this.uniform = {};

	count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for(i = 0; i < count; i++) {
		attrib = gl.getActiveAttrib(program, i);
		this.attrib[attrib.name] = gl.getAttribLocation(program, attrib.name);
	}

	count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for(i = 0; i < count; i++) {
		uniform = gl.getActiveUniform(program, i);
		name = uniform.name.replace("[0]", "");
		this.uniform[uniform.name] = gl.getUniformLocation(program, name);
	}	
}

function createShader(gl, vertexShaderSrc, fragmentShaderSrc)
{
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSrc);
	gl.compileShader(vertexShader);

	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSrc);
	gl.compileShader(fragmentShader);

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);

	var failed = false;

	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
		failed = true;
	}
	else if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fragmentShader));
		failed = true;
	}
	else if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		failed = true;
	}	

	if(failed) {
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;		
	}

	var shader = new Shader(gl, program);
	return shader;
}

function loadImg()
{
	texture = gl.createTexture();

	var img = new Image();
	img.onload = function() { prepareTexture(img); }
	img.src = "assets/tilemap2.png";
}

function prepareTexture(img)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);

	inverseTextureSize[0] = img.width * 0.5;
	inverseTextureSize[1] = img.height * 0.5;

	ready = true;
}

function init()
{
	window.addEventListener("resize", onResize, false);

	canvas = document.getElementById("canvas");
	gl = canvas.getContext("experimental-webgl");
	if(!gl) {
		console.error("no webgl");
		return false;
	}

	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("mouseup", onMouseUp, false);
	canvas.addEventListener("mousemove", onMouseMove, false);

	var vertexShaderSrc = 
		"precision mediump float; \
		attribute vec2 position; \
		attribute vec2 texCoord; \
		uniform vec2 viewportSize; \
		uniform vec2 camera; \
		uniform vec2 inverseTextureSize; \
		varying highp vec2 var_texCoord; \
		void main() { \
			gl_Position = vec4(position, 0, 1); \
			var_texCoord = vec2(texCoord.x * 0.5 + camera.x, texCoord.y * 0.5 + camera.y); \
		}";

	var fragmentShaderSrc = 
		"precision mediump float; \
		varying vec2 var_texCoord; \
		uniform sampler2D sampler; \
		uniform vec2 inverseTextureSize; \
		void main() { \
		  gl_FragColor = texture2D(sampler, var_texCoord * 0.5); \
		}";

	shader = createShader(gl, vertexShaderSrc, fragmentShaderSrc);

	loadImg();

	var vertices = [
		-1, -1, 0, 1,
		1, -1, 1, 1,
		1, 1, 1, 0,
		-1, -1, 0, 1,
		1, 1, 1, 0,
		-1, 1, 0, 0
	];	

	verticeBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticeBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	

	gl.clearColor(0.9, 0.9, 0.9, 1);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);	
	gl.enable(gl.BLEND);

	onResize();

	return true;
}

function update() 
{
	if(!ready) { return; }

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(shader.program);
	gl.bindBuffer(gl.ARRAY_BUFFER, verticeBuffer);
	gl.enableVertexAttribArray(shader.attrib.position);
	gl.enableVertexAttribArray(shader.attrib.texCoord);	
	gl.vertexAttribPointer(shader.attrib.position, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(shader.attrib.texCoord, 2, gl.FLOAT, false, 16, 8);

	gl.uniform2fv(shader.uniform.viewportSize, viewportSize);
	


	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(shader.uniform.sampler, 0);

	gl.uniform2fv(shader.uniform.camera, camera);
	gl.uniform2fv(shader.uniform.inverseTextureSize, inverseTextureSize);

	gl.drawArrays(gl.TRIANGLES, 0, 6);	
}

function onResize()
{
	canvas.width = canvas.parentElement.clientWidth;
	canvas.height = canvas.parentElement.clientHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	viewportSize[0] = canvas.width;
	viewportSize[1] = canvas.height;
}

var isMouseDown = false;

function onMouseDown(event) {
	isMouseDown = true;
}

function onMouseUp(event) {
	isMouseDown = false;
}

function onMouseMove(event)
{
	if(isMouseDown) {
		camera[0] = event.pageX;
		camera[1] = event.pageY;
	}
}

