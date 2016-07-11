"use strict";

meta.on("init", function() 
{
	var holder = document.createElement("div");
	holder.style.cssText = "position: relative; width: 400px; height: 400px;";
	document.body.appendChild(holder);

	meta.engine.container = holder;
});

meta.on("load", function() 
{
	meta.on("input.down", OnDown);
	meta.on("input.up", OnUp);

	meta.input.keybind("left", [ meta.input.key.A, meta.input.key.LEFT ]);
	meta.input.keybind("right", [ meta.input.key.D, meta.input.key.RIGHT ]);

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

function OnDown(event) 
{
	console.log("down:", event);
	if(event.keyCode === meta.input.key.W) {
		console.log("move up");
	}
	else if(event.keybind) {
		console.log("keybind", event.keybind);
	}
}

function OnUp(event) 
{
	console.log("up:", event);
	if(event.keyCode === meta.input.key.A) {
		console.log("left");
	}
}