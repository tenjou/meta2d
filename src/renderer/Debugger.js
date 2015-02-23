"use strict";

meta.Debugger = function() 
{
	this.holder = null;
	this.txt = null;

	this.fps = 0;
	this.memory = 0;
	this.entities = 0;

	this.create();
};

meta.Debugger.prototype =
{
	create: function()
	{
		this.view = meta.getView("debugger");

		var texture = new Resource.SVG();
		texture.fillStyle = "#000";
		texture.fillRect(0, 0, 160, 180);

		this.holder = new Entity.Geometry(texture);
		this.holder.anchor(0, 1);
		this.holder.position(0, -180);
		this.holder.alpha = 0.7;
		this.holder.ui = true;
		this.view.attach(this.holder);

		var fps = new Entity.Text();
		fps.position(10, 10);
		fps.text = "fps: 60";
		this.holder.attach(fps);	

		var memory = new Entity.Text();
		memory.position(10, 30);
		this.holder.attach(memory);

		var entities = new Entity.Text();
		entities.position(10, 60);
		entities.text = "entities: 0";
		this.holder.attach(entities);					

		var resolution = new Entity.Text();
		resolution.position(10, 90);
		this.holder.attach(resolution);	

		var camera = new Entity.Text();
		camera.position(10, 110);
		this.holder.attach(camera);						

		var world = new Entity.Text();
		world.position(10, 130);
		this.holder.attach(world);

		var screen = new Entity.Text();
		screen.position(10, 150);
		this.holder.attach(screen);	

		this.txt = {
			fps: fps,
			memory: memory,
			entities: entities,
			resolution: resolution,
			camera: camera,
			world: world,
			screen: screen
		};			
	},

	load: function()
	{
		this.view.active = true;

		var self = this;
		this.timer = meta.addTimer(this, function() {
			self.updateTxt();
		}, 1000)

		meta.subscribe(this, Input.Event.MOVE, this.onInputMove);
		meta.subscribe(this, meta.Event.RESIZE, this.onResize);
		meta.subscribe(this, meta.Event.CAMERA_MOVE, this.onCameraMove);

		this.updateTxt();

		this.txt.resolution.text = "width: " + meta.engine.width + ", height: " + meta.engine.height;
		this.txt.camera.text = "camera x: " + meta.camera.x + ", y: " + meta.camera.y;

		var inputCtrl = Input.ctrl;
		this.txt.world.text = "world x: " + inputCtrl.x + ", y: " + inputCtrl.y;
		this.txt.screen.text = "screen x: " + inputCtrl.screenX + ", y: " + inputCtrl.screenY;		
	},

	unload: function()
	{
		meta.unsubscribe(this, Input.Event.MOVE);
		meta.unsubscribe(this, meta.Event.RESIZE);
		meta.unsubscribe(this, meta.Event.CAMERA_MOVE);

		this.view.active = false;
	},

	updateTxt: function()
	{
		var fps = meta.engine.fps;
		if(fps !== this.fps) {
			this.txt.fps.text = "fps: " + fps;
			this.fps = fps;
		}

		var memory = (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2);
		if(memory !== this.memory) {
			this.txt.memory.text = "memory: " + memory + "mb";	
			this.memory = memory;		
		}

		var entities = meta.renderer.entities.length;
		if(entities !== this.entities) {
			this.txt.entities.text = "entities: " + entities;
			this.entities = entities;
		}
	},

	onInputMove: function(data, event) {
		this.txt.world.text = "world x: " + data.x + ", y: " + data.y;
		this.txt.screen.text = "screen x: " + data.screenX + ", y: " + data.screenY;
	},

	onCameraMove: function(data, event) {
		this.txt.camera.text = "camera x: " + data.x + ", y: " + data.y;
	},

	onResize: function(data, event) {
		this.txt.resolution.text = "width: " + data.width + ", height: " + data.height;
	}
};
