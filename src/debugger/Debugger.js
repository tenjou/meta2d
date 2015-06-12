"use strict";

meta.Debugger = function() 
{
	this.holder = null;
	this.txt = null;

	this.fps = 0;
	this.memory = 0;
	this.numEntities = 0;

	this.created = false;

	this.init();
};

meta.Debugger.prototype =
{
	init: function() {
		meta.subscribe(this, meta.Event.DEBUG, this.onDebug);
	},

	create: function()
	{
		this.view = meta.getView("debugger");
		this.view.static = true;
		this.view.z = 1000000;

		var texture = new Resource.SVG();
		texture.fillStyle = "#000";
		texture.fillRect(0, 0, 200, 290);

		this.holder = new Entity.Geometry(texture);
		this.holder.parent = meta.renderer.staticHolder;
		this.holder.anchor(0, 1);
		this.holder.position(0, -290);
		this.holder.alpha = 0.8;
		this.holder.z = 10000;
		this.holder.debugger = true;
		this.view.attach(this.holder);

		var fps = new Entity.Text();
		fps.position(10, 10);
		fps.text = "fps: 60";
		this.holder.attach(fps);	

		var memory = new Entity.Text();
		memory.position(10, 25);
		this.holder.attach(memory);

		var entities = new Entity.Text();
		entities.position(10, 40);
		entities.text = "entities: 0";
		this.holder.attach(entities);					

		var resolution = new Entity.Text();
		resolution.position(10, 65);
		this.holder.attach(resolution);	
		
		/* World */
		var worldInfo = new Entity.Text();
		worldInfo.text = "world:";
		worldInfo.position(10, 90);
		this.holder.attach(worldInfo);

		var worldBoundsMin = new Entity.Text();
		worldBoundsMin.position(20, 105);
		this.holder.attach(worldBoundsMin);	

		var worldBoundsMax = new Entity.Text();
		worldBoundsMax.position(20, 120);
		this.holder.attach(worldBoundsMax);	

		var worldResolution = new Entity.Text();
		worldResolution.position(20, 135);
		this.holder.attach(worldResolution);			

		/* Camera */
		var cameraInfo = new Entity.Text();
		cameraInfo.text = "camera:";
		cameraInfo.position(10, 155);
		this.holder.attach(cameraInfo);

		var cameraBoundsMin = new Entity.Text();
		cameraBoundsMin.position(20, 170);
		this.holder.attach(cameraBoundsMin);	

		var cameraBoundsMax = new Entity.Text();
		cameraBoundsMax.position(20, 185);
		this.holder.attach(cameraBoundsMax);	

		var cameraResolution = new Entity.Text();
		cameraResolution.position(20, 200);
		this.holder.attach(cameraResolution);				

		var cameraZoom = new Entity.Text();
		cameraZoom.position(20, 215);
		this.holder.attach(cameraZoom);							

		/* Cursor */
		var cursorInfo = new Entity.Text();
		cursorInfo.text = "cursor:";
		cursorInfo.position(10, 235);
		this.holder.attach(cursorInfo);

		var world = new Entity.Text();
		world.position(20, 250);
		this.holder.attach(world);

		var screen = new Entity.Text();
		screen.position(20, 265);
		this.holder.attach(screen);	

		this.txt = {
			fps: fps,
			memory: memory,
			entities: entities,
			resolution: resolution,
			worldBoundsMin: worldBoundsMin,
			worldBoundsMax: worldBoundsMax,
			worldResolution: worldResolution,
			cameraBoundsMin: cameraBoundsMin,
			cameraBoundsMax: cameraBoundsMax,
			cameraResolution: cameraResolution,
			cameraZoom: cameraZoom,
			world: world,
			screen: screen
		};	

		this.created = true;		
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
		meta.subscribe(this, meta.Event.WORLD_RESIZE, this.onWorldResize);
		meta.subscribe(this, meta.Event.CAMERA_MOVE, this.onCameraMove);
		meta.subscribe(this, meta.Event.CAMERA_RESIZE, this.onCameraResize);

		this.updateTxt();

		this.onCameraMove(meta.camera, 0);
		this.onCameraResize(meta.camera, 0);
		this.onResize(meta.engine);
		this.onWorldResize(meta.world, 0);
		this.onInputMove(Input.ctrl, 0);	
	},

	unload: function()
	{
		meta.unsubscribe(this, Input.Event.MOVE);
		meta.unsubscribe(this, meta.Event.RESIZE);
		meta.unsubscribe(this, meta.Event.WORLD_RESIZE);
		meta.unsubscribe(this, meta.Event.CAMERA_MOVE);
		meta.unsubscribe(this, meta.Event.CAMERA_RESIZE);

		this.timer.stop();
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

		var numEntities = meta.renderer.numEntities;
		if(numEntities !== this.numEntities) {
			this.txt.entities.text = "entities: " + numEntities;
			this.numEntities = numEntities;
		}
	},

	onDebug: function(value, event) 
	{
		if(value) 
		{
			if(!this.created) {
				this.create();
			}

			this.load();
		}
		else {
			this.unload();
		}
	},

	onInputMove: function(data, event) {
		this.txt.world.text = "world: " + data.x + ", " + data.y;
		this.txt.screen.text = "screen: " + data.screenX + ", " + data.screenY;
	},

	onCameraMove: function(data, event) {
		var volume = data.volume;
		this.txt.cameraBoundsMin.text = "boundsMin: " + Math.round(volume.minX) + ", " + Math.round(volume.minY);
		this.txt.cameraBoundsMax.text = "boundsMax: " + Math.round(volume.maxX) + ", " + Math.round(volume.maxY);
		this.txt.cameraResolution.text = "width: " + volume.width + ", height: " + volume.height;
	},

	onCameraResize: function(data, event) {
		this.txt.cameraZoom.text = "zoom: " + data.zoom.toFixed(3);
	},

	onResize: function(data, event) {
		this.txt.resolution.text = "width: " + data.width + ", height: " + data.height;
	},

	onWorldResize: function(data, event) {
		var volume = data.volume;
		this.txt.worldBoundsMin.text = "boundsMin: " + Math.round(volume.minX) + ", " + Math.round(volume.minY);
		this.txt.worldBoundsMax.text = "boundsMax: " + Math.round(volume.maxX) + ", " + Math.round(volume.maxY);
		this.txt.worldResolution.text = "width: " + volume.width + ", height: " + volume.height;
	}
};
