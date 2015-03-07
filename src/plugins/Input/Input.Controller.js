"use strict";

/**
 * @namespace
 */
window.Input = {};

/**
 * @description Input handler.
 * @class Input.Controller
 * @extends meta.Plugin
 * @property keys {Array} Buffer with flags if key is pressed.
 * @property inputs {Array} Buffer with flags if input is pressed.
 * @property blockInput {boolean} Flag if input should be blocked.
 * @property isStickyKeys {boolean} Flag if keys are sticky. (Input is not repeated if user holds key)
 * @property numKeys {number} Number of keys supported.
 * @property numInputs {number} Number of inputs supported. (Touches or mouse buttons)
 * @memberof! <global>
 */
Input.Controller = meta.Controller.extend
({
	/**
	 * @description Constructor.
	 */
	init: function()
	{
		this.engine = meta.engine;

		this.keys = new Array(this.numKeys);
		this.inputs = new Array(this.numInputs);
		this.touches = [];

		this._event =
		{
			event: null,
			x: 0,
			y: 0,
			prevScreenX: 0,
			prevScreenY: 0,
			screenX: 0,
			screenY: 0,
			keyCode: 0,
			entity: null
		};

		this.addEventListeners();
		this._loadIgnoreKeys();
		meta.subscribe(this, meta.Event.FOCUS, this.onFocus);
	},

	/**
	 * @description Destructor.
	 */
	release: function()	{
		this.removeEventListeners();
		meta.unsubscribe(this, meta.Event.FOCUS, this.onFocus);
	},

	/**
	 * @description Callback onKeyDown.
	 * @param event {Event} DOM event object.
	 */
	onKeyDown: function(event)
	{
		// Skip default behaviour for some keys.
		if(window.top && this._iFrameKeys[event.keyCode]) {
			event.preventDefault();
		}

		if(this._cmdKeys[event.keyCode] !== void(0)) {
			this._numCmdKeys++;
		}

		if(this._ignoreKeys[event.keyCode] !== void(0) && this._numCmdKeys <= 0) {
			event.preventDefault();
		}

		//
		if(this.blockInput) { return; }

		if(this.isStickyKeys && this.keys[event.keyCode]) {
			return;
		}

		this.keys[event.keyCode] = true;

		this._event.event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.screenX = 0;
		this._event.screenY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = event.keyCode;

		this.chn.keyDown.emit(this._event, Input.Event.KEY_DOWN);

		if(this._callbacks && this._callbacks[event.keyCode]) 
		{
			var cbs = this._callbacks[event.keyCode];
			var numCbs = cbs.length;
			for(var i = 0; i < numCbs; i++) {
				cbs[i]();
			}
		}

		if(this.keyRepeat)
		{
			if(!this._inputTimer)
			{
				var self = this;
				this._inputTimer = meta.addTimer(this, function() {
					self._event.keyCode = self._repeatKey;
					self.chn.keyDown.emit(self._event, Input.Event.KEY_DOWN);
				}, this.keyRepeat);
			}

			this._repeatKey = event.keyCode;
			this._inputTimer.resume();
			this._inputTimer.tAccumulator = 0.0;
		}
	},

	/**
	 * @description Callback onKeyUp.
	 * @param event {Event} DOM event object.
	 */
	onKeyUp: function(event)
	{
		// Skip default behaviour for some keys.
		if(window.top && this._iFrameKeys[event.keyCode]) {
			event.preventDefault();
		}

		if(this._cmdKeys[event.keyCode] !== void(0) && this.keys[event.keyCode]) {
			this._numCmdKeys--;
		}

		if(this._ignoreKeys[event.keyCode] === void(0) && this._numCmdKeys <= 0) {
			event.preventDefault();
		}

		//
		if(this.blockInput) { return; }

		this.keys[event.keyCode] = false;

		this._event.event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.prevX = 0;
		this._event.prevY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = event.keyCode;
		this._e

		this.chn.keyUp.emit(this._event, Input.Event.KEY_UP);

		if(this.keyRepeat && this._inputTimer) {
			this._inputTimer.pause();
		}
	},


	/**
	 * @description Callback onMouseDown.
	 * @param event {Event} DOM event object.
	 */
	onMouseDown: function(event)
	{
		if(this.blockInput) { return; }

		this.inputs[event.button] = true;

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = event.button;

		this.chn.inputDown.emit(this._event, Input.Event.DOWN);
		this._event.entity = null;
	},

	/**
	 * @description Callback onMouseUp.
	 * @param event {Event} DOM event object.
	 */
	onMouseUp: function(event)
	{
		if(this.blockInput) { return; }

		this.inputs[event.button] = false;

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = event.button;

		this.chn.inputUp.emit(this._event, Input.Event.UP);
		this.chn.inputClick.emit(this._event, Input.Event.CLICK);
		this._event.entity = null;
	},

	/**
	 * @description Callback onMouseMove.
	 * @param event {Event} DOM event object.
	 */
	onMouseMove: function(event)
	{
		event.preventDefault();

		if(this.blockInput) { return; }

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
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

		this.chn.inputMove.emit(this._event, Input.Event.MOVE);
		this._event.entity = null;
	},

	/**
	 * @description Callback onMouseDbClick.
	 * @param event {Event} DOM event object.
	 */
	onMouseDbClick: function(event)
	{
		if(this.blockInput) { return; }

		this.inputs[event.button] = false;

		var scope = meta;
		var camera = scope.camera;
		this.screenX = ((event.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
		this.screenY = ((event.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
		this.x = (this.screenX * camera.zoomRatio) + camera.volume.x | 0;
		this.y = (this.screenY * camera.zoomRatio) + camera.volume.y | 0;

		this._event.event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = this.screenX;
		this._event.screenY = this.screenY;
		this._event.x = this.x;
		this._event.y = this.y;
		this._event.keyCode = event.button;

		this.chn.inputDbClick.emit(this._event, Input.Event.DBCLICK);
		this._event.entity = null;
	},

	/**
	 * @description Callback onTouchDown.
	 * @param event {Event} DOM event object.
	 */
	onTouchDown: function(event)
	{
		event.preventDefault();

		var scope = meta;
		var camera = scope.camera;

		var touch, screenX, screenY, x, y, id;
		var changedTouches = event.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			id = this.touches.length;
			touch = event.changedTouches[i];
			this.touches.push(touch.identifier);
			this.numTouches++;

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

			this._event.event = event;
			this._event.prevScreenX = screenX;
			this._event.prevScreenY = screenY;
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = id;

			if(id === 0) {
				this.screenX = screenX;
				this.screenY = screenY;
				this.x = x;
				this.y = y;
			}

			this.chn.inputDown.emit(this._event, Input.Event.DOWN);
			this._event.entity = null;
		}
	},

	/**
	 * @description Callback onTouchUp.
	 * @param event {Event} DOM event object.
	 */
	onTouchUp: function(event)
	{
		event.preventDefault();

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

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

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

			this.chn.inputDown.emit(this._event, Input.Event.UP);
			this.chn.inputClick.emit(this._event, Input.Event.CLICK);
			this._event.entity = null;
		}
	},

	/**
	 * @description Callback onTouchMove.
	 * @param event {Event} DOM event object.
	 */
	onTouchMove: function(event)
	{
		event.preventDefault();

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

			screenX = ((touch.pageX - this.engine.offsetLeft) * this.engine.scaleX) * window.devicePixelRatio;
			screenY = ((touch.pageY - this.engine.offsetTop) * this.engine.scaleY) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) + camera.volume.x) | 0;
			y = ((screenY * camera.zoomRatio) + camera.volume.y) | 0;

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
			this._event.keyCode = id;

			this.chn.inputMove.emit(this._event, Input.Event.MOVE);
			this._event.entity = null;
		}
	},


	/**
	 * @description Callback onFocus.
	 * @param event {meta.Event.FOCUS} Type of event.
	 * @param data {boolean} Flag if window is focused.
	 */
	onFocus: function(event, data)
	{
		if(data === false) {
			this.resetInput();
		}
	},

	/**
	 * @description Check if key is pressed
	 * @param keyCode {number} Key code index.
	 * @returns {boolean}
	 */
	isDown: function(keyCode) {
		return this.keys[keyCode];
	},

	/**
	 * @description Check if input is pressed
	 * @param keyCode {number} Key code index.
	 * @returns {boolean}
	 */
	isInputDown: function(keyCode) {
		return this.inputs[keyCode] || (this.numTouches - 1) === keyCode;
	},

	/**
	 * Add all DOM input event listeners.
	 */
	addEventListeners: function()
	{
		var self = this;

		this.chn = {
			keyDown: meta.createChannel(Input.Event.KEY_DOWN),
			keyUp: meta.createChannel(Input.Event.KEY_UP),
			inputDown: meta.createChannel(Input.Event.DOWN),
			inputUp: meta.createChannel(Input.Event.UP),
			inputMove: meta.createChannel(Input.Event.MOVE),
			inputClick: meta.createChannel(Input.Event.CLICK),
			inputDbClick: meta.createChannel(Input.Event.DBCLICK)
		};

		this.func = 
		{
			keyDown: function(event) { self.onKeyDown(event); },
			keyUp: function(event) { self.onKeyUp(event); },
			mouseDown: function(event) { self.onMouseDown(event); },
			mouseUp: function(event) { self.onMouseUp(event); },
			mouseDbClick: function(event) { self.onMouseDbClick(event); },
			mouseMove: function(event) { self.onMouseMove(event); },
			touchDown: function(event) { self.onTouchDown(event); },
			touchUp: function(event) { self.onTouchUp(event); },
			touchMove: function(event) { self.onTouchMove(event); },
			touchCancel: function(event) { self.onTouchCancel(event); }
		};

		window.addEventListener("mousedown", this.func.mouseDown);
		window.addEventListener("mouseup", this.func.mouseUp);
		window.addEventListener("mousemove", this.func.mouseMove);
		window.addEventListener("dblclick", this.func.mouseDbClick);
		window.addEventListener("touchstart", this.func.touchDown);
		window.addEventListener("touchend", this.func.touchUp);
		window.addEventListener("touchmove", this.func.touchMove);
		window.addEventListener("touchcancel", this.func.touchUp);
		window.addEventListener("touchleave", this.func.touchUp);

		if(meta.device.support.onkeydown)	{
			window.addEventListener("keydown", this.func.keyDown);
		}

		if(meta.device.support.onkeyup)	{
			window.addEventListener("keyup", this.func.keyUp);
		}
	},

	/**
	 * Remove all DOM input event listeners.
	 */
	removeEventListeners: function()
	{
		window.removeEventListener("mousedown", this.func.mouseDown);
		window.removeEventListener("mouseup", this.func.mouseUp);
		window.removeEventListener("mousemove", this.on.mouseMove);
		window.removeEventListener("dblclick", this.on.mouseDbClick);
		window.removeEventListener("touchstart", this.on.touchDown);
		window.removeEventListener("touchend", this.on.touchUp);
		window.removeEventListener("touchmove", this.on.touchMove);
		window.removeEventListener("touchcancel", this.on.touchUp);
		window.removeEventListener("touchleave", this.on.touchUp);

		if(meta.device.support.onkeydown)	{
			window.removeEventListener("keydown", this.on.keyDown);
		}

		if(meta.device.support.onkeyup)	{
			window.removeEventListener("keyup", this.on.keyUp);
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

		// Reset key presses.
		for(i = 0; i < this.numKeys; i++)
		{
			if(this.keys[i]) {
				this.keys[i] = false;
				this._event.keyCode = i;
				this.chn.keyUp.emit(this._event, Input.Event.KEYUP);
			}
		}

		// Reset input presses (mouse or touches).
		for(i = 0; i < this.numInputs; i++)
		{
			if(this.inputs[i]) {
				this.inputs[i] = false;
				this._event.keyCode = i;
				this.chn.inputUp.emit(this._event, Input.Event.UP);
			}
		}

		this._numCmdKeys = 0;

		// Reset touches.
		if(this.numTouches)
		{
			for(i = 0; i < this.numTouches; i++) {
				this._event.keyCode = i;
				this.chn.inputUp.emit(this._event, Input.Event.UP);
			}

			this.touches.length = 0;
			this.numTouches = 0;
		}
	},


	onKey: function(key, cb) 
	{
		if(!this._callbacks) { 
			this._callbacks = {};
			this._callbacks[key] = [ cb ];
		}
		else
		{
			if(!this._callbacks[key]) {
				this._callbacks[key] = [ cb ];
			}
			else {
				this._callbacks[key].push(cb);
			}
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

		this._iFrameKeys = [];
		this._iFrameKeys[37] = 1;
		this._iFrameKeys[38] = 1;
		this._iFrameKeys[39] = 1;
		this._iFrameKeys[40] = 1;
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

	//
	engine: meta.engine,
	chn: null,
	func: null,

	keys: null,
	inputs: null,
	touches: null,

	blockInput: false,
	isStickyKeys: true,

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
	_iFrameKeys: null,
	_numCmdKeys: 0,

	_callbacks: null
});