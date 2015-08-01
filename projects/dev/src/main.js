"use strict";

var stats = null;
var emitter = null;
var activeText = null;
var defaultTexture = null;

meta.load = function()
{
	meta.renderer.bgColor = "#0f1217";
	// meta.engine.resize(250, 300);
	//meta.engine.resize(800, 800);
	meta.input._ignoreKeys[8] = void(0);

	meta.loadTexture("assets/particle");

	// var texture = new Resource.SVG();
	// texture.fillStyle = "blue";
	// texture.circle(10);

	defaultTexture = meta.resources.getTexture("particle");

	emitter = new Entity.ParticleEmitter(defaultTexture);
	// emitter.preset({

	// });
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

	// // gui
	// var cfg = emitter.cfg;
	// var userCfg = {
	// 	textureEnabled: false,
	// 	texture: null,
	// 	prevTexture: null,
	// 	textureFile: ""
	// };

	// if(emitter.texture) {
	// 	userCfg.textureEnabled = true;
	// 	userCfg.texture = emitter.texture;
	// }

	// var gui = new dat.GUI();
	// var ctrl = gui.add(emitter, "togglePlay").name(emitter.updating ? "Pause" : "Play");
	// ctrl.onFinishChange(function(value) {
	// 	ctrl.name(emitter.updating ? "Pause" : "Play");
	// });
	// gui.add(emitter, "reset").name("Reset");

	//var presets = gui.addFolder("Presets");
	// /presets.add(emitter, "presets");

	// var basicsFolder = gui.addFolder("Basics");
	// basicsFolder.add(emitter, "totalParticles").min(0).max(1000).step(1);
	// basicsFolder.add(emitter, "emissionRate").min(0).max(1000);
	// basicsFolder.add(emitter, "life").min(0).max(1000).step(0.1);
	// basicsFolder.add(emitter, "lifeVar").min(0).max(1000).step(0.1);
	// basicsFolder.add(emitter, "duration").min(0).max(10000).onChange(function(value) {

	// });

	// var guiPos = gui.addFolder("Position");
	// guiPos.add(emitter, "x").min(0).max(2000);
	// guiPos.add(emitter, "y").min(0).max(2000);
	// guiPos.add(cfg, "xVar").min(0).max(2000);
	// guiPos.add(cfg, "yVar").min(0).max(2000);

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

	// var color = gui.addFolder("Visual");
	// color.add(emitter, "tintingEnabled");
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

	// var textureFolder = gui.addFolder("Texture");
	// textureFolder.addFile(userCfg, "textureFile").onChange(function(value) {
	// 	userCfg.texture = meta.loadFile(value);
	// 	if(userCfg.textureEnabled) {
	// 		emitter.texture = userCfg.texture;
	// 	}
	// });
	// textureFolder.add(window, "resetTexture");
	// textureFolder.add(userCfg, "textureEnabled").onFinishChange(function(value) {
	// 	if(!userCfg.textureEnabled) {
	// 		emitter.texture = null;
	// 	}
	// 	else {
	// 		emitter.texture = userCfg.texture;
	// 	}
	// });
	// textureFolder.add(emitter, "textureAdditive");
	// textureFolder.add(emitter, "radius").min(0).max(100).step(1);

	activeText = new Entity.Text();
	activeText.pivot(0, 1);
	activeText.anchor(0, 1);
	activeText.position(5, -5);
	activeText.color = "white";
	meta.view.attach(activeText);
}

var tLast = 0;

meta.render = function()
{
	stats.end();
	stats.begin();

	if(Date.now() - tLast > 1000) {
		activeText.text = "Active particles: " + emitter.numActive;
		tLast = Date.now();
	}
}

function resetTexture() {
	emitter.texture = defaultTexture;
}
