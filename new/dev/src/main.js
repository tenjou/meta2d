"use strict";

meta.on("init", function()
{
	var holder = document.createElement("div");
	holder.style.cssText = "position: relative; width: 400px; height: 400px;";
	document.body.appendChild(holder);

	meta.engine.container = holder;
});

meta.on("preload", function() 
{
	var shader = meta.resources.loadShader("sprite", {
		vertexShader: [
			"attribute vec3 vertexPos;",

			"uniform mat4 modelViewMatrix;",
			"uniform mat4 projMatrix;",

			"void main(void) {",
			"	gl_Position = projMatrix * modelViewMatrix * vec4(vertexPos, 1.0);",
			"}"
		],
		fragmentShader: [
			"void main(void) {",
			"	gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
			"}"
		]
	});

	var shader2 = meta.resources.getShader("sprite");
});

meta.on("load", function() 
{
	// var shader = new meta.Shader("basic", "./basic.vert", "./basic.frag");
	// shader.remove();

	// console.log("load");

	// // var camera = meta.createCamera();
	// // camera.position(20, 300);
	// // meta.camera = camera;

	// var sprite = meta.createEntity("sprite", "player");
	// sprite.position(200, 300);
	// meta.view.add(sprite);

	// sprite.remove();
});
