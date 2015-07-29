"use strict";

var stats = null;

meta.load = function()
{
	meta.renderer.bgColor = "#777";

	meta.loadTexture("assets/particle");

	// var texture = new Resource.SVG();
	// texture.fillStyle = "blue";
	// texture.circle(10);

	var emitter = new Entity.Particle("particle");
	emitter.pivot(0.5);
	emitter.position(meta.world.centerX, meta.world.centerY);
	emitter.debug = true;
	emitter.play();
	meta.view.attach(emitter);

	// stats.js
	stats = new Stats();
	stats.setMode(0);
	stats.domElement.style.position = "absolute";
	stats.domElement.style.left = "0px";
	stats.domElement.style.top = "0px";
	document.body.appendChild(stats.domElement);

	// gui
	var cfg = emitter.cfg;

	var gui = new dat.GUI();
	gui.add(emitter, "togglePlay");
	gui.add(emitter, "reset");
	gui.add(cfg, "numMax").min(0).max(1000);
	gui.add(cfg, "emissionRate").min(0).max(1000);
	gui.add(cfg, "life").min(0).max(1000).step(0.1);
	gui.add(cfg, "lifeVar").min(0).max(1000).step(0.1);
	var guiPos = gui.addFolder("pos");
	guiPos.add(emitter, "x").min(0).max(2000);
	guiPos.add(emitter, "y").min(0).max(2000);
	guiPos.add(cfg, "xVar").min(0).max(2000);
	guiPos.add(cfg, "yVar").min(0).max(2000);
	var guiPhysics = gui.addFolder("physics");	
	guiPhysics.add(cfg, "speed").min(-500).max(500);
	guiPhysics.add(cfg, "speedVar").min(-1000).max(1000).step(0.1);
	guiPhysics.add(cfg, "angle").min(0).max(360);
	guiPhysics.add(cfg, "angleVar").min(0).max(360);	
}

meta.render = function()
{
	stats.end();
	stats.begin();
}
