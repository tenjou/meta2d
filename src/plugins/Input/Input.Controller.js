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
( /** @lends Input.Controller.prototype */ {

	/**
	 * @description Constructor.
	 */
	init: function()
	{
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

		if(this._ignoreKeys[event.keyCode] === void(0) && this._numCmdKeys <= 0) {
			event.preventDefault();
		}

		//
		if(this.blockInput) { return; }

		if(this.isStickyKeys && this.keys[event.keyCode]) {
			return;
		}

		this.keys[event.keyCode] = true;

		this._event.Event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.screenX = 0;
		this._event.screenY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = event.keyCode;

		this._chnKeyDown.emit(this._event, Input.Event.KEY_DOWN);

		if(this.keyRepeat)
		{
			if(!this._inputTimer)
			{
				var self = this;
				this._inputTimer = meta.addTimer(this, function() {
					self._event.keyCode = self._repeatKey;
					self._chnKeyDown.emit(self._event, Input.Event.KEY_DOWN);
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

		this._event.Event = event;
		this._event.prevScreenX = 0;
		this._event.prevScreenY = 0;
		this._event.prevX = 0;
		this._event.prevY = 0;
		this._event.x = 0;
		this._event.y = 0;
		this._event.keyCode = event.keyCode;

		this._chnKeyUp.emit(this._event, Input.Event.KEY_UP);

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
		var screenX = (event.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
		var screenY = (event.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
		var x = ((screenX * camera.zoomRatio) - camera._x) | 0;
		var y = ((screenY * camera.zoomRatio) - camera._y) | 0;

		this._event.Event = event;
		this._event.prevScreenX = screenX;
		this._event.prevScreenY = screenY;
		this._event.screenX = screenX;
		this._event.screenY = screenY;
		this._event.x = x;
		this._event.y = y;
		this._event.keyCode = event.button;

		this._chnInputDown.emit(this._event, Input.Event.INPUT_DOWN);
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
		var screenX = (event.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
		var screenY = (event.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
		var x = ((screenX * camera.zoomRatio) - camera._x) | 0;
		var y = ((screenY * camera.zoomRatio) - camera._y) | 0;

		this._event.Event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = screenX;
		this._event.screenY = screenY;
		this._event.x = x;
		this._event.y = y;
		this._event.keyCode = event.button;

		this._chnInputUp.emit(this._event, Input.Event.INPUT_UP);
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
		var screenX = (event.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
		var screenY = (event.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
		var x = ((screenX * camera.zoomRatio) - camera._x) | 0;
		var y = ((screenY * camera.zoomRatio) - camera._y) | 0;

		this._event.Event = event;
		this._event.prevScreenX = this._event.screenX;
		this._event.prevScreenY = this._event.screenY;
		this._event.screenX = screenX;
		this._event.screenY = screenY;
		this._event.x = x;
		this._event.y = y;
		this._event.keyCode = -1;

		this.inputX = x;
		this.inputY = y;

		this._chnInputMove.emit(this._event, Input.Event.INPUT_MOVE);
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

		var touch, screenX, screenY, x, y;
		var changedTouches = event.changedTouches;
		var numTouches = changedTouches.length;
		for(var i = 0; i < numTouches; i++)
		{
			touch = event.changedTouches[i];
			this.touches.push(touch.identifier);
			this.numTouches++;

			screenX = (touch.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
			screenY = (touch.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) - camera._x) | 0;
			y = ((screenY * camera.zoomRatio) - camera._y) | 0;

			this._event.Event = event;
			this._event.prevScreenX = screenX;
			this._event.prevScreenY = screenY;
			this._event.screenX = screenX;
			this._event.screenY = screenY;
			this._event.x = x;
			this._event.y = y;
			this._event.keyCode = this.numTouches-1;

			this._chnInputDown.emit(this._event, Input.Event.INPUT_DOWN);
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

			screenX = (touch.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
			screenY = (touch.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) - camera._x) | 0;
			y = ((screenY * camera.zoomRatio) - camera._y) | 0;

			this._event.Event = event;
			if(id === 0) {
				this._event.prevScreenX = this._event.screenX;
				this._event.prevScreenY = this._event.screenY;
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

			this._chnInputDown.emit(this._event, Input.Event.INPUT_UP);
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

			screenX = (touch.pageX - scope.engine.unsubscribesetLeft) * window.devicePixelRatio;
			screenY = (touch.pageY - scope.engine.unsubscribesetTop) * window.devicePixelRatio;
			x = ((screenX * camera.zoomRatio) - camera._x) | 0;
			y = ((screenY * camera.zoomRatio) - camera._y) | 0;

			this._event.Event = event;
			if(id === 0) {
				this._event.prevScreenX = this._event.screenX;
				this._event.prevScreenY = this._event.screenY;
				this.inputX = x;
				this.inputY = y;
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

			this._chnInputMove.emit(this._event, Input.Event.INPUT_MOVE);
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
		return this.inputs[keyCode];
	},

	/**
	 * Add all DOM input event listeners.
	 */
	addEventListeners: function()
	{
		var self = this;

		this._chnKeyDown = meta.createChannel(Input.Event.KEY_DOWN);
		this._chnKeyUp = meta.createChannel(Input.Event.KEY_UP);
		this._chnInputDown = meta.createChannel(Input.Event.INPUT_DOWN);
		this._chnInputUp = meta.createChannel(Input.Event.INPUT_UP);
		this._chnInputMove = meta.createChannel(Input.Event.INPUT_MOVE);

		this._onKeyDown = function(event) { self.onKeyDown(event); };
		this._onKeyUp = function(event) { self.onKeyUp(event); };
		this._onMouseDown = function(event) { self.onMouseDown(event); };
		this._onMouseUp = function(event) { self.onMouseUp(event); };
		this._onMouseMove = function(event) { self.onMouseMove(event); };
		this._onTouchDown = function(event) { self.onTouchDown(event); };
		this._onTouchUp = function(event) { self.onTouchUp(event); };
		this._onTouchMove = function(event) { self.onTouchMove(event); };
		this._onTouchCancel = function(event) { self.onTouchCancel(event); };

		window.addEventListener("mousedown", this._onMouseDown);
		window.addEventListener("mouseup", this._onMouseUp);
		window.addEventListener("mousemove", this._onMouseMove);
		window.addEventListener("touchstart", this._onTouchDown);
		window.addEventListener("touchend", this._onTouchUp);
		window.addEventListener("touchmove", this._onTouchMove);
		window.addEventListener("touchcancel", this._onTouchUp);
		window.addEventListener("touchleave", this._onTouchUp);

		if(meta.device.support.onkeydown)	{
			window.addEventListener("keydown", this._onKeyDown);
		}

		if(meta.device.support.onkeyup)	{
			window.addEventListener("keyup", this._onKeyUp);
		}
	},

	/**
	 * Remove all DOM input event listeners.
	 */
	removeEventListeners: function()
	{
		window.removeEventListener("mousedown", this._onMouseDown);
		window.removeEventListener("mouseup", this._onMouseUp);
		window.removeEventListener("mousemove", this._onMouseMove);
		window.removeEventListener("touchstart", this._onTouchDown);
		window.removeEventListener("touchend", this._onTouchUp);
		window.removeEventListener("touchmove", this._onTouchMove);
		window.removeEventListener("touchcancel", this._onTouchUp);
		window.removeEventListener("touchleave", this._onTouchUp);

		if(meta.device.support.onkeydown)	{
			window.removeEventListener("keydown", this._onKeyDown);
		}

		if(meta.device.support.onkeyup)	{
			window.removeEventListener("keyup", this._onKeyUp);
		}
	},


	/**
	 * Reset all inputs. Will send graceful up-event on every active input.
	 */
	resetInput: function()
	{
		var i;

		this._event.Event = null;
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
				this._chnKeyUp.emit(this._event, Input.Event.KEY_UP);
			}
		}

		// Reset input presses (mouse or touches).
		for(i = 0; i < this.numInputs; i++)
		{
			if(this.inputs[i]) {
				this.inputs[i] = false;
				this._event.keyCode = i;
				this._chnInputUp.emit(this._event, Input.Event.INPUT_UP);
			}
		}

		this._numCmdKeys = 0;

		// Reset touches.
		if(this.numTouches)
		{
			for(i = 0; i < this.numTouches; i++) {
				this._event.keyCode = i;
				this._chnInputUp.emit(this._event, Input.Event.INPUT_UP);
			}

			this.touches.length = 0;
			this.numTouches = 0;
		}
	},


	getEvent: function()
	{
		this._event.Event = null;
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
		this._ignoreKeys[112] = 1;
		this._ignoreKeys[113] = 1;
		this._ignoreKeys[114] = 1;
		this._ignoreKeys[115] = 1;
		this._ignoreKeys[116] = 1;
		this._ignoreKeys[117] = 1;
		this._ignoreKeys[118] = 1;
		this._ignoreKeys[119] = 1;
		this._ignoreKeys[120] = 1;
		this._ignoreKeys[121] = 1;
		this._ignoreKeys[122] = 1;
		this._ignoreKeys[123] = 1;
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

	inputX: 0, inputY: 0,

	_event: null,

	_onKeyDown: null,
	_onKeyUp: null,
	_onMouseDown: null,
	_onMouseUp: null,
	_onMouseMove: null,
	_onTouchDown: null,
	_onTouchUp: null,
	_onTouchMove: null,
	_onTouchCancel: null,

	_chnKeyDown: null,
	_chnKeyUp: null,
	_chnInputDown: null,
	_chnInputUp: null,
	_chnInputMove: null,

	_ignoreKeys: null,
	_cmdKeys: null,
	_iFrameKeys: null,
	_numCmdKeys: 0
});