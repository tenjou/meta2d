"use strict";

meta.class("Entity.Geometry",
{
	init: function(arg) 
	{
		this.volume = new meta.math.AABBext();
		this.anim = new Component.Anim(this);
		this.initArg(arg);

		if(this.onCreate) {
			this.onCreate(arg);
		}
	},

	initArg: function(arg)
	{
		if(typeof arg === "object") 
		{
			if(arg instanceof Resource.Texture) {
				this.texture = arg;				
			}	
			else 
			{
				for(var key in arg) {
					this[key] = arg[key];
				}
			}
		}
		else if(typeof arg === "string") {
			this.texture = arg;
		}
	},

	onCreate: null,

	createBody: function(comp) 
	{
		if(!comp) {
			comp = Physics.Body;
		}
		this.addComponent("body", comp);
	},

	remove: function()
	{
		if(this.removed) { return; }
		this.removed = true;

		if(this.flags & this.Flag.ADDED) {
			this.renderer.removeEntity(this);
		}
		else {
			this._remove();
		}
	},

	_remove: function()
	{
		if(this._texture) {
			this._texture.unsubscribe(this);
			this._texture = null;
		}

		if(this.body) {
			Physics.ctrl.remove(this.body);
		}
		if(this.tween) {
			this.tween.clear();
		}

		if(this.view) {
			this.view.detach(this);
		}

		if(this.onRemove) {
			this.onRemove();
		}		
	},

	onRemove: null,

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
		this.volume.x = this._x + this.totalOffsetX;
		this.volume.y = this._y + this.totalOffsetY;
		this.volume.updatePos();

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child.flags & this.Flag.IGNORE_PARENT_POS) { continue; }

				child._parentX = this.volume.x - this.volume.pivotPosX - this.offsetPosX;
				child._parentY = this.volume.y - this.volume.pivotPosY - this.offsetPosY;
				child.updateTotalOffset();
			}
		}

		this.renderer.needRender = true;
	},

	updateTotalOffset: function() 
	{
		this.totalOffsetX = this.offsetPosX + this._parentX + this.anchorPosX;
		this.totalOffsetY = this.offsetPosY + this._parentY + this.anchorPosY;
		if(this._view) {
			this.totalOffsetX += this._view._x;
			this.totalOffsetY += this._view._y;
		}		

		this.updatePos();
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
		if(this._view) {
			this.totalZ += this._view._z;
		}

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				child = this.children[i];
				child._parentZ = this.totalZ + 0.00001;
				child.updateZ();
			}
		}

		this.renderer.needSortDepth = true;	
	},

	offset: function(x, y) 
	{
		if(this._offsetX === x && this._offsetY === y) { return; }

		this._offsetX = x;
		this._offsetY = y;
		if(this._texture) {
			this.offsetPosX = Math.round((this._offsetX + this._texture.offsetX));
			this.offsetPosY = Math.round((this._offsetY + this._texture.offsetY));	
		}
		else {
			this.offsetPosX = Math.round(this._offsetX);
			this.offsetPosY = Math.round(this._offsetY);
		}

		this.updateTotalOffset();
	},

	set offsetX(x) 
	{ 
		if(this._offsetX === x) { return; }

		this._offsetX = x;
		if(this._texture) {
			this.offsetPosX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);	
		}
		else {
			this.offsetPosX = Math.round(this._offsetX * this.volume.scaleX);
		}

		this.updatePos();
	},

	set offsetY(y) 
	{
		if(this._offsetY === y) { return; }

		this._offsetY = y;
		if(this._texture) {
			this.offsetPosY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);	
		}
		else {
			this.offsetPosY = Math.round(this._offsetY * this.volume.scaleX);
		}

		this.updatePos();
	},

	get offsetX() { return this._offsetX; },
	get offsetY() { return this._offsetY; },

	/** 
	 * pivot
	 * @param x {number}
	 * @param y {number}
	 */
	pivot: function(x, y) {
		this.volume.pivot(x, y); 
		this.renderer.needRender = true;
	},

	/** 
	 * pivotX
	 * @param x {number}
	 */
	set pivotX(x) { 
		this.volume.pivot(x, this.volume.pivotY); 
		this.renderer.needRender = true;
	},

	/** 
	 * pivotY
	 * @param y {number}
	 */	
	set pivotY(y) { 
		this.volume.pivot(this.volume.pivotX, y); 
		this.renderer.needRender = true;
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
		this._updateAnchor();
	},

	/** updateAnchor */
	_updateAnchor: function() 
	{
		if(this._static) {
			var engine = meta.engine;
			this.anchorPosX = (this.parent.volume.width * engine.zoom) * this._anchorX;
			this.anchorPosY = (this.parent.volume.height * engine.zoom) * this._anchorY;
		}
		else {
			this.anchorPosX = (this.parent.volume.width) * this._anchorX;
			this.anchorPosY = (this.parent.volume.height) * this._anchorY;			
		}

		this.updateTotalOffset();	
	},

	/** 
	 * anchorX
	 * @param x {number}
	 */	
	set anchorX(x) {
		this._anchorX = x;
		this._updateAnchor();
	},

	/** 
	 * anchorY
	 * @param y {number}
	 */		
	set anchorY(y) {
		this._anchorY = y;
		this._updateAnchor();
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
				if(child.flags & this.Flag.IGNORE_PARENT_ANGLE) { continue; }

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
		this._updateScale();
	},

	/** updateScale */
	_updateScale: function()
	{
		this.volume.scale(this._scaleX * this._parentScaleX, this._scaleY * this._parentScaleY);

		if(this._texture) {
			this.totalOffsetX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
			this.totalOffsetY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);	
		}
		else {
			this.totalOffsetX = Math.round(this._offsetX * this.volume.scaleX);
			this.totalOffsetY = Math.round(this._offsetY * this.volume.scaleY);
		}

		this._updateAnchor();
	
		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child.flags & this.Flag.IGNORE_PARENT_SCALE) { continue; }

				child._parentScaleX = this.volume.scaleX;
				child._parentScaleY = this.volume.scaleY;
				child._updateScale();
				child._updateAnchor();
			}
		}

		this.renderer.needRender = true;		
	},

	/** 
	 * scaleX
	 * @param x {number}
	 */
	set scaleX(x) 
	{
		if(this._scaleX === x) { return; }

		this._scaleX = x;
		this._updateScale();
	},

	/** 
	 * scaleY
	 * @param y {number}
	 */
	set scaleY(y) 
	{
		if(this._scaleY === y) { return; }

		this._scaleY = y;
		this._updateScale();
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
		this.renderer.needRender = true;		
 	},

	set flipX(x) { this.flip(x, this.volume.flipY); },
	set flipY(y) { this.flip(this.volume.flipX, y); },
	get flipX() { return this.volume.flipX; },
	get flipY() { return this.volume.flipY; },

	// ALPHA
	set alpha(value) 
	{
		if(this._alpha === value) { return; }

		this._alpha = value;
		this.updateAlpha();
	},

	get alpha() { return this._alpha; },	

	updateAlpha: function()
	{
		this.totalAlpha = this._alpha * this.parent.totalAlpha;
		if(this.totalAlpha < 0) {
			this.totalAlpha = 0;
		}
		else if(this.totalAlpha > 1) {
			this.totalAlpha = 1;
		}

		if(this.children)
		{
			var child;
			var num = this.children.length;
			for(var n = 0; n < num; n++) 
			{
				child = this.children[n];
				if(child.flags & this.Flag.IGNORE_PARENT_ALPHA) {
					continue;
				}

				child.updateAlpha();
			}
		}

		

		this.volume.__transformed = 1;
		this.renderer.needRender = true;
	},

	resize: function(width, height) 
	{
		if(this.volume.width === width && this.volume.height === height) { return; }

		this.volume.resize(width, height);
		this.updatePos();
		this._updateResize();

		if(this.children) 
		{
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				this.children[i]._updateResize();
			}	
		}
	
		//this.__clip = true;
		this.renderer.needRender = true;
	},

	set width(width) 
	{
		if(this.texture) 
		{
			if(this.volume.width !== width) {
				this.flags |= this.Flag.DYNAMIC_CLIP;
			}
			else {
				this.flags &= ~this.Flag.DYNAMIC_CLIP;
			}
		}

		this.resize(width, this.volume.height);
	},

	set height(height) 
	{
		if(this.texture) 
		{
			if(this.volume.height !== height) {
				this.flags |= this.Flag.DYNAMIC_CLIP;
			}
			else {
				this.flags &= ~this.Flag.DYNAMIC_CLIP;
			}
		}

		this.resize(this.volume.width, height);
	},

	get width() { return this.volume.width; },
	get height() { return this.volume.height; },

	_updateResize: function() 
	{
		this._updateAnchor();

		if(this.onResize) {
			this.onResize();
		}
	},

	onResize: null,

	clip: function(clip)
	{
		if(clip instanceof Entity.Geometry) {
			this.clipVolume = clip.volume;
		}
		else if(clip instanceof meta.math.AABB) {
			this.clipVolume = clip;
		}
		else {
			this.clipVolume = null;
		}

		this.renderer.needRender = true;
	},

	clipBounds: function(width, height)
	{
		if(!this.clipVolume) {
			this.clipVolume = new meta.math.AABB(0, 0, width, height);
		}
		else {
			this.clipVolume.set(0, 0, width, height);
		}

		this.flags |= this.Flag.CLIP_BOUNDS;
		this.renderer.needRender = true;
	},

	/**
	 * Callback for texture events.
	 * @param data {*} Data of the event.
	 * @param event {*} Type of the event.
	 */
	_onTextureEvent: function(data, event)
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

	_onLoadingEnd: function(data, event)
	{
		var texture = meta.resources.getTexture(this._textureName);
		if(!texture) {
			console.warn("(Entity.Geometry) Unavailable texture - " + this._textureName);
		}
		else {
			this.texture = texture;
		}

		meta.unsubscribe(this, Resource.Event.LOADING_END);
	},

	updateFromTexture: function()
	{
		if(this._texture) {
			this.volume.resize(this._texture.width, this._texture.height);
			this.totalOffsetX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
			this.totalOffsetY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);				
		}
		else {
			this.volume.resize(0, 0);
			this.totalOffsetX = Math.round(this._offsetX * this.volume.scaleX);
			this.totalOffsetY = Math.round(this._offsetY * this.volume.scaleY);				
		}

		this._updateAnchor();

		if(this.children) 
		{
			var numChildren = this.children.length;
			for(var n = 0; n < numChildren; n++) {
				this.children[n]._updateAnchor();
			}
		}
	},	

	onTextureChange: null,

	set texture(texture) 
	{
		if(this._texture === texture) { return; }

		if(this._texture) {
			this._texture.unsubscribe(this);
		}

		if(texture) 
		{
			if(typeof(texture) === "string") 
			{
				this._texture = meta.resources.getTexture(texture);
				if(!this._texture) 
				{
					if(meta.resources.loading) {
						this._textureName = texture;
						meta.subscribe(this, Resource.Event.LOADING_END, this._onLoadingEnd);
					}
					else {
						console.warn("(Entity.Geometry) Unavailable texture - " + texture);	
					}
				
					return;
				}
			}
			else {
				this._texture = texture;
			}

			this._texture.subscribe(this, this._onTextureEvent);

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

		if(this.onTextureChange) {
			this.onTextureChange();
		}
	},

	get texture() { 
		return this._texture; 
	},

	set updating(value) 
	{
		if(value) 
		{
			if(this.__updateIndex !== -1) { return; }

			this.flags |= this.Flag.UPDATING;

			if(this.flags & this.Flag.ADDED) {
				this.__updateIndex = this.renderer.entitiesUpdate.push(this) - 1;
			}
		}
		else 
		{
			if(this.__updateIndex === -1) { return; }

			this.flags &= ~this.Flag.UPDATING;

			if(this.flags & this.Flag.ADDED) {
				this.renderer.entitiesUpdateRemove.push(this);
				this.__updateIndex = -1;
			}			
		}		
	},

	get updating() { 
		return ((this.flags & this.Flag.UPDATING) === this.Flag.UPDATING); 
	},

	attach: function(entity)
	{
		if(!entity) {
			console.warn("(Entity.Geometry.attach) Invalid entity passed");
			return;
		}

		if(entity === this) {
			console.warn("(Entity.Geometry.attach) Trying to attach themself");
			return;			
		}

		if(entity.parent !== this.renderer.holder) {
			console.warn("(Entity.Geometry.attach) Trying to attach entity that has already been attached to other entity");
			return;
		}

		entity.parent = this;

		if(!this.children) {
			this.children = [ entity ];
			this._updateScale();
		}
		else 
		{
			this.children.push(entity);	

			if((entity.flags & this.Flag.IGNORE_PARENT_POS) === 0) {
				entity._parentX = this.volume.x - this.volume.pivotPosX - this.offsetPosX;
				entity._parentY = this.volume.y - this.volume.pivotPosY - this.offsetPosY;
				entity.updateTotalOffset();
			}
		}

		if(this._static) { entity._static = true; }
		if(this._debugger) { entity._debugger = true; }
		
		this.updateZ();
		
		if(this.volume.angle !== 0) {
			this.updateAngle();
		}
		if(this.totalAlpha !== 1) {
			this.updateAlpha();
		}

		if(!this._visible) {
			entity.visible = false;
		}

		entity._view = this._view;
		if(this._view && (this._view.flags & this._view.Flag.VISIBLE)) {
			this.renderer.addEntity(entity);
		}		

		this.renderer.needRender = true;	
	},

	_detach: function(entity)
	{
		entity.parent = this.renderer.holder;

		if(this.totalAlpha !== 1) {
			entity.updateAlpha();
		}
	},

	detach: function(entity) 
	{
		this._detach(entity);

		if(this._view && (this._view.flags & this._view.Flag.VISIBLE)) {
			this.renderer.removeEntity(entity);
		}
	},

	detachAll: function()
	{
		if(!this.children) { return; }

		var numChildren = this.children.length;
		for(var i = 0; i < numChildren; i++) {
			this._detach(this.children[i]);
		}

		if(this._view && (this._view.flags & this._view.Flag.VISIBLE)) {
			this.renderer.removeEntities(this.children);
		}

		this.children = null;
	},

	set visible(value) 
	{
		if(this._visible === value) { return; }
		this._visible = value;

		if(this.children)
		{
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				this.children[i].visible = value;
			}
		}

		this.renderer.needRender = true;
	},

	get visible() { return this._visible; },

	set static(value) 
	{
		if(this._static === value) { return; }
		this._static = value;

		if(this.children) 
		{
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) {
				this.children[i].static = value;
			}
		}

		this.renderer.needRender = true;
	},

	get static() { return this._static; },

	set state(name)
	{
		if(this._state === name) { return; }

		if(this.onStateExit) {
			this.onStateExit();
		}

		this._state = name;

		if(this.onStateEnter) {
			this.onStateEnter();
		}
	},

	get state() { return this._state; },

	onStateChange: null,

	/* Input */
	set picking(value)
	{
		if(value) 
		{
			if(this.__pickIndex !== -1) { return; }

			this.flags |= this.Flag.PICKING;

			if(this.flags & this.Flag.ADDED) {
				this.__pickIndex = this.renderer.entitiesPicking.push(this) - 1;
			}
		}
		else 
		{
			if(this.__pickIndex === -1) { return; }

			this.flags &= ~this.Flag.PICKING;

			if(this.flags & this.Flag.ADDED) {
				this.renderer.entitiesPickingRemove.push(this);
				this.__pickIndex = -1;
			}		
		}
	},

	get picking() { 
		return ((this.flags & this.Flag.PICKING) === this.Flag.PICKING); 
	},

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

	/**
	 * Set position from where entity will be dragged from.
	 * @param x {Number} Drag position on X axis.
	 * @param y {Number} Drag position on Y axis.
	 */
	dragStart: function(x, y) {
		this._dragOffsetX = x - this.volume.x;
		this._dragOffsetY = y - this.volume.y;
	},

	/**
	 * Drag entity to position. If entity is anchored then anchorPos will be discarded from x, y.
	 * @param x {Number} World position on X axis.
	 * @param y {Number} World position on Y axis.
	 */
	dragTo: function(x, y)
	{
		x -= this.totalOffsetX + this._dragOffsetX;
		y -= this.totalOffsetY + this._dragOffsetY;

		if(this.volume.x === x && this.volume.y === y) { return; }
		this.position(x, y)	
	},	

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
		if(!obj) {
			this._tween = null;
			return;
		}

		if(!this._tweenCache) {
			this._tweenCache = new meta.Tween.Cache(this);
		}
		else {
			this._tweenCache.stop();
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
			this.tween = new meta.Tween();
		}

		this._tweenCache.tween.cache = this._tweenCache;
		return this._tweenCache.tween;
	},	

	addComponent: function(name, obj, params) 
	{
		if(name instanceof Object) {
			params = obj;
			obj = name;
			name = null;
		}

		var comp = new obj(this);
		comp.owner = this;

		if(name) 
		{
			if(this[name]) {
				console.warn("(Entity.Geometry.addComponent) Already in use: " + name);
				return null;
			}

			this[name] = comp;
		}		

		if(params) 
		{
			for(var key in params) {
				comp[key] = params[key];
			}			
		}

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
		if(this.flags & this.Flag.IGNORE_PARENT_ANGLE) {
			this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI;
		}
		else {
			this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI - this.parent.volume.angle
		}
	},

	set ignoreParentPos(value) 
	{
		if(value) {
			this.flags |= this.Flag.IGNORE_PARENT_POS;
			this._parentX = 0;
			this._parentY = 0;
			this.updatePos();
		}
		else {
			this.flags &= ~this.Flag.IGNORE_PARENT_POS;
			this.parent.updatePos();
		}
	},

	get ignoreParentPos() { 
		return ((this.flags & this.Flag.IGNORE_PARENT_POS) === this.Flag.IGNORE_PARENT_POS); 
	},

	set ignoreParentAngle(value) 
	{
		if(value) {
			this.flags |= this.Flag.IGNORE_PARENT_ANGLE;
			this._parentAngle = 0;
			this.updateAngle();
		}
		else {
			this.flags &= ~this.Flag.IGNORE_PARENT_ANGLE;
			this.parent.updateAngle();
		}
	},

	get ignoreParentAngle() { 
		return ((this.flags & this.Flag.IGNORE_PARENT_ANGLE) === this.Flag.IGNORE_PARENT_ANGLE); 
	},

	set ignoreParentScale(value) 
	{
		if(value) {
			this.flags |= this.Flag.IGNORE_PARENT_SCALE;
			this._parentScaleX = 1;
			this._parentScaleY = 1;
			this._updateScale();
		}
		else {
			this.flags &= ~this.Flag.IGNORE_PARENT_SCALE;
			this.parent._updateScale();
		}
	},

	get ignoreParentScale() { 
		return ((this.flags & this.Flag.IGNORE_PARENT_SCALE) === this.Flag.IGNORE_PARENT_SCALE); 
	},

	/* Debug */
	set debug(value) 
	{
		if(value) 
		{
			if(this.flags & this.Flag.DEBUG) { return; }

			this.renderer.numDebug++;
			this.flags |= this.Flag.DEBUG;
		}
		else 
		{
			if((this.flags & this.Flag.DEBUG) === 0) { return; }

			this.renderer.numDebug--;
			this.flags &= ~this.Flag.DEBUG;
		}
		
		this.renderer.needRender = true;
	},

	get debug() { return (this.flags & this.Flag.DEBUG) === this.Flag.DEBUG; },

	Flag: {
		READY: 1,
		PICKING: 2,
		IGNORE_PARENT_POS: 4,
		IGNORE_PARENT_Z: 8,
		IGNORE_PARENT_ANGLE: 16,
		IGNORE_PARENT_ALPHA: 32,
		IGNORE_PARENT_SCALE: 64,
		UPDATING: 128,
		ADDED: 256,
		DEBUG: 512,
		CLIP_BOUNDS: 1024,
		WILL_REMOVE: 2048,
		DYNAMIC_CLIP: 4096
	},

	//
	renderer: null,
	parent: null,
	_view: null,

	_texture: null,

	_x: 0, _y: 0, _parentX: 0, _parentY: 0,
	_z: 0, totalZ: 0, _parentZ: 0,
	_angle: 0, _parentAngle: 0,
	_alpha: 1, totalAlpha: 1,
	_scaleX: 1, _scaleY: 1, _parentScaleX: 1, _parentScaleY: 1,
	
	_offsetX: 0, _offsetY: 0,
	offsetPosX: 0, offsetPosY: 0,

	_anchorX: 0, _anchorY: 0,
	anchorPosX: 0, anchorPosY: 0,

	totalOffsetX: 0, totalOffsetY: 0,

	_dragOffsetX: 0, _dragOffsetY: 0,

	volume: null,
	clipVolume: null,

	loaded: true,
	removed: false,
	_visible: true,
	_static: false,
	_debugger: false,

	children: null,
	anim: null,

	_state: "",

	timers: null,
	_tweenCache: null,
	components: null,

	hover: false,
	pressed: false,
	dragged: false,

	__debug: false,
	__updateIndex: -1,
	__pickIndex: -1,

	flags: 0
});
