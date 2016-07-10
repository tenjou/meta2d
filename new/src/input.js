"use strict";

meta.input =
{
	setup: function()
	{
		var numTotalKeys = this.numKeys + this.numInputs + 1;
		this.keys = new Array(numTotalKeys);
		this.keybinds = new Array(numTotalKeys);

		this.resetInputs();

		meta.on("blur", this.resetInputs, this);

		this.$loadIgnoreKeys();
		this.$addEventListeners();
	},

	handleKeyDown: function(domEvent)
	{
		var keyCode = domEvent.keyCode;

		this.checkIgnoreKey(keyCode);

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

		this.checkIgnoreKey(keyCode);

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

		if(this.keyRepeat && this.$repeatTimer) {
			this.$repeatTimer.pause();
		}
	},

	handleMouseDown: function(event)
	{
		if(!this.enable) { return; }

		var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
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

		meta.emit("input.down", this.$event);
	},

	handleMouseUp: function(event)
	{
		if(!this.enable) { return; }

		var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
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

		meta.emit("input.down", this.$event);
	},

	handleMouseMove: function(event)
	{
		if(document.activeElement === document.body) {
			event.preventDefault();
		}

		if(!this.enable) { return; }

		var scope = meta;
		var camera = scope.camera;
		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenY;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this.prevScreenX;
		this._event.prevScreenY = this.prevScreenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = -1;

		this.onMove.emit(this._event, Input.Event.MOVE);
		this._event.entity = null;
	},	

	resetInputs: function()
	{
		this.$eventDown = new this.Event();
		this.$event = new this.Event();
	},

	keybind: function(keybind, keys)
	{
		if(keys instanceof Array)
		{
			for(var n = 0; n < keys.length; n++) {
				this.keybinds[keys[n]] = keybind;
			}
		}
		else {
			this.keybinds[keys] = keybind;
		}
	},

	isDown: function(key) {
		return this.keys[key];
	},

	isUp: function(key) {
		return !this.keys[key];
	},

	checkIgnoreKey: function(keyCode)
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
	keys: [],
	keybinds: [],
	touches: [],

	ignoreKeys: {},
	cmdKeys: {},
	iframeKeys: {},

	enable: true,
	stickyKeys: false,

	$repeatTimer: null,
	repeatKey: false,
	repeatDelay: 200,

	x: 0,
	y: 0,
	screenX: 0,
	screenY: 0,
	prevScreenX: 0,
	prevScreenY: 0,

	BUTTON_ENUM_OFFSET: 2000
};

meta.input.setup();

	/**
	 * Callback onMouseDbClick.
	 * @param event {Event} DOM event object.
	 */
	handleMouseDbClick: function(event)
	{
		if(this.blockInput) { return; }

		var keyCode = event.button;
		this.keys[keyCode] = 0;
		this.pressed[this.keyID[keyCode]] = 0;

		if(this._keybindMap && this._keybindMap[keyCode]) {
			var buffer = this._keybindMap[keyCode];
			var num = buffer.length;
			for(var n = 0; n < num; n++) {
				this.keybind[buffer[n]] = 0;
			}
		}		

		var scope = meta;
		var camera = scope.camera;
		this.prevScreenX = this.screenX;
		this.prevScreenY = this.screenY;		
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this.prevScreenX;
		this._event.prevScreenY = this.prevScreenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = keyCode;
		this._event.keyboard = false;

		this.onDbClick.emit(this._event, Input.Event.DBCLICK);

		// Callbacks:
		if(this._onUpCBS && this._onUpCBS[keyCode]) 
		{
			var cbs = this._onUpCBS[keyCode]; 
			var numCbs = cbs.length;
			for(var i = 0; i < numCbs; i++) {
				cbs[i](this._event, Input.Event.UP);
			}
		}

		this._event.entity = null;
	},

	/**
	 * Callback onTouchDown.
	 * @param event {Event} DOM event object.
	 */
	handleTouchDown: function(event)
	{
		if(document.activeElement === document.body) {		
			event.preventDefault();
		}

		var scope = meta;
		var camera = scope.camera;

		var touch, screenX, screenY, x, y, id;
		var changedTouches = event.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			id = this.touches.length - 1;
			touch = event.changedTouches[i];
			this.touches.push(touch.identifier);
			this.numTouches++;

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + Input.BUTTON_ENUM_OFFSET;
			this.keys[keyCode] = 1;

			if(id < 3) 
			{
				this.pressed[this.keyID[keyCode]] = 1;

				if(this._keybindMap && this._keybindMap[keyCode]) {
					var buffer = this._keybindMap[keyCode];
					var num = buffer.length;
					for(var n = 0; n < num; n++) {
						this.keybind[buffer[n]] = 1;
					}
				}				
			}

			this._event.event = event;
			this._event.prevScreenX = screenX;
			this._event.prevScreenY = screenY;
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = keyCode;
			this._event.keyboard = false;

			if(id === 0) {
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;
			}

			this.onDown.emit(this._event, Input.Event.DOWN);

			this._event.entity = null;
		}
	},

	/**
	 * Callback onTouchUp.
	 * @param event {Event} DOM event object.
	 */
	handleTouchUp: function(event)
	{
		if(document.activeElement === document.body) {		
			event.preventDefault();
		}

		var scope = meta;
		var camera = scope.camera;

		var touch, id, screenX, screenY, x, y;
		var changedTouches = event.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			touch = event.changedTouches[i];
			id = this._getTouchID(touch.identifier);
			if(id === -1) { continue; }

			this.touches.splice(id, 1);
			this.numTouches--;

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + Input.BUTTON_ENUM_OFFSET;
			this.keys[keyCode] = 0;

			if(id < 3) 
			{
				this.pressed[this.keyID[keyCode]] = 0;

				if(this._keybindMap && this._keybindMap[keyCode]) {
					var buffer = this._keybindMap[keyCode];
					var num = buffer.length;
					for(var n = 0; n < num; n++) {
						this.keybind[buffer[n]] = 0;
					}
				}				
			}			

			this._event.event = event;
			if(id === 0) 
			{
				this.prevScreenX = this.screenX;
				this.prevScreenY = this.screenY;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;	

				this._event.prevScreenX = this.prevScreenX;
				this._event.prevScreenY = this.prevScreenY;							
			}
			else {
				this._event.prevScreenX = 0;
				this._event.prevScreenY = 0;
			}
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = id;
			this._event.keyboard = false;

			this.onUp.emit(this._event, Input.Event.UP);
			this.onClick.emit(this._event, Input.Event.CLICK);

			this._event.entity = null;
		}
	},

	/**
	 * Callback onTouchMove.
	 * @param event {Event} DOM event object.
	 */
	handleTouchMove: function(event)
	{
		if(document.activeElement === document.body) {		
			event.preventDefault();
		}

		var scope = meta;
		var camera = scope.camera;

		var touch, id, screenX, screenY, x, y;
		var changedTouches = event.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			touch = event.changedTouches[i];
			id = this._getTouchID(touch.identifier);
			if(id === -1) { continue; }

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			var keyCode = id + Input.BUTTON_ENUM_OFFSET;

			this._event.event = event;
			if(id === 0) 
			{
				this.prevScreenX = this.screenX;
				this.prevScreenY = this.screenY;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;	

				this._event.prevScreenX = this.prevScreenX;
				this._event.prevScreenY = this.prevScreenY;					
			}
			else {
				this._event.prevScreenX = screenX;
				this._event.prevScreenY = screenY;
			}
			this._event.screenX = 0;
			this._event.screenY = 0;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = keyCode;
			this._event.keyboard = false;

			this.onMove.emit(this._event, Input.Event.MOVE);
			this._event.entity = null;
		}
	},

	/**
	 * Reset all inputs. Will send graceful up-event on every active input.
	 */
	resetInput: function()
	{
		var i;

		this._event.event = null;
		this._event.prevX = 0;
		this._event.prevY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = 0;
		this._event.keyboard = false;

		this.metaPressed = false;

		// Reset key presses.
		var numTotalKeys = this.numKeys + this.numInputs;
		for(i = 0; i < this.numTotalKeys; i++)
		{
			if(this.keys[i]) {
				this.keys[i] = 0;
				this._event.keyCode = i;
				this.onKeyUp.emit(this._event, Input.Event.UP);
			}
		}

		this.pressed = {};
		this.keybind = {};

		this._numCmdKeys = 0;

		// Reset touches.
		if(this.numTouches)
		{
			for(i = 0; i < this.numTouches; i++) {
				this._event.keyCode = i;
				this.onUp.emit(this._event, Input.Event.UP);
			}

			this.touches.length = 0;
			this.numTouches = 0;
		}
	},

	getEvent: function()
	{
		this._event.event = null;
		this._event.prevScreenX = this.prevScreenX;
		this._event.prevScreenY = this.prevScreenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.inputX;
		this._event.y = this.inputY;
		this._event.keyCode = -1;	

		return this._event;	
	},

	_getTouchID: function(eventTouchID)
	{
		for(var i = 0; i < this.numTouches; i++)
		{
			if(this.touches[i] === eventTouchID) {
				return i;
			}
		}

		return -1;
	},

	keyID: null,

	keys: null,
	touches: null,
	pressed: null,
	keybind: null,
	_keybindMap: null,

	blockInput: false,
	stickyKeys: true,
	metaPressed: false,

	keyRepeat: 0,
	_inputTimer: null,
	_repeatKey: 0,

	numKeys: 256,
	numInputs: 10,
	numTouches: 0,

	x: 0, y: 0,
	screenX: 0, screenY: 0,
	prevScreenX: 0, prevScreenY: 0,

	_event: null,

	_ignoreKeys: null,
	_cmdKeys: null,
	_iframeKeys: null,
	_numCmdKeys: 0
}

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
