"use strict";

meta.on("load", function() 
{
	// meta.on("input.down", OnDown);
	// meta.on("input.up", OnUp);

	// meta.input.keybind("left", [ meta.input.key.A, meta.input.key.LEFT ]);
	// meta.input.keybind("right", [ meta.input.key.D, meta.input.key.RIGHT ]);

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
		console.log("up");
	}
	else if(event.keybind === "left") {
		console.log("left");
	}
}

function OnUp(event) 
{
	console.log("down:", event);
	if(event.keyCode === meta.input.key.A) {
		console.log("left");
	}
}