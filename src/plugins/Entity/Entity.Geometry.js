"use strict";

Entity.Geometry = meta.Class.extend
({
	_init: function(texture) {
		this.volume = new meta.Volume();
		this.anim = new meta.Anim();
		this.initFromParam(texture);
	},

	initFromParam: function(texture)
	{
		if(texture)
		{
			if(typeof(texture) === "string") 
			{
				var newTexture = Resource.ctrl.getTexture(texture);
				if(!newTexture) {
					console.warn("(Entity.Geometry) Unavailable texture - " + texture);
				}
				else {
					this.texture = newTexture;
				}
			}
			else {
				this.texture = texture;
			}
		}
	},

	/** 
	 * update
	 * @type {function}
	 */
	update: null,

	/** 
	 * draw
	 * @type {function}
	 */
	draw: null,

	/** updatePos */
	updatePos: function()
	{
		this.volume.x = this._x + this._parentX + this.anchorPosX;
		this.volume.y = this._y + this._parentY + this.anchorPosY;
		this.volume.updatePos();

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child.ignoreParentPos) { continue; }

				child._parentX = this.volume.x;
				child._parentY = this.volume.y;
				child.updatePos();
			}
		}

		this.renderer.needRender = true;
	},

	/** 
	 * position
	 * @param x {number}
	 * @param y {number}
	 */
	position: function(x, y) 
	{
		if(this._x === x && this._y === y) { return; }

		this._x = x;
		this._y = y;
		this.updatePos();
	},

	/** 
	 * move
	 * @param x {number}
	 * @param y {number}
	 */
	move: function(x, y) 
	{
		if(x === 0 && y === 0) { return; }

		this._x += x;
		this._y += y;
		this.updatePos();
	},

	moveForward: function(delta)
	{
		var newX = this._x + (delta * Math.cos(this.volume.angle - 1.57079));
		var newY = this._y + (delta * Math.sin(this.volume.angle - 1.57079));

		if(this._x === newX && this._y === newY) { return; }

		this._x = newX;
		this._y = newY;
		this.updatePos();
	},

	moveDirected: function(delta, angleOffset)
	{
		var newX = this._x + (-delta * Math.cos(this.volume.angle - 1.57079 + angleOffset));
		var newY = this._y + (-delta * Math.sin(this.volume.angle - 1.57079 + angleOffset));

		if(this._x === newX && this._y === newY) { return; }

		this._x = newX;
		this._y = newY;
		this.updatePos();	
	},

	strafe: function(delta)
	{
		var newX = this._x + (-delta * Math.cos(this._angleRad + Math.PI));
		var newY = this._y + (-delta * Math.sin(this._angleRad + Math.PI));

		if(this._x === newX && this._y === newY) { return; }

		this._x = newX;
		this._y = newY;
		this.updatePos();	
	},	

	/** 
	 * x
	 * @param x {number}
	 */
	set x(x) { 
		this._x = x;
		this.updatePos();
	},

	/** 
	 * y
	 * @param x {number}
	 */
	set y(y) { 
		this._y = y;
		this.updatePos();
	},

	/** 
	 * x
	 * @return {number}
	 */	
	get x() { return this._x; },

	/** 
	 * y
	 * @return {number}
	 */	
	get y() { return this._y; },

	/** 
	 * absX
	 * @return {number}
	 */
	get absX() { return this.volume.x; },

	/** 
	 * absY
	 * @return {number}
	 */		
	get absY() { return this.volume.y; },

	/** 
	 * x
	 * @param z {number}
	 */
	set z(z) 
	{
		if(this._z === z) { return; }
		this._z = z;

		this.updateZ();
	},

	/** 
	 * z
	 * @return {number}
	 */	
	get z() { return this._z; },

	/** updateZ */
	updateZ: function() 
	{
		this.totalZ = this._z + this._parentZ;

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				child = this.children[i];
				child._parentZ = this.totalZ + 1;
				child.updateZ();
			}
		}

		this.renderer.needSortDepth = true;	
	},

	/** 
	 * pivot
	 * @param x {number}
	 * @param y {number}
	 */
	pivot: function(x, y) {
		this.volume.pivot(x, y); 
		meta.renderer.needRender = true;
	},

	/** 
	 * pivotX
	 * @param x {number}
	 */
	set pivotX(x) { 
		this.volume.pivot(x, this.volume.pivotY); 
		meta.renderer.needRender = true;
	},

	/** 
	 * pivotY
	 * @param y {number}
	 */	
	set pivotY(y) { 
		this.volume.pivot(this.volume.pivotX, y); 
		meta.renderer.needRender = true;
	},

	/** 
	 * pivotX
	 * @return {number}
	 */	
	get pivotX() { return this.volume.pivotX; },

	/** 
	 * pivotY
	 * @return {number}
	 */	
	get pivotY() { return this.volume.pivotY; },

	/** 
	 * anchor
	 * @param x {number}
	 * @param y {number}
	 */
	anchor: function(x, y)
	{
		if(y === void(0)) { y = x; }

		this._anchorX = x;
		this._anchorY = y;
		this.updateAnchor();
	},

	/** updateAnchor */
	updateAnchor: function() 
	{
		this.anchorPosX = (this.parent.volume.width) * this._anchorX;
		this.anchorPosY = (this.parent.volume.height) * this._anchorY;
		this.volume.x = this._x + this._parentX + this.anchorPosX;
		this.volume.y = this._y + this._parentY + this.anchorPosY;
		this.volume.updatePos();

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child._ignoreParentPos) { continue; }

				child._parentX = this.volume.x;
				child._parentY = this.volume.y;
				child.updateAnchor();
			}
		}		
	},

	/** 
	 * anchorX
	 * @param x {number}
	 */	
	set anchorX(x) {
		this._anchorX = x;
		this.updateAnchor();
	},

	/** 
	 * anchorY
	 * @param y {number}
	 */		
	set anchorY(y) {
		this._anchorY = y;
		this.updateAnchor();
	},

	/** 
	 * anchorX
	 * @return {number}
	 */	
	get anchorX() { return this._anchorX; },

	/** 
	 * anchorY
	 * @return {number}
	 */		
	get anchroY() { return this._anchorY; },

	/** 
	 * angle
	 * @param value {number}
	 */	
	set angle(value)
	{
		value = (value * Math.PI) / 180;
		if(this.volume.angle === value) { return; }
		
		this._angle = value;
		this.updateAngle();
	},

	/** 
	 * angleRad
	 * @param value {number}
	 */	
	set angleRad(value)
	{
		if(this._angle === value) { return; }

		this._angle = value;
		this.updateAngle();
	},	

	/** 
	 * angle
	 * @return {number}
	 */		
	get angle() { return (this.volume.angle * 180) / Math.PI; },

	/** 
	 * angleRad
	 * @return {number}
	 */			
	get angleRad() { return this.volume.angle; },

	/** updateAngle */
	updateAngle: function()
	{
		this.volume.rotate(this._angle + this._parentAngle);

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child._ignoreParentAngle) { continue; }

				child._parentAngle = this.volume.angle;
				child.updateAngle();
			}
		}

		this.renderer.needRender = true;
	},

	/** 
	 * scale
	 * @param x {number}
	 * @param y {number}
	 */
	scale: function(x, y) 
	{
		if(y === void(0)) { y = x; }

		this._scaleX = x;
		this._scaleY = y;
		this.updateScale();
	},

	/** updateScale */
	updateScale: function()
	{
		this.volume.scale(this._scaleX * this._parentScaleX, this._scaleY * this._parentScaleY);
	
		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child._ignoreParentScale) { continue; }

				child._parentScaleX = this.volume.scaleX;
				child._parentScaleY = this.volume.scaleY;
				child.updateScale();
			}
		}		
	},

	/** 
	 * scaleX
	 * @param x {number}
	 */
	set scaleX(x) 
	{
		if(this._scaleX === x) { return; }
		this._scaleX = x;

		this.updateScale();
	},

	/** 
	 * scaleY
	 * @param y {number}
	 */
	set scaleY(y) 
	{
		if(this._scaleY === y) { return; }
		this._scaleY = y;

		this.updateScale();
	},

	/** 
	 * scaleX
	 * @return {number}
	 */	
	get scaleX() { return this._scaleX; },

	/** 
	 * scaleY
	 * @return {number}
	 */		
	get scaleY() { return this._scaleY; },

	/**
	 * Flip entity. By default will flip horizontally.
	 * @param x {Number=} Flip by X axis. Valid inputs: -1.0 or 1.0.
	 * @param y {Number=} Flip by Y axis. Valid inputs: -1.0 or 1.0.
	 */
	flip: function(x, y) {
		this.volume.flip(x, y);
		meta.renderer.needRender = true;		
 	},

	set flipX(x) { this.flip(x, this.volume.scaleY); },
	set flipY(y) { this.flip(this.volume.scaleX, y); },
	get flipX() { return this.volume.flipX; },
	get flipY() { return this.volume.flipY; },

	set alpha(value) {
		this._alpha = value;
		this.volume.__transformed = 1;
		this.renderer.needRender = true;
	},

	get alpha() { return this._alpha; },	

	resize: function(width, height) 
	{
		this.volume.resize(width, height);
		this.updatePos();

		if(this.children) 
		{
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				this.children[i].updateAnchor();
			}	
		}

		this.renderer.needRender = true;
	},

	/**
	 * Callback for texture events.
	 * @param data {*} Data of the event.
	 * @param event {*} Type of the event.
	 */
	onTextureEvent: function(data, event)
	{
		var resEvent = Resource.Event;
		if(event === resEvent.LOADED) {
			this.loaded = true;
		}
		else if(event === resEvent.UNLOADED) {
			this.loaded = false;
		}

		this.updateFromTexture();
	},

	updateFromTexture: function()
	{
		if(this._texture) {
			this.volume.resize(this._texture.width, this._texture.height);
		}
		else {
			this.volume.resize(0, 0);
		}

		this.updateAnchor();
	},	

	set texture(texture)
	{
		if(this._texture) {
			this._texture.unsubscribe(this);
		}

		if(texture) 
		{
			if(typeof(texture) === "string") 
			{
				this._texture = Resource.ctrl.getTexture(texture);
				if(!this._texture) {
					console.warn("(Entity.Geometry) Unavailable texture - " + texture);
					return;
				}
			}
			else {
				this._texture = texture;
			}

			this._texture.subscribe(this, this.onTextureEvent);

			if(this._texture._loaded) {
				this.updateFromTexture();
				this.loaded = true;
			}
		}
		else {
			this._texture = texture;
			this.loaded = false;
		}

		this.anim.set(this._texture);
	},

	get texture() { return this._texture; },

	set needRender(value) 
	{
		this._needRender = value;

		if(value) {
			meta.renderer.needRender = true;
		}	
	},	

	get needRender() { return this._needRender; },

	attach: function(entity)
	{
		if(!entity) {
			console.warn("(Entity.Geometry.attach) Invalid entity passed");
			return;
		}

		if(!this.children) {
			this.children = [ entity ];
		}
		else {
			this.children.push(entity);
		}

		if(this.__ui) { entity.__ui = this.__ui; }

		entity.parent = this;
		this.updatePos();
		this.updateZ();

		if(this.totalAngle !== 0) {
			this.updateAngle();
		}

		if(this._view && this._view._active) {
			this.renderer.addEntity(entity);
		}		
	},

	detach: function(entity)
	{

		this.renderer.needRender = true;
	},

	detachAll: function()
	{
		if(!this.children) { return; }

		var numChildren = this.children.length;
		for(var i = 0; i < numChildren; i++) {
			this.detach(this.children[i]);
		}

		this.children = null;
		this.renderer.needRender = true;
	},

	set visible(value) 
	{
		if(this._visible === value) { return; }
		this._visible = value;

		this.renderer.needRender = true;
	},

	get visible() { return this._visible; },

	set state(name)
	{
		if(this._state === name) { return; }
		this._state = name;

		if(this.onStateChange) {
			this.onStateChange();
		}

		if(this._style) {
			this.renderer.updateState(this);
		}
	},

	get state() { return this._state; },

	set style(style)
	{
		if(style)
		{
			if(style instanceof meta.Style) {
				this._style = style;
			}
			else {
				this._style = new meta.Style(style);
			}

			this.renderer.updateState(this);
		}
		else {
			this._style = null;
		}
	},

	get style() { return this._style; },

	updateState: function() {
		this._style.update(this);
	},

	onStateChange: null,

	/* Input */
	set pickable(value)
	{
		if(this._pickable === value) { return; }
		this._pickable = value;

		if(value) {
			meta.renderer.addPicking(this);
		}
		else {
			meta.renderer.removePicking(this);
		}
	},

	get pickable() { return this._pickable; },

	isPointInside: function(x, y) 
	{
		if(this.volume.__transformed == 1) 
		{
			var offsetX = x - this.volume.x;
			var offsetY = y - this.volume.y;
			x = offsetX * this.volume.cos + offsetY * this.volume.sin + this.volume.x;
			y = offsetY * this.volume.cos - offsetX * this.volume.sin + this.volume.y;
		}

		return this.volume.vsPoint(x, y);
	},

	isPointInsidePx: function(x, y) 
	{
		var volume = this.volume;
		if(volume.__transformed == 1) 
		{
			var offsetX = x - volume.x;
			var offsetY = y - volume.y;
			x = offsetX * volume.cos + offsetY * volume.sin + volume.x;
			y = offsetY * volume.cos - offsetX * volume.sin + volume.y;
		}

		if(!this.volume.vsPoint(x, y)) {
			return false;
		}

		var offsetX = (x - volume.minX) / volume.scaleX | 0;
		var offsetY = (y - volume.minY) / volume.scaleY | 0;
		var pixel = this._texture.getPixelAt(offsetX, offsetY);
		if(pixel[3] > 50) {
			return true;
		}

		return false;
	},

	/**
	 * Callback if entity has been pressed.
	 * @function
	 */
	onDown: null,

	/**
	 * Callback if press on entity ended.
	 * @function
	 */
	onUp: null,

	/**
	 * Callback if entity has been clicked.
	 * @function
	 */
	onClick: null,	

	/**
	 * Callback if entity has been double clicked on.
	 * @function
	 */
	onDbClick: null,		

	/**
	 * Callback if entity is being dragged.
	 * @function
	 */
	onDrag: null,

	/**
	 * Callback if started drag on the entity.
	 * @function
	 */
	onDragStart: null,	

	/**
	 * Callback if ended drag on the entity.
	 * @function
	 */
	onDragEnd: null,	

	/**
	 * Callback if input is moving on top of entity.
	 * @function
	 */
	onHover: null,

	/**
	 * Callback if input entered in entity bounds.
	 * @function
	 */
	onHoverEnter: null,

	/**
	 * Callback if input left entity bounds.
	 * @function
	 */
	onHoverExit: null,

	addTimer: function(func, tDelta, numTimes) 
	{
		var timer = meta.addTimer(this, func, tDelta, numTimes);
		if(!this.timers) {
			this.timers = [ timer ];
		}
		else {
			this.timers.push(timer);
		}

		return timer;
	},	

	set tween(obj)
	{
		if(!this._tweenCache) {
			this._tweenCache = new meta.Tween.Cache(this);
		}

		if(obj instanceof meta.Tween.Link) {
			this._tweenCache.tween = obj.tween;
		}
		else if(obj instanceof meta.Tween) {
			this._tweenCache.tween = obj;
		}
		else {
			console.warn("(Entity.Geometry.set::tween) Ivalid object! Should be meta.Tween or meta.Tween.Link object");
			return;
		}

		var tween = this._tweenCache.tween;
		if(tween.autoPlay) {
			tween.cache = this._tweenCache;
			tween.play();
		}
	},

	get tween()
	{
		if(!this._tweenCache) {
			this._tweenCache = new meta.Tween.Cache(this);
			this._tweenCache.tween = new meta.Tween();
		}

		this._tweenCache.tween.cache = this._tweenCache;
		return this._tweenCache.tween;
	},	

	addComponent: function(name, obj, params) 
	{
		if(this[name]) {
			console.warn("(Entity.Geometry.addComponent) Already in use: " + name);
			return null;
		}

		var comp = new obj();
		comp.owner = this;

		for(var key in params) {
			comp[key] = params[key];
		}

		this[name] = comp;
		if(!this.components) {
			this.components = [ comp ];
		}
		else {
			this.components.push(comp);
		}

		if(comp.load) {
			comp.load();
		}
		if(this.loaded && comp.ready) {
			comp.ready();
		}

		return comp;
	},

	removeComponent: function(name)
	{
		var comp = this[name];
		if(!comp || typeof(comp) !== "object") {
			console.warn("(Entity.Geometry.removeComponent) Invalid component in: " + name);
			return;
		}

		// Try to find and remove the component:
		var found = false;
		var numComponents = this.components.length;
		for(var i = 0; i < numComponents; i++) {
			if(this.components[i] === comp) {
				this.components[i] = this.components[numComponents - 1];
				this.components.pop(); 
				found = true;
				break;
			}
		}

		// Error: If no such component added:
		if(!found) {
			console.warn("(Entity.Geometry.removeComponent) No such components added in: " + name);
			return;			
		}

		if(comp.unload) {
			comp.unload();
		}

		this[name] = null;
	},

	removeAllComponents: function()
	{
		if(!components) { return; }

		var numComponents = this.components.length;
		for(var i = 0; i < numComponents; i++) {
			this.removeComponent(this.components[i]);
		}
	},	

	/**
	 * Rotate entoty so it looks to x, y world positions.
	 * @param x {Number} World position on x axis to look at.
	 * @param y {Number} World position on y axis to look at.
	 */
	lookAt: function(x, y) 
	{
		if(this._ignoreParentAngle) {
			this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI;
		}
		else {
			this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI - this.parent.volume.angle
		}
	},

	set ignoreParentPos(value) 
	{
		this._ignoreParentPos = value;
		if(value) {
			this._parentX = 0;
			this._parentY = 0;
		}
		this.updatePos();
	},

	get ignoreParentPos() { return this._ignoreParentPos; },

	set ignoreParentAngle(value) 
	{
		this._ignoreParentAngle = value;
		if(value) {
			this._parentAngle = 0;
		}
		this.updateAngle();
	},

	get ignoreParentAngle() { return this._ignoreParentAngle; },

	set ignoreParentScale(value) 
	{
		this._ignoreParentScale = value;
		if(value) {
			this._parentScaleX = 1;
			this._parentScaleY = 1;
		}
		this.updateScale();
	},

	get ignoreParentScale() { return this._ignoreParentScale; },

	set ui(value) {
		if(this.__ui === value) { return; }
		this.__ui = value;
	},

	get ui() { return this.__ui; },

	/* Debug */
	set debug(value) 
	{
		if(this.__debug === value) { return; }
		this.__debug = value;

		if(value) {
			meta.renderer.numDebug++;
		}
		else {
			meta.renderer.numDebug--;
		}
		
		meta.renderer.needRender = true;
	},

	get debug() { return this.__debug; },

	//
	renderer: null,
	parent: null,
	_view: null,

	_texture: null,

	_x: 0, _y: 0, _parentX: 0, _parentY: 0,
	_z: 0, totalZ: 0, _parentZ: 0,
	_angle: 0, _parentAngle: 0,
	_alpha: 1, totalAlpha: 0, _parentAlpha: 0,
	_scaleX: 1, _scaleY: 1, _parentScaleX: 1, _parentScaleY: 1,

	_anchorX: 0, _anchorY: 0,
	anchorPosX: 0, anchorPosY: 0,

	loaded: true,
	_removed: false,
	_visible: true,

	body: null,
	children: null,
	anim: null,

	_style: null, 
	_styleState: null, _styleAction: null, 
	_styleParams: null, _styleActionParams: null,
	_state: "*", _action: "",
	__stateIndex: -1,

	timers: null,
	_tweenCache: null,
	components: null,

	_pickable: false,
	hover: false,
	pressed: false,
	dragged: false,

	_ignoreParentPos: false,
	_ignoreParentZ: false,
	_ignoreParentAngle: false,
	_ignoreParentAlpha: false,
	_ignoreParentScale: false,

	__added: false,
	__debug: false,
	__ui: false,
	__updateIndex: -1,
});
