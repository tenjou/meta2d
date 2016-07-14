"use strict";

meta.input =
{
	setup: function()
	{
		var numTotalKeys = this.$numKeys + this.$numInputs + 1;
		this.keys = new Array(numTotalKeys);
		this.keybinds = new Array(numTotalKeys);

		this.$eventDown = new this.Event();
		this.$event = new this.Event();

		meta.on("blur", this.resetInputs, this);

		this.$loadIgnoreKeys();
		this.$addEventListeners();
	},

	handleKeyDown: function(domEvent)
	{
		var keyCode = domEvent.keyCode;

		this.checkIgnoreKey(domEvent, keyCode);

		if(!this.enable) { return; }

		if(this.stickyKeys && this.keys[keyCode]) {
			return;
		}

		this.keys[keyCode] = 1;

		this.$eventDown.domEvent = domEvent;
		this.$eventDown.prevScreenX = 0;
		this.$eventDown.prevScreenY = 0;
		this.$eventDown.screenX = 0;
		this.$eventDown.screenY = 0;
		this.$eventDown.x = 0;
		this.$eventDown.y = 0;
		this.$eventDown.keyCode = keyCode;
		this.$eventDown.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.down", this.$eventDown);

		this.updateRepeatKey(keyCode);
	},

	handleKeyUp: function(domEvent)
	{
		var keyCode = event.keyCode;

		this.checkIgnoreKey(domEvent, keyCode);

		if(!this.enable) { return; }

		this.keys[keyCode] = 0;

		this.$event.domEvent = domEvent;
		this.$event.prevScreenX = 0;
		this.$event.prevScreenY = 0;
		this.$event.screenX = 0;
		this.$event.screenY = 0;
		this.$event.x = 0;
		this.$event.y = 0;
		this.$event.keyCode = keyCode;
		this.$event.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.up", this.$event);

		if(this.repeatKey && this.$repeatTimer) {
			this.$repeatTimer.stop();
		}
	},

	handleMouseDown: function(domEvent)
	{
		if(!this.enable) { return; }

		var keyCode = event.button + this.BUTTON_ENUM_OFFSET;
		this.keys[keyCode] = 1;

		var engine = meta.engine;
		var camera = meta.camera;

		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenX;
		this.screenX = ((event.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
		this.screenY = ((event.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this.$event.domEvent = domEvent;
		this.$event.prevScreenX = this.prevScreenX;
		this.$event.prevScreenY = this.prevScreenY;
		this.$event.screenX = this.screenX;
		this.$event.screenY = this.screenY;
		this.$event.x = this.x;
		this.$event.y = this.y;
		this.$event.keyCode = keyCode;
		this.$event.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.down", this.$event);
	},

	handleMouseUp: function(domEvent)
	{
		if(!this.enable) { return; }

		var keyCode = event.button + this.BUTTON_ENUM_OFFSET;
		this.keys[keyCode] = 0;	

		var engine = meta.engine;
		var camera = meta.camera;

		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenY;		
		this.screenX = ((event.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
		this.screenY = ((event.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this.$event.domEvent = domEvent;
		this.$event.prevScreenX = this.prevScreenX;
		this.$event.prevScreenY = this.prevScreenY;
		this.$event.screenX = this.screenX;
		this.$event.screenY = this.screenY;
		this.$event.x = this.x;
		this.$event.y = this.y;
		this.$event.keyCode = keyCode;
		this.$event.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.up", this.$event);
	},

	handleMouseMove: function(domEvent)
	{
		if(document.activeElement === document.body) {
			domEvent.preventDefault();
		}

		if(!this.enable) { return; }

		var engine = meta.engine;
		var camera = meta.camera;

		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenY;
		this.screenX = ((event.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
		this.screenY = ((event.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this.$event.domEvent = domEvent;
		this.$event.prevScreenX = this.prevScreenX;
		this.$event.prevScreenY = this.prevScreenY;
		this.$event.screenX = this.screenX;
		this.$event.screenY = this.screenY;
		this.$event.x = this.x;
		this.$event.y = this.y;
		this.$event.keyCode = -1;

		meta.emit("input.move", this.$event);
	},	

	handleMouseDbClick: function(domEvent)
	{
		if(!this.enable) { return; }

		var engine = meta.engine;
		var camera = meta.camera;		
		var keyCode = domEvent.button;	

		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenY;		
		this.screenX = ((event.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
		this.screenY = ((event.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this.$event.domEvent = domEvent;
		this.$event.prevScreenX = this.prevScreenX;
		this.$event.prevScreenY = this.prevScreenY;
		this.$event.screenX = this.screenX;
		this.$event.screenY = this.screenY;
		this.$event.x = this.x;
		this.$event.y = this.y;
		this.$event.keyCode = keyCode;
		this.$event.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.up", this.$event);
	},

	handleTouchDown: function(domEvent)
	{
		if(document.activeElement === document.body) {		
			domEvent.preventDefault();
		}

		var engine = meta.engine;
		var camera = meta.camera;

		var changedTouches = domEvent.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			var id = this.touches.length - 1;
			var touch = changedTouches[i];
			this.touches.push(touch.identifier);

			var screenX = ((touch.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
			var screenY = ((touch.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
			var x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			var y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + this.BUTTON_ENUM_OFFSET;
			this.keys[keyCode] = 1;

			this.$event.domEvent = domEvent;
			this.$event.prevScreenX = screenX;
			this.$event.prevScreenY = screenY;
			this.$event.screenX = screenX;
			this.$event.screenY = screenY;
			this.$event.x = x;
			this.$event.y = y;
			this.$event.keyCode = keyCode;
			this.$event.keybind = this.keybinds[keyCode] || null;

			if(id === 0) {
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;
			}

			meta.emit("input.down", this.$event);
		}
	},

	handleTouchUp: function(domEvent)
	{
		if(document.activeElement === document.body) {		
			domEvent.preventDefault();
		}

		var engine = meta.engine;
		var camera = meta.camera;

		var changedTouches = domEvent.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			var touch = changedTouches[i];
			var id = this.$getTouchID(touch.identifier);
			if(id === -1) { continue; }

			this.touches.splice(id, 1);

			var screenX = ((touch.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
			var screenY = ((touch.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
			var x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			var y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + this.BUTTON_ENUM_OFFSET;
			this.keys[keyCode] = 0;		

			if(id === 0) 
			{
				this.prevScreenX = this.screenX;
				this.prevScreenY = this.screenY;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;	
				this.$event.prevScreenX = this.prevScreenX;
				this.$event.prevScreenY = this.prevScreenY;							
			}
			else 
			{
				this.$event.prevScreenX = 0;
				this.$event.prevScreenY = 0;
			}

			this.$event.domEvent = domEvent;
			this.$event.screenX = screenX;
			this.$event.screenY = screenY;
			this.$event.x = x;
			this.$event.y = y;
			this.$event.keyCode = id;
			this.$event.keybind = this.keybinds[keyCode] || null;

			meta.emit("input.down", this.$event);
		}
	},

	handleTouchMove: function(domEvent)
	{
		if(document.activeElement === document.body) {		
			domEvent.preventDefault();
		}

		var scope = meta;
		var camera = scope.camera;

		var changedTouches = domEvent.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			var touch = changedTouches[i];
			var id = this.$getTouchID(touch.identifier);
			if(id === -1) { continue; }

			var screenX = ((touch.pageX - engine.offsetLeft) * engine.scaleX) * engine.ratio;
			var screenY = ((touch.pageY - engine.offsetTop) * engine.scaleY) * engine.ratio;
			var x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			var y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + this.BUTTON_ENUM_OFFSET;

			if(id === 0) 
			{
				this.prevScreenX = this.screenX;
				this.prevScreenY = this.screenY;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;	

				this.$event.prevScreenX = this.prevScreenX;
				this.$event.prevScreenY = this.prevScreenY;					
			}
			else {
				this.$event.prevScreenX = screenX;
				this.$event.prevScreenY = screenY;
			}

			this.$event.domEvent = domEvent;
			this.$event.screenX = 0;
			this.$event.screenY = 0;
			this.$event.x = x;
			this.$event.y = y;
			this.$event.keyCode = keyCode;
			this.$event.keybind = this.keybinds[keyCode] || null;

			meta.emit("input.move", $event);
		}
	},

	$getTouchID: function(eventTouchID)
	{
		for(var n = 0; n < this.touches.length; n++)
		{
			if(this.touches[n] === eventTouchID) {
				return n;
			}
		}

		return -1;
	},

	resetInputs: function()
	{
		this.$event.domEvent = null;
		this.$event.prevScreenX = this.prevScreenX;
		this.$event.prevScreenY = this.prevScreenY;
		this.$event.screenX = this.screenX;
		this.$event.screenY = this.screenY;
		this.$event.x = this.x;
		this.$event.y = this.y;

		// Reset keys:
		for(var n = 0; n < this.keys.length; n++) 
		{
			if(!this.keys[n]) { continue; }

			this.keys[n] = 0;

			this.$event.keyCode = n;
			this.$event.keybind = this.$keybinds[n];

			meta.emit("input.up", this.$event);
		}

		// Reset touches:
		for(var n = 0; n < this.touches.length; n++)
		{
			if(!this.touches[n]) { continue; }

			var keyCode = n + this.BUTTON_ENUM_OFFSET;
			this.$event.keyCode = keyCode;
			this.$event.keybind = this.$keybinds[keyCode];
		}

		this.$eventDown = new this.Event();
		this.$event = new this.Event();		
	},

	keybind: function(keybind, keys)
	{
		if(keys instanceof Array)
		{
			for(var n = 0; n < keys.length; n++) 
			{
				var key = keys[n];
				this.keybinds[key] = keybind;
				this.keybindMap[keybind] = key;
			}
		}
		else {
			this.keybinds[keys] = keybind;
			this.keybindMap[keybind] = keys;
		}
	},

	isDown: function(key) {
		return this.keys[key];
	},

	isUp: function(key) {
		return !this.keys[key];
	},

	isKeybindDown: function(keybind) {
		return this.keys[this.keybindMap[keybind]]
	},

	isKeybindUp: function(keybind) {
		return !this.keys[this.keybindMap[keybind]]
	},	

	checkIgnoreKey: function(domEvent, keyCode)
	{
		if(document.activeElement === document.body)
		{
			if(window.top && this.iframeKeys[keyCode]) {
				domEvent.preventDefault();
			}

			if(this.cmdKeys[keyCode] !== undefined) {
				this.numCmdKeysPressed++;
			}

			if(this.ignoreKeys[keyCode] !== undefined && this.numCmdKeysPressed <= 0) {
				domEvent.preventDefault();
			}
		}		
	},

	updateRepeatKey: function(keyCode)
	{
		if(!this.repeatKey) { return; }

		if(!this.$repeatTimer) {
			this.$repeatTimer = meta.addTimer(this, this.repeatFunc, this.repeatDelay);
		}
		
		this.repeatKey = keyCode;
		this.$repeatTimer.reset();
	},

	repeatFunc: function()
	{
		this.$eventDown.domEvent = domEvent;
		this.$eventDown.prevScreenX = 0;
		this.$eventDown.prevScreenY = 0;
		this.$eventDown.screenX = 0;
		this.$eventDown.screenY = 0;
		this.$eventDown.x = 0;
		this.$eventDown.y = 0;
		this.$eventDown.keyCode = keyCode;
		this.$eventDown.keybind = this.keybinds[keyCode] || null;

		meta.emit("input.down", $this.eventDown);
	},

	$addEventListeners: function()
	{
		var self = this;
		window.addEventListener("mousedown", function(event) { self.handleMouseDown(event); });
		window.addEventListener("mouseup", function(event) { self.handleMouseUp(event); });
		window.addEventListener("mousemove", function(event) { self.handleMouseMove(event); });
		window.addEventListener("dblclick", function(event) { self.handleMouseDbClick(event); });
		window.addEventListener("touchstart", function(event) { self.handleTouchDown(event); });
		window.addEventListener("touchend", function(event) { self.handleTouchUp(event); });
		window.addEventListener("touchmove", function(event) { self.handleTouchMove(event); });
		window.addEventListener("touchcancel", function(event) { self.handleTouchUp(event); });
		window.addEventListener("touchleave", function(event) { self.handleTouchUp(event); });

		if(meta.device.support.onkeydown)	{
			window.addEventListener("keydown", function(event) { self.handleKeyDown(event); });
		}

		if(meta.device.support.onkeyup)	{
			window.addEventListener("keyup", function(event) { self.handleKeyUp(event); });
		}
	},

	$loadIgnoreKeys: function()
	{
		this.ignoreKeys = {};
		this.ignoreKeys[8] = 1;
		this.ignoreKeys[9] = 1;
		this.ignoreKeys[13] = 1;
		this.ignoreKeys[17] = 1;
		this.ignoreKeys[91] = 1;
		this.ignoreKeys[38] = 1; 
		this.ignoreKeys[39] = 1; 
		this.ignoreKeys[40] = 1; 
		this.ignoreKeys[37] = 1;
		this.ignoreKeys[124] = 1;
		this.ignoreKeys[125] = 1;
		this.ignoreKeys[126] = 1;		

		this.cmdKeys[91] = 1;
		this.cmdKeys[17] = 1;

		this.iframeKeys[37] = 1;
		this.iframeKeys[38] = 1;
		this.iframeKeys[39] = 1;
		this.iframeKeys[40] = 1;
	},

	ignoreFKeys: function(value) 
	{
		this.ignoreKeys[112] = value;
		this.ignoreKeys[113] = value;
		this.ignoreKeys[114] = value;
		this.ignoreKeys[115] = value;
		this.ignoreKeys[116] = value;
		this.ignoreKeys[117] = value;
		this.ignoreKeys[118] = value;
		this.ignoreKeys[119] = value;
		this.ignoreKeys[120] = value;
		this.ignoreKeys[121] = value;
		this.ignoreKeys[122] = value;
		this.ignoreKeys[123] = value;
	},

	set ignoreFKeys(flag) 
	{
		if(flag) {
			this.$ignoreFKeys(1);
		}
		else {
			this.$ignoreFKeys(0);
		}
	},

	get ignoreFKeys() { 
		return !!this.$ignoreKeys[112]; 
	},	

	Event: function()
	{
		this.domEvent = null;
		this.x = 0;
		this.y = 0;
		this.prevScreenX = 0;
		this.prevScreenY = 0;
		this.screenX = 0;
		this.screenY = 0;
		this.keyCode = 0;
		this.keybind = null;
		this.entity = null;
	},

	//
	keys: null,
	keybinds: null,
	touches: [],
	keybindMap: {},

	ignoreKeys: {},
	cmdKeys: {},
	iframeKeys: {},

	enable: true,
	stickyKeys: false,
	numCmdKeysPressed: 0,

	$repeatTimer: null,
	repeatKey: false,
	repeatDelay: 200,

	x: 0,
	y: 0,
	screenX: 0,
	screenY: 0,
	prevScreenX: 0,
	prevScreenY: 0,

	$numKeys: 256,
	$numInputs: 10,
	BUTTON_ENUM_OFFSET: 2000
};

meta.input.key =
{
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	ESC: 27,
	SPACE: 32,

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,

	DELETE: 46,	

	NUM_0: 48,
	NUM_1: 49,
	NUM_2: 50,
	NUM_3: 51,
	NUM_4: 52,
	NUM_5: 53,
	NUM_6: 54,
	NUM_7: 55,
	NUM_8: 56,
	NUM_9: 57,
	NUMPAD_0: 96,
	NUMPAD_1: 97,
	NUMPAD_2: 98,
	NUMPAD_3: 99,
	NUMPAD_4: 100,
	NUMPAD_5: 101,
	NUMPAD_6: 102,
	NUMPAD_7: 103,
	NUMPAD_8: 104,
	NUMPAD_9: 105,
	MULTIPLY: 106,
	ADD: 107,
	SUBTRACT: 109,
	DECIMAL: 110,
	DIVIDE: 111,

	A: 65,
	B: 66,
	C: 67,
	D: 68,
	E: 69,
	F: 70,
	G: 71,
	H: 72,
	I: 73,
	J: 74,
	K: 75,
	L: 76,
	M: 77,
	N: 78,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	V: 86,
	W: 87,
	X: 88,
	Y: 89,
	Z: 90,
	SQUARE_BRACKET_LEFT: 91,
	SQUARE_BRACKET_RIGHT: 91,
	PARENTHESES_LEFT: 91,
	PARENTHESES_RIGHT: 91,
	BRACES_LEFT: 91,
	BRACES_RIGHT: 92,

	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,

	PLUS: 187,
	MINUS: 189,

	TILDE: 192,
	APOSTROPHE: 222,

	BUTTON_LEFT: 0 + meta.input.BUTTON_ENUM_OFFSET,
	BUTTON_MIDDLE: 1 + meta.input.BUTTON_ENUM_OFFSET,
	BUTTON_RIGHT: 2 + meta.input.BUTTON_ENUM_OFFSET
};

meta.input.setup();
