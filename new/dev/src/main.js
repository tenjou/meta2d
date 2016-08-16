"use strict";

// meta.on("init", function()
// {
// 	var holder = document.createElement("div");
// 	holder.style.cssText = "position: relative; width: 640px; height: 480px;";
// 	document.body.appendChild(holder);

// 	meta.engine.container = holder;
// });

var player;

meta.on("preload", function() 
{
	meta.resources.preload = false;
	meta.camera.draggable = true;

	meta.on("input-scroll", updateZoom);

	// var texture = meta.resources.createTexture("cubetexture");
	// texture.path = "cubetexture.png";
	// var texture = meta.resources.loadTexture("cubetexture.png");

	player = meta.new(meta.Sprite);
	player.texture = meta.new(meta.Texture, "correct.png");
	player.position(10, 0);
	meta.layer.add(player);


		var tilingShader = meta.new(meta.Shader, {
			id: "tiling",
			vertexShader: [
				"attribute vec3 vertexPos;",
				"attribute vec2 uvCoords;",

				"uniform mat4 projMatrix;",
				"uniform float angle;",
				"uniform float tilesX;",

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

	var gridCanvas = document.createElement("canvas");
	gridCanvas.width = 256;
	gridCanvas.height = 256;
	var gridCtx = gridCanvas.getContext("2d");
	// gridCtx.fillStyle = "red";
	// gridCtx.fillRect(0, 0, 256 ,256);
		gridCtx.beginPath();
		gridCtx.moveTo(0.5, -0.5);
		gridCtx.lineTo(0.5, 256);
		gridCtx.moveTo(0.5, 1.5);
		gridCtx.lineTo(256, 1.5);		
		gridCtx.stroke();	

	var texture = meta.new(meta.Texture, gridCanvas);
	texture.anisotropy = false;

	var entity = meta.new(meta.Sprite, texture);
	entity.resize(meta.engine.width, 100);
	meta.on("resize", function(engine) {
		entity.resize(engine.width, engine.height)
	});
	meta.layer.add(entity);

	var gridLayer = meta.createLayer("grid");
	gridLayer.static = true;
	gridLayer.add(entity);
	
	// meta.view.remove(player);

	meta.on("input-down", handleOnDown);
	meta.on("input-up", handleOnUp);
});

function updateZoom(event)
{
	meta.camera.zoom += event.delta * 0.05;
	console.log(event.x)
}

var speedMod = 100;
var speedX = 0;
var speedY = 0;

function handleOnDown(event)
{
	switch(event.keyCode)
	{
		case meta.key.A: 
			speedX = -speedMod;
			break;
		case meta.key.D: 
			speedX = speedMod;
			break;	
		case meta.key.W: 
			speedY = -speedMod;
			break;	
		case meta.key.S: 
			speedY = speedMod;
			break;							
	}
}

function handleOnUp(event)
{
	switch(event.keyCode)
	{
		case meta.key.A: 
		case meta.key.D: 
			speedX = 0;
			break;	
		case meta.key.W: 
		case meta.key.S: 
			speedY = 0;
			break;	
	}
}

meta.on("update", function(tDelta)
{
	player.move(speedX * tDelta, speedY * tDelta);
});
