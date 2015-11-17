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

	set enabled(value)
	{
		if(value)
		{
			if(this.flags & this.Flag.ENABLED) { return; }

			this.flags |= this.Flag.ENABLED;
		}
		else
		{
			if((this.flags & this.Flag.ENABLED) === 0) { return; }

			this.flags &= ~this.Flag.ENABLED;
		}

		this._updateEnabled(true);
	},

	get enabled() {
		return ((this.flags & this.Flag.ENABLED) === this.Flag.ENABLED);
	},

	_updateEnabled: function(parent)
	{
		if(this.flags & this.Flag.INSTANCE_ENABLED) 
		{ 
			if((this.flags & this.Flag.ENABLED) && (this.parent.flags & this.Flag.INSTANCE_ENABLED)) {
				return;
			}

			this.flags &= ~this.Flag.INSTANCE_ENABLED;
		}
		else
		{
			if((this.flags & this.Flag.ENABLED) && (this.parent.flags & this.Flag.INSTANCE_ENABLED)) {
				this.flags |= this.Flag.INSTANCE_ENABLED;
			}
			else {
				return;
			}
		}

		if(this.children)
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._updateEnabled(false);
			}
		}

		if(this._view && parent) {
			this._view.updateEntity(this);
		}
	},

	_activate: function()
	{
		this.flags |= this.Flag.ACTIVE;

		if(this.flags & this.Flag.UPDATING) {
			this.updating = true;
		}	
		if(this.flags & this.Flag.PICKING) {
			this.picking = true;
		}			

		this._updateAnchor();

		if(this.renderer.culling) {
			this.node = new meta.SparseNode(this);
		}		

		if(this.components !== this.parent.components)
		{
			var component;
			for(var key in this.components) 
			{
				component = this.components[key];
				if(component.onActiveEnter) {
					component.onActiveEnter();
				}
			}
		}

		if(this.children) 
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._activate();
			}
		}		
	},

	_deactivate: function()
	{
		this.flags &= ~this.Flag.ACTIVE;

		if(this.components !== this.parent.components)
		{
			var component;
			for(var key in this.components) 
			{
				component = this.components[key];
				if(component.onActiveExit) {
					component.onActiveExit();
				}
			}
		}

		if(this.children) 
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._deactivate();
			}
		}
	},

	remove: function()
	{
		if(this.flags & this.Flag.REMOVED) { return; }
		this.flags |= this.Flag.REMOVED;

		if(this.flags & this.Flag.ACTIVE) {
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

		if(this.tween) {
			this.tween.clear();
		}

		if(this.view) {
			this.view.detach(this);
		}

		this.onInactive();

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

		if(this.node) {
			this.renderer.culling.update(this);
		}

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
		this.updateAngle(value);
	},	

	/** angle */		
	get angle() { return (this._angle * 180) / Math.PI; },

	/** angleRad */			
	get angleRad() { return this._angle; },

	/** updateAngle */
	updateAngle: function()
	{
		if(this.flags & this.Flag.IGNORE_PARENT_ANGLE) {
			this.volume.rotate(this._angle);
		}
		else {
			this.volume.rotate(this._angle + this.parent.volume.angle);
		}

		if(this.node) {
			this.renderer.culling.update(this);
		}

		if(this.children) 
		{
			var child;
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++) 
			{
				child = this.children[i];
				if(child.flags & this.Flag.IGNORE_PARENT_ANGLE) { continue; }

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

	fitIn: function(width, height)
	{
		if(this.volume.width < 1) 
		{
			if(this.volume.height < 1) {
				this.volume.resize(1, 1);
			}
			else {
				this.volume.resize(1, this.volume.initHeight);
			}
		}
		else if(this.volume.height < 1) {
			this.volume.resize(this.volume.initWidth, 1);
		}

		this.flags |= this.Flag.FIT_IN;
		this.scale(
			width / this.volume.initWidth,
			height / this.volume.initHeight);
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

		meta.resources.onLoadingEnd.remove(this);
	},

	updateFromTexture: function()
	{
		if(this._texture) 
		{
			if(this.flags & this.Flag.FIT_IN) 
			{
				this.scale(
					this.volume.width / this._texture.width,
					this.volume.height / this._texture.height);
			}

			this.volume.resize(this._texture.width, this._texture.height);

			this.totalOffsetX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
			this.totalOffsetY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);				
		}
		else 
		{
			if(this.flags & this.Flag.FIT_IN) 
			{
				this.scale(
					this.volume.width,
					this.volume.height);
			}
			else {
				this.volume.resize(1, 1);
			}

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
						meta.resources.onLoadingEnd.add(this._onLoadingEnd, this);
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

			this._texture.subscribe(this._onTextureEvent, this);

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

			if(this.flags & this.Flag.ACTIVE) {
				this.__updateIndex = this.renderer.entitiesUpdate.push(this) - 1;
			}
		}
		else 
		{
			if(this.__updateIndex === -1) { return; }

			this.flags &= ~this.Flag.UPDATING;

			if(this.flags & this.Flag.ACTIVE) {
				this.renderer.entitiesUpdateRemove.push(this);
				this.__updateIndex = -1;
			}			
		}		
	},

	get updating() { 
		return ((this.flags & this.Flag.UPDATING) === this.Flag.UPDATING); 
	},

	_setView: function(view) 
	{
		this._view = view;

		if((view.flags & view.Flag.ACTIVE) && !(view.flags & view.Flag.INSTANCE_HIDDEN)) {
			this.renderer.addEntity(this);
		}

		if(this.children) 
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._setView(view);
			}
		}
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

		if(entity._view) {
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

		this._updateHidden();

		if(this._view) {
			entity._setView(this._view);
		}
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
		if(entity)
		{
			this._detach(entity);

			if(this._view && (this._view.flags & this._view.Flag.VISIBLE)) {
				this.renderer.removeEntity(entity);
			}
		}
		else {
			this._detach(this);
			this.renderer.removeEntity(this);
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

	_updateHidden: function()
	{
		if(this.flags & this.Flag.INSTANCE_HIDDEN) 
		{ 
			if(this.flags & this.Flag.HIDDEN) { return; }
			if(this.parent.flags & this.Flag.INSTANCE_HIDDEN) {
				if((this.flags & this.Flag.IGNORE_PARENT_HIDDEN) === 0) { return; }
			}

			this.flags &= ~this.Flag.INSTANCE_HIDDEN;		
		}
		else
		{
			if((this.flags & this.Flag.HIDDEN) || 
			   ((this.parent.flags & this.Flag.INSTANCE_HIDDEN) && ((this.flags & this.Flag.IGNORE_PARENT_HIDDEN) === 0)))
			{ 
				this.flags |= this.Flag.INSTANCE_HIDDEN;			
			}
			else {
				return;
			}
		}

		if(this.children)
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._updateHidden();
			}
		}
	},	

	set hidden(value)
	{
		if(value)
		{
			if(this.flags & this.Flag.HIDDEN) { return; }

			this.flags |= this.Flag.HIDDEN;
		}
		else
		{
			if((this.flags & this.Flag.HIDDEN) === 0) { return; }

			this.flags &= ~this.Flag.HIDDEN;
		}

		this._updateHidden();
	},

	get hidden() {
		return ((this.flags & this.Flag.HIDDEN) === this.Flag.HIDDEN);
	},

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

			if(this.flags & this.Flag.RENDER) {
				this.__pickIndex = this.renderer.entitiesPicking.push(this) - 1;
			}
		}
		else 
		{
			if(this.__pickIndex === -1) { return; }

			this.flags &= ~this.Flag.PICKING;

			if(this.flags & this.Flag.RENDER) {
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
			this.tween = new meta.Tween();
		}

		this._tweenCache.tween.cache = this._tweenCache;
		return this._tweenCache.tween;
	},	

	addComponent: function(component, params) 
	{
		if(typeof component === "string") {
			component = Component[component];
		}
		if(!component) {
			console.warn("(Entity.Geometry.addComponent) Adding an invalid component");
			return null;
		}

		var name = component.prototype.__lastName__;
		if(this.components && this.components[name]) {
			console.warn("(Entity.Geometry.addComponent) Entity already has component: " + name);
			return null;
		}

		var comp = new component(this);
		comp.owner = this;

		if(params) 
		{
			for(var key in params) {
				comp[key] = params[key];
			}			
		}

		// If no unique component object:
		if(this.parent.components === this.components) {
			this.components = {};
		}

		this.components[name] = comp;

		if(comp.onAdd) {
			comp.onAdd();
		}

		return comp;
	},

	removeComponent: function(name)
	{
		var comp = this.components[name];
		if(!comp || typeof(comp) !== "object") {
			console.warn("(Entity.Geometry.removeComponent) No such component added: " + name);
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

	set loaded(value) 
	{
		if(value) 
		{
			if(this.flags & this.Flag.LOADED) { return; }

			this.flags |= this.Flag.LOADED;
		}
		else
		{
			if((this.flags & this.Flag.LOADED) === 0) { return; }

			this.flags &= ~this.Flag.LOADED;
		}
	},

	get loaded() {
		return ((this.flags & this.Flag.LOADED) === this.Flag.LOADED);
	},

	set static(value)
	{
		if(value) 
		{
			if(this.flags & this.Flag.STATIC) { return; }

			this.flags |= this.Flag.STATIC;
		}
		else
		{
			if((this.flags & this.Flag.STATIC) === 0) { return; }

			this.flags &= ~this.Flag.STATIC;
		}
	},

	get static() {
		return ((this.flags & this.Flag.STATIC) === this.Flag.STATIC);
	},

	/* Debug */
	set debug(value) 
	{
		if(value) 
		{
			if(this.flags & this.Flag.DEBUG) { return; }

			this.flags |= this.Flag.DEBUG;
			this.renderer.numDebug++;
			
		}
		else 
		{
			if((this.flags & this.Flag.DEBUG) === 0) { return; }

			this.flags &= ~this.Flag.DEBUG;
			this.renderer.numDebug--;
		}
		
		this.renderer.needRender = true;
	},

	get debug() { 
		return (this.flags & this.Flag.DEBUG) === this.Flag.DEBUG; 
	},

	Flag: {
		ENABLED: 1 << 0,
		INSTANCE_ENABLED: 1 << 1,
		HIDDEN: 1 << 2,
		INSTANCE_HIDDEN: 1 << 3,
		ACTIVE: 1 << 4,
		INSTANCE_ACTIVE: 1 << 5,
		VISIBILE: 1 << 6,
		UPDATING: 1 << 8,
		REMOVED: 1 << 9,
		IGNORE_PARENT_POS: 1 << 10,
		IGNORE_PARENT_Z: 1 << 11,
		IGNORE_PARENT_ANGLE: 1 << 12,
		IGNORE_PARENT_ALPHA: 1 << 13,
		IGNORE_PARENT_SCALE: 1 << 14,
		IGNORE_PARENT_HIDDEN: 1 << 15,
		RENDER: 1 << 16,
		RENDER_REMOVE: 1 << 17,
		DEBUG: 1 << 18,
		DYNAMIC_CLIP: 1 << 19,
		FIT_IN: 1 << 20,
		CLIP_BOUNDS: 1 << 21,
		LOADED: 1 << 22,
		RENDER_HOLDER: 1 << 23,
		STATIC: 1 << 24
	},

	//
	renderer: null,
	parent: null,
	_view: null,
	node: null,

	_texture: null,

	_x: 0, _y: 0, _parentX: 0, _parentY: 0,
	_z: 0, totalZ: 0, _parentZ: 0,
	_angle: 0,
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

	children: null,
	anim: null,

	_state: "",

	timers: null,
	_tweenCache: null,
	components: {},

	hover: false,
	pressed: false,
	dragged: false,

	__debug: false,
	__updateIndex: -1,
	__pickIndex: -1,

	flags: 0
});
