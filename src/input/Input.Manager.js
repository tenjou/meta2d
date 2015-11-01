"use strict";

/**
 * @property keys {Array} Buffer with flags if key is pressed.
 * @property inputs {Array} Buffer with flags if input is pressed.
 * @property blockInput {boolean} Flag if input should be blocked.
 * @property stickyKeys {boolean} Flag if keys are sticky. (Input is not repeated if user holds key)
 * @property numKeys {number} Number of keys supported.
 * @property numInputs {number} Number of inputs supported. (Touches or mouse buttons)
 */
meta.class("Input.Manager",
{
	init: function()
	{
		var numTotalKeys = this.numKeys + this.numInputs + 1;
		this.keys = new Array(numTotalKeys);
		this.touches = [];
		this.pressed = {};

		this.keybind = {};

		this._event =
		{
			event: null,
			type: "",
			x: 0,
			y: 0,
			prevScreenX: 0,
			prevScreenY: 0,
			screenX: 0,
			screenY: 0,
			keyCode: 0,
			entity: null
		};

		this._addEventListeners();
		this._loadIgnoreKeys();
		meta.engine.onBlur.add(this.resetInput, this);

		this.keyID = new Array(numTotalKeys);
		var keyEnum = Input.Key;
		for(var key in keyEnum) {
			this.keyID[keyEnum[key]] = key;
		}
	},

	/** Add all DOM input event listeners. */
	_addEventListeners: function()
	{
		this.onDown = meta.createChannel(Input.Event.DOWN);
		this.onUp = meta.createChannel(Input.Event.UP);
		this.onMove = meta.createChannel(Input.Event.MOVE);
		this.onClick = meta.createChannel(Input.Event.CLICK);
		this.onDbClick = meta.createChannel(Input.Event.DBCLICK);

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

	/**
	 * Callback onKeyDown.
	 * @param event {Event} DOM event object.
	 */
	handleKeyDown: function(event)
	{
		var keyCode = event.keyCode;

		// Skip default behaviour for some keys.
		if(document.activeElement === document.body)
		{
			if(window.top && this._iframeKeys[keyCode]) {
				event.preventDefault();
			}

			if(this._cmdKeys[keyCode] !== void(0)) {
				this._numCmdKeys++;
			}

			if(this._ignoreKeys[keyCode] !== void(0) && this._numCmdKeys <= 0) {
				event.preventDefault();
			}
		}

		//
		if(this.blockInput) { return; }

		if(this.stickyKeys && this.keys[keyCode]) {
			return;
		}

		if(event.keyIdentifier === "Meta") {
			this.metaPressed = true;
		}
		else if(this.metaPressed) { 
			return;
		}

		this.keys[keyCode] = 1;
		this.pressed[this.keyID[keyCode]] = 1;

		if(this._keybindMap && this._keybindMap[keyCode]) 
		{
			var buffer = this._keybindMap[keyCode];
			var num = buffer.length;
			for(var n = 0; n < num; n++) {
				this.keybind[buffer[n]] = 1;
			}
		}

		this._event.event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.screenX = 0;
		this._event.screenY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = keyCode;

		this.onDown.emit(this._event, Input.Event.DOWN);

		if(this.keyRepeat)
		{
			if(!this._inputTimer)
			{
				var self = this;
				this._inputTimer = meta.addTimer(this, 
					function() {
						self._event.keyCode = self._repeatKey;
						self.onDown.emit(self._event, Input.Event.DOWN);
					}, this.keyRepeat);
			}

			this._repeatKey = keyCode;
			this._inputTimer.resume();
			this._inputTimer.tAccumulator = 0.0;
		}
	},

	/**
	 * Callback onKeyUp.
	 * @param event {Event} DOM event object.
	 */
	handleKeyUp: function(event)
	{
		var keyCode = event.keyCode;

		// Skip default behaviour for some keys.
		if(document.activeElement === document.body)
		{		
			if(window.top && this._iframeKeys[keyCode]) {
				event.preventDefault();
			}

			if(this._cmdKeys[keyCode] !== void(0) && this.keys[keyCode]) {
				this._numCmdKeys--;
			}

			if(this._ignoreKeys[keyCode] === void(0) && this._numCmdKeys <= 0) {
				event.preventDefault();
			}
		}

		//
		if(this.blockInput) { return; }

		this.metaPressed = false;
		this.keys[keyCode] = 0;
		this.pressed[this.keyID[keyCode]] = 0;

		if(this._keybindMap && this._keybindMap[keyCode]) {
			var buffer = this._keybindMap[keyCode];
			var num = buffer.length;
			for(var n = 0; n < num; n++) {
				this.keybind[buffer[n]] = 0;
			}
		}		

		this._event.event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.prevX = 0;
		this._event.prevY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = keyCode;

		this.onUp.emit(this._event, Input.Event.UP);

		if(this.keyRepeat && this._inputTimer) {
			this._inputTimer.pause();
		}
	},

	/**
	 * Callback onMouseDown.
	 * @param event {Event} DOM event object.
	 */
	handleMouseDown: function(event)
	{
		if(this.blockInput) { return; }

		var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
		this.keys[keyCode] = 1;
		this.pressed[this.keyID[keyCode]] = keyCode;

		if(this._keybindMap && this._keybindMap[keyCode]) {
			var buffer = this._keybindMap[keyCode];
			var num = buffer.length;
			for(var n = 0; n < num; n++) {
				this.keybind[buffer[n]] = 1;
			}
		}		

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = keyCode;

		this.onDown.emit(this._event, Input.Event.DOWN);

		this._event.entity = null;
	},

	/**
	 * Callback onMouseUp.
	 * @param event {Event} DOM event object.
	 */
	handleMouseUp: function(event)
	{
		if(this.blockInput) { return; }

		var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
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
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = keyCode;

		this.onUp.emit(this._event, Input.Event.UP);
		this.onClick.emit(this._event, Input.Event.CLICK);

		this._event.entity = null;
	},

	/**
	 * Callback onMouseMove.
	 * @param event {Event} DOM event object.
	 */
	handleMouseMove: function(event)
	{
		if(document.activeElement === document.body) {
			event.preventDefault();
		}

		if(this.blockInput) { return; }

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = -1;

		this.onMove.emit(this._event, Input.Event.MOVE);
		this._event.entity = null;
	},

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
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * this.engine.ratio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * this.engine.ratio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = keyCode;

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
			if(id === 0) {
				this._event.prevScreenX = this._event.screenX;
				this._event.prevScreenY = this._event.screenY;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;				
			}
			else {
				this._event.prevScreenX = screenX;
				this._event.prevScreenY = screenY;
			}
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = id;

			this.onDown.emit(this._event, Input.Event.UP);
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
			if(id === 0) {
				this._event.prevScreenX = this._event.screenX;
				this._event.prevScreenY = this._event.screenY;
				this.inputX = x;
				this.inputY = y;
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;				
			}
			else {
				this._event.prevScreenX = screenX;
				this._event.prevScreenY = screenY;
			}
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = keyCode;

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
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.inputX;
		this._event.y = this.inputY;
		this._event.keyCode = -1;	

		return this._event;	
	},

	_loadIgnoreKeys: function()
	{
		this._ignoreKeys = [];
		this._ignoreKeys[8] = 1;
		this._ignoreKeys[9] = 1;
		this._ignoreKeys[13] = 1;
		this._ignoreKeys[17] = 1;
		this._ignoreKeys[91] = 1;
		this._ignoreKeys[38] = 1; this._ignoreKeys[39] = 1; this._ignoreKeys[40] = 1; this._ignoreKeys[37] = 1;

		this._ignoreKeys[124] = 1;
		this._ignoreKeys[125] = 1;
		this._ignoreKeys[126] = 1;		

		this._cmdKeys = [];
		this._cmdKeys[91] = 1;
		this._cmdKeys[17] = 1;

		this._iframeKeys = [];
		this._iframeKeys[37] = 1;
		this._iframeKeys[38] = 1;
		this._iframeKeys[39] = 1;
		this._iframeKeys[40] = 1;
	},

	_ignoreFKeys: function(value) 
	{
		this._ignoreKeys[112] = value;
		this._ignoreKeys[113] = value;
		this._ignoreKeys[114] = value;
		this._ignoreKeys[115] = value;
		this._ignoreKeys[116] = value;
		this._ignoreKeys[117] = value;
		this._ignoreKeys[118] = value;
		this._ignoreKeys[119] = value;
		this._ignoreKeys[120] = value;
		this._ignoreKeys[121] = value;
		this._ignoreKeys[122] = value;
		this._ignoreKeys[123] = value;
	},

	set ignoreFKeys(flag) 
	{
		if(flag) {
			this._ignoreFKeys(1);
		}
		else {
			this._ignoreFKeys(0);
		}
	},

	get ignoreFKeys() { return !!this._ignoreKeys[112]; },

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

	addKeybind: function(keybind, keys)
	{
		if(!this._keybindMap) {
			this._keybindMap = new Array(this.numKeys + this.numInputs + 1);
		}

		var key;
		var numKeys = keys.length;
		for(var n = 0; n < numKeys; n++) 
		{
			key = keys[n];
			if(!this._keybindMap[key]) {
				this._keybindMap[key] = [ keybind ];
			}
			else {
				this._keybindMap[key].push(keybind);
			}
		}
	},

	isDown: function(key) {
		return this.keys[key];
	},

	isUp: function(key) {
		return !this.keys[key];
	},

	//
	onDown: null,
	onUp: null,
	onMove: null,
	onClick: null,
	onDbClick: null,

	//
	engine: meta.engine,

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

	_event: null,

	_ignoreKeys: null,
	_cmdKeys: null,
	_iframeKeys: null,
	_numCmdKeys: 0
});
