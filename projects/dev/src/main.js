"use strict";

var stats = null;

meta.load = function()
{
	meta.renderer.bgColor = "#000";
	meta.engine.resize(250, 300)

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
	gui.add(emitter, "togglePlay").name("Play");
	gui.add(emitter, "reset").name("Reset");

	//var presets = gui.addFolder("Presets");
	// /presets.add(emitter, "presets");

	gui.add(cfg, "numMax").min(0).max(1000);
	// gui.add(cfg, "emissionRate").min(0).max(1000);
	// gui.add(cfg, "life").min(0).max(1000).step(0.1);
	// gui.add(cfg, "lifeVar").min(0).max(1000).step(0.1);
	// var guiPos = gui.addFolder("Position");
	// guiPos.add(emitter, "x").min(0).max(2000);
	// guiPos.add(emitter, "y").min(0).max(2000);
	// guiPos.add(cfg, "xVar").min(0).max(2000);
	// guiPos.add(cfg, "yVar").min(0).max(2000);

	// var color = gui.addFolder("Visual");
	// var startColor = color.addFolder("startColor");
	// startColor.add(cfg.startColor, "0").min(0).max(255).name("red");
	// startColor.add(cfg.startColor, "1").min(0).max(255).name("green");
	// startColor.add(cfg.startColor, "2").min(0).max(255).name("blue");
	// startColor.add(cfg.startColor, "3").min(0).max(1).step(0.01).name("alpha");
	// var startColorVar = color.addFolder("startColorVar");
	// startColorVar.add(cfg.startColorVar, "0").min(0).max(255).name("red");
	// startColorVar.add(cfg.startColorVar, "1").min(0).max(255).name("green");
	// startColorVar.add(cfg.startColorVar, "2").min(0).max(255).name("blue");
	// startColorVar.add(cfg.startColorVar, "3").min(0).max(1).step(0.01).name("alpha");
	// var endColor = color.addFolder("endColor");
	// endColor.add(cfg.endColor, "0").min(0).max(255).name("red");
	// endColor.add(cfg.endColor, "1").min(0).max(255).name("green");
	// endColor.add(cfg.endColor, "2").min(0).max(255).name("blue");
	// endColor.add(cfg.endColor, "3").min(0).max(1).step(0.01).name("alpha");
	// var endColorVar = color.addFolder("endColorVar");
	// endColorVar.add(cfg.endColorVar, "0").min(0).max(255).name("red");
	// endColorVar.add(cfg.endColorVar, "1").min(0).max(255).name("green");
	// endColorVar.add(cfg.endColorVar, "2").min(0).max(255).name("blue");
	// endColorVar.add(cfg.endColorVar, "3").min(0).max(1).step(0.01).name("alpha");
	// color.add(cfg, "scale").min(0).max(100);
	// color.add(cfg, "scaleVar").min(0).max(100);
	// color.add(cfg, "endScale").min(0).max(100);
	// color.add(cfg, "endScaleVar").min(0).max(100);

	//var textureFolder = gui.addFolder("Texture");
	//textureFolder.add(cfg, "textured")

	// var guiPhysics = gui.addFolder("Physics");	
	// guiPhysics.add(cfg, "speed").min(-500).max(500);
	// guiPhysics.add(cfg, "speedVar").min(-1000).max(1000).step(0.1);
	// guiPhysics.add(cfg, "angle").min(0).max(360);
	// guiPhysics.add(cfg, "angleVar").min(0).max(360);
	// guiPhysics.add(cfg, "gravityX").min(-500).max(500);
	// guiPhysics.add(cfg, "gravityY").min(-500).max(500);
	// guiPhysics.add(cfg, "radialAccel").min(-500).max(500);
	// guiPhysics.add(cfg, "radialAccelVar").min(-500).max(500);
	// guiPhysics.add(cfg, "tangentialAccel").min(-500).max(500);
	// guiPhysics.add(cfg, "tangentialAccelVar").min(-500).max(500);
}

meta.render = function()
{
	stats.end();
	stats.begin();
}
