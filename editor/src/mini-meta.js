"use strict";

var canvas = null;
var gl = null;
var foobar = 0.5;
var aspect;
var program;
var itemSize = 2;
var adding = true;
var texture = null;
var attribPos = null, attribTexCoord = null;
var ready = false;
var cubeVerticesBuffer = null;
var cubeVerticesTextureCoordBuffer = null;

function Shader() {

}

function createShader(ctx, vertexShaderSrc, fragmentShaderSrc)
{
	
}

function loadImg()
{
	texture = gl.createTexture();

	var img = new Image();
	img.onload = function() { prepareTexture(img); }
	img.src = "assets/tilemap.png";
}

function prepareTexture(img)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);

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

	var vertexShaderSrc = 
		"attribute vec2 position; \
		attribute vec2 texCoord; \
		uniform vec2 viewportSize; \
		varying highp vec2 var_texCoord; \
		void main() { \
			gl_Position = vec4(position, 0, 1); \
			var_texCoord = texCoord; \
		}";

	var fragmentShaderSrc = 
		"varying highp vec2 var_texCoord; \
		uniform sampler2D sampler; \
		void main() { \
		  gl_FragColor = texture2D(sampler, var_texCoord); \
		}";

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSrc);
	gl.compileShader(vertexShader);

	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSrc);
	gl.compileShader(fragmentShader);

	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);

	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
		return false;
	}

	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fragmentShader));
		return false;
	}

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		return false;
	}	

	loadImg();

	var vertices = [
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		1.0, 1.0
	];

	var textureCoordinates = [
		0, 1,
		1, 1,
		0, 0,
		0, 0,
		1, 1,
		1, 0
	];	

	cubeVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	cubeVerticesTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);	

	attribPos = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(attribPos);

	attribTexCoord = gl.getAttribLocation(program, "texCoord");
	gl.enableVertexAttribArray(attribTexCoord);	

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

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.vertexAttribPointer(attribPos, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.vertexAttribPointer(attribTexCoord, 2, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);	
}

function onResize()
{
	canvas.width = canvas.parentElement.clientWidth;
	canvas.height = canvas.parentElement.clientHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

}
