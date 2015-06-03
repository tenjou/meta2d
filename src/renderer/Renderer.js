"use strict";

meta.class("meta.Renderer", 
{
	init: function() 
	{
		this.holder = new Entity.Geometry();
		this.staticHolder = new Entity.Geometry();

		Entity.Geometry.prototype.renderer = this;
		Entity.Geometry.prototype.parent = this.holder;
	},

	load: function() 
	{
		this.engine = meta.engine;

		this.camera = meta.camera;
		this.cameraDefault = this.camera;
		this.cameraUI = new meta.Camera();

		this.chn = {
			onDown: meta.createChannel(Entity.Event.INPUT_DOWN),
			onUp: meta.createChannel(Entity.Event.INPUT_UP),
			onClick: meta.createChannel(Entity.Event.CLICK),
			onDbClick: meta.createChannel(Entity.Event.DBCLICK),
			onDrag: meta.createChannel(Entity.Event.DRAG),
			onDragStart: meta.createChannel(Entity.Event.DRAG_START),
			onDragEnd: meta.createChannel(Entity.Event.DRAG_END),
			onHover: meta.createChannel(Entity.Event.HOVER),
			onHoverEnter: meta.createChannel(Entity.Event.HOVER_ENTER),
			onHoverExit: meta.createChannel(Entity.Event.HOVER_EXIT)
		};

		meta.subscribe(this, [ Input.Event.DOWN, Input.Event.UP ], this.onInput, meta.Priority.HIGH);
		meta.subscribe(this, Input.Event.MOVE, this.onInputMove, meta.Priority.HIGH);
		meta.subscribe(this, Input.Event.DBCLICK, this.onInputDbClick, meta.Priority.HIGH);

		meta.subscribe(this, meta.Event.ADAPT, this.onAdapt);	
		meta.subscribe(this, meta.Event.CAMERA_RESIZE, this.onCameraResize);
		meta.subscribe(this, meta.Event.CAMERA_MOVE, this.onCameraMove);

		this.holder.resize(this.camera.volume.width, this.camera.volume.height);
		this.holder.resize(640, 480);
	},

	update: function(tDelta)
	{
		this.__updating = true;

		var entity = null, index = 0;

		var numEntities = this.entitiesToUpdate.length;
		for(var i = 0; i < numEntities; i++) {
			this.entitiesToUpdate[i].update(tDelta);
		}

		if(this.tweens.length > 0) 
		{
			var numTweens = this.tweens.length;
			var numTweensRemove = this.tweensRemove.length;

			if(numTweensRemove > 0) 
			{
				var tween;
				for(i = 0; i < numTweensRemove; i++) 
				{
					index = this.tweensRemove[i];
					tween = this.tweens[index];

					if(!tween || !tween.__removed) { continue; }

					numTweens--;
					tween.__index = -1;
					tween.__removed = 0;
					this.tweens[index] = this.tweens[numTweens];
				}

				this.tweens.length = numTweens;
				this.tweensRemove.length = 0;
			}

			for(i = 0; i < numTweens; i++) {
				this.tweens[i].update(tDelta);
			}
		}		

		this.__updating = false;

		if(this.entitiesRemove.length > 0) {
			this._removeEntities(this.entitiesRemove);
			this.entitiesRemove.length = 0;
		}	

		// Remove entities picking:
		var num = this.entitiesPickingRemove.length;
		if(num > 0) 
		{
			var n;
			var numPicking = this.entitiesPicking.length;
			for(i = 0; i < num; i++) {
				entity = this.entitiesPickingRemove[i];
				for(n = 0; n < numPicking; n++) {
					if(entity === this.entitiesPicking[n]) {
						numPicking--;
						this.entitiesPicking[n] = this.entitiesPicking[n - 1];
						break;
					}
				}
			}

			this.entitiesPicking.length = numPicking;
			this.entitiesPickingRemove.length = 0;
		}

		// Remove from updating:
		if(this._removeUpdating.length > 0)
		{
			numEntities = this._removeUpdating.length;
			var removeCursor = this.entitiesToUpdate.length - numEntities;
			if(removeCursor > 0)
			{
				var updateIndex;
				for(i = 0; i < numEntities; i++) 
				{
					updateIndex = this._removeUpdating[i]; 
					entity = this.entitiesToUpdate[removeCursor + i];
					entity.__updateIndex = updateIndex;
					this.entitiesToUpdate[updateIndex] = entity;
				}
			}

			this.entitiesToUpdate.length = removeCursor;
			this._removeUpdating.length = 0;
		}		

		// Remove animations:
		if(this.entitiesAnimRemove.length > 0)
		{
			var anim = null;
			var numAnim = this.entitiesAnim.length;
			numEntities = this.entitiesAnimRemove.length;

			for(i = 0; i < numEntities; i++) 
			{
				index = this.entitiesAnimRemove[i];
				anim = this.entitiesAnim[index];
				if(!anim.__removed) { continue; }

				numAnim--;
				anim.__index = -1;
				anim.__removed = 0;
				this.entitiesAnim[index] = this.entitiesAnim[numAnim];
			}	

			this.entitiesAnim.length = numAnim;
			this.entitiesAnimRemove.length = 0;
		}

		// Depth sorting:
		if(this.needSortDepth) {
			this.sort();
		}		
	},

	sort: function()
	{
		var i, j, tmp1, tmp2;
		var num = this.entities.length;
		for(i = 0; i < num; i++) {
			for(j = i; j > 0; j--) {
				tmp1 = this.entities[j];
				tmp2 = this.entities[j - 1];
				if(tmp1.totalZ - tmp2.totalZ < 0) {
					this.entities[j] = tmp2;
					this.entities[j - 1] = tmp1;
				}
			}
		}

		num = this.entitiesPicking.length;
		for(i = 0; i < num; i++) {
			for(j = i; j > 0; j--) {
				tmp1 = this.entitiesPicking[j];
				tmp2 = this.entitiesPicking[j - 1];
				if(tmp1.totalZ - tmp2.totalZ < 0) {
					this.entitiesPicking[j] = tmp2;
					this.entitiesPicking[j - 1] = tmp1;
				}
			}
		}	

		this.needSortDepth = false;
		this.needRender = true;			
	},

	addEntity: function(entity) 
	{
		this.entities.push(entity);
		this._addEntity(entity);

		if(entity.children) {
			this.addEntities(entity.children);
		}					
	},

	_addEntity: function(entity) 
	{
		entity.__added = true;

		if(entity._z !== 0) {
			this.needSortDepth = true;
		}
		if(entity._pickable) {
			this.addPicking(entity);
		}
		if(entity.__debug) {
			this.numDebug++;
		}

		if(!entity._debugger) {
			this.numEntities++;
		}

		entity.updateAnchor();
	},

	addEntities: function(entities)
	{
		var numEntities = entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.addEntity(entities[i]);
		}
	},

	removeEntity: function(entity)
	{
		if(!entity.__added) { return; }

		entity.__added = false;
		this.entitiesRemove.push(entity);

		this.needSortDepth = true;
	},

	removeEntities: function(entities)
	{
		var entity;
		var numRemove = entities.length;

		for(var i = 0; i < numRemove; i++) 
		{
			entity = entities[i];
			if(!entity.__added) { return; }

			entity.__added = false;

			this.entitiesRemove.push(entity);
		}
	},

	_removeEntities: function(entities)
	{
		var entity, n;
		var numRemove = entities.length;
		for(var i = 0; i < numRemove; i++) 
		{
			entity = entities[i];
			entity.__added = false;
			
			for(n = 0; n < this.numEntities; n++) 
			{
				if(this.entities[n] === entity) {
					this.numEntities--;
					this.entities[n] = this.entities[this.numEntities];
					this.entities.pop();
					break;
				}
			}	

			if(entity._pickable) 
			{
				entity._pickable = false;
				entity.flags &= ~entity.Flag.PICKING;

				var numPicking = this.entitiesPicking.length;
				for(var i = 0; i < numPicking; i++) {
					if(this.entitiesPicking[i] === entity) {
						this.entitiesPicking[i] = this.entitiesPicking[numPicking - 1];
						this.entitiesPicking.pop();	
						break;					
					}
				}

				this.needSortDepth = true;
			}			

			if(entity.children) {
				this._removeEntities(entity.children);
			}

			if(entity.removed) {
				entity._remove();
			}			
		}
	},

	addUpdating: function(entity) 
	{
		if(entity.__updateIndex !== -1) { return; }

		entity.__updateIndex = this.entitiesToUpdate.push(entity) - 1;
	},

	removeUpdating: function(entity) 
	{
		if(entity.__updateIndex === -1) { return; }

		this._removeUpdating.push(entity.__updateIndex);
		entity.__updateIndex = -1;
	},

	addPicking: function(entity) 
	{
		if(!entity.__added) { return; }
		if(entity.flags & entity.Flag.PICKING) { return; }

		this.entitiesPicking.push(entity);
		entity.flags |= entity.Flag.PICKING;
	},

	removePicking: function(entity) 
	{
		if(!entity.__added) { return; }
		if((entity.flags & entity.Flag.PICKING) === 0) { return; }

		this.entitiesPickingRemove.push(entity);
		entity.flags &= ~entity.Flag.PICKING;
	},	

	addAnim: function(anim)
	{
		if(anim.__removed) {
			anim.__removed = 0;
		}
		else
		{
			if(anim.__index !== -1) { return; }

			anim.__index = this.entitiesAnim.length;
			this.entitiesAnim.push(anim);
		}
	},

	removeAnim: function(anim)
	{
		if(anim.__removed || anim.__index === -1) { return; }

		this.entitiesAnimRemove.push(anim.__index);
		anim.__removed = 1;
	},

	addTween: function(tween) 
	{
		if(tween.__removed) {
			tween.__removed = 0;
		}
		else
		{
			if(tween.__index !== -1) { return false; }

			tween.__index = this.tweens.length;
			this.tweens.push(tween);
		}

		return true;
	},

	removeTween: function(tween) 
	{
		if(tween.__removed || tween.__index === -1) { return false; }

		this.tweensRemove.push(tween.__index);
		tween.__removed = 1;

		return true;
	},	

	/** 
	 * Callback on input event.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onInput: function(data, event)
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);

		var inputEvent = Input.Event;
		if(inputEvent.DOWN === event)
		{
			if(!this.hoverEntity) { return; }

			data.entity = this.hoverEntity;
			this.pressedEntity = this.hoverEntity;
			this.pressedEntity.pressed = true;

			if(this.pressedEntity._style) {
				this.pressedEntity._onDown.call(this.pressedEntity, data);
			}
			if(this.pressedEntity.onDown) {
				this.pressedEntity.onDown.call(this.pressedEntity, data);
			}
			
			this.chn.onDown.emit(data, Entity.Event.INPUT_DOWN);
		}
		else if(inputEvent.UP === event)
		{
			if(this.pressedEntity) 
			{
				data.entity = this.hoverEntity;

				// INPUT UP
				this.pressedEntity.pressed = false;
				if(this.pressedEntity._style) {
					this.pressedEntity._onUp.call(this.pressedEntity, event);
				}
				if(this.pressedEntity.onUp) {
					this.pressedEntity.onUp.call(this.pressedEntity, event);
				}
				
				this.chn.onUp.emit(this.pressedEntity, Entity.Event.INPUT_UP);	

				// CLICK
				if(this.pressedEntity === this.hoverEntity) 
				{
					if(this.pressedEntity._style) {
						this.pressedEntity._onClick.call(this.pressedEntity, data);
					}
					if(this.pressedEntity.onClick) {
						this.pressedEntity.onClick.call(this.pressedEntity, data);
					}
					
					this.chn.onClick.emit(data, Entity.Event.CLICK);
				}

				// DRAG END?
				if(this.pressedEntity.dragged) 
				{
					data.entity = this.pressedEntity;
					this.pressedEntity.dragged = false;

					if(this.pressedEntity._style) {
						this.pressedEntity._onDragEnd.call(this.pressedEntity, data);
					}
					if(this.pressedEntity.onDragEnd) {
						this.pressedEntity.onDragEnd.call(this.pressedEntity, data);
					}
					
					this.chn.onDragEnd.emit(data, Entity.Event.DRAG_END);
					data.entity = this.hoverEntity;				
				}					

				this.pressedEntity = null;				
			}
		}
	},

	/** 
	 * Callback on input move event.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onInputMove: function(data, event)
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);
		
		if(!this._checkDrag(data)) { 
			data.entity = this.hoverEntity;		
			return; 
		}

		data.entity = this.hoverEntity;
	},	

	onInputDbClick: function(data, event) 
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);

		if(this.hoverEntity) 
		{
			data.entity = this.hoverEntity;	

			if(this.hoverEntity._style) {
				this.hoverEntity._onDbClick.call(this.hoverEntity, data);
			}
			if(this.hoverEntity.onDbClick) {
				this.hoverEntity.onDbClick.call(this.hoverEntity, data);
			}
			
			this.chn.onDbClick.emit(data, Entity.Event.DBCLICK);
		}
		else {
			data.entity = null;
		}
	},

	_checkHover: function(data)
	{
		var entity;
		var numEntities = this.entitiesPicking.length;
		for(var i = numEntities - 1; i >= 0; i--)
		{
			entity = this.entitiesPicking[i];
			if(!entity.visible) { continue; }

			if(this.enablePixelPicking) 
			{
				if(entity._static) 
				{
					if(!entity.isPointInsidePx(data.screenX, data.screenY)) {
						continue;
					}					
				}
				else 
				{
					if(!entity.isPointInsidePx(data.x, data.y)) {
						continue;
					}
				}
			}
			else 
			{
				if(entity._static) 
				{
					if(!entity.isPointInside(data.screenX, data.screenY)) {
						continue;
					}					
				}
				else 
				{
					if(!entity.isPointInside(data.x, data.y)) {
						continue;
					}
				}
			}

			if(this.hoverEntity !== entity)
			{
				// HOVER EXIT
				if(this.hoverEntity)
				{
					data.entity = this.hoverEntity;
					
					this.hoverEntity.hover = false;
					if(this.hoverEntity._style) {
						this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
					}
					if(this.hoverEntity.onHoverExit) {
						this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
					}

					this.chn.onHoverExit.emit(data, Entity.Event.HOVER_EXIT);
				}

				// HOVER ENTER
				data.entity = entity;
				entity.hover = true;

				if(entity._style) {
					entity._onHoverEnter.call(entity, data);
				}
				if(entity.onHoverEnter) {
					entity.onHoverEnter.call(entity, data);
				}
				
				this.chn.onHoverEnter.emit(data, Entity.Event.HOVER_ENTER);
				this.hoverEntity = entity;
			}
			// HOVER
			else
			{
				data.entity = entity;

				if(entity.onHover) {
					entity.onHover.call(entity, data);
				}
				
				this.chn.onHover.emit(data, Entity.Event.HOVER);
			}

			data.entity = null;
			return;
		}

		// HOVER EXIT
		if(this.hoverEntity)
		{
			data.entity = this.hoverEntity;
			this.hoverEntity.hover = false;

			if(this.hoverEntity._style) {
				this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
			}
			if(this.hoverEntity.onHoverExit) {
				this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
			}
			
			this.chn.onHoverExit.emit(data, Entity.Event.HOVER_EXIT);
		}

		this.hoverEntity = null;
	},

	_checkDrag: function(data)
	{
		if(this.pressedEntity)
		{
			data.entity = this.pressedEntity;

			// DRAG START
			if(!this.pressedEntity.dragged) 
			{
				this.pressedEntity.dragged = true;

				if(this.pressedEntity._style) {
					this.pressedEntity._onDragStart.call(this.pressedEntity, data);
				}
				if(this.pressedEntity.onDragStart) {
					this.pressedEntity.onDragStart.call(this.pressedEntity, data);
				}
				
				this.chn.onDragStart.emit(data, Entity.Event.DRAG_START);
			}
			// DRAG
			else 
			{
				if(this.pressedEntity.onDrag) {
					this.pressedEntity.onDrag.call(this.pressedEntity, data);
				}
				
				this.chn.onDrag.emit(data, Entity.Event.DRAG);				
			}

			return false;
		}

		return true;
	},	

	onCameraResize: function(data, event) 
	{
		this.holder.resize(data.width, data.height);
		this.staticHolder.resize(this.engine.width, this.engine.height);

		var entity;
		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) 
		{
			entity = this.entities[i];
			if(entity.parent !== this.holder) { continue; }

			entity._updateResize();
		}	
	},

	onCameraMove: function(data, event) {
		this.needRender = true;
	},

	onAdapt: function(data, event) {

	},	

	/**
	 * Get unique id.
	 * @return {number} Generated unique id.
	 */
	getUniqueID: function() {
		return this.__uniqueID++;
	},

	set bgColor(hex) {
		this._bgColor = hex;
		this.updateBgColor();
		this.needRender = true;
	},

	get bgColor() { return this._bgColor; },

	set transparent(value) {
		this._transparent = value;
		this.updateBgColor();
		this.needRender = true;
	},

	get transparent() { return this._transparent; },	

	set needRender(value) {
		this._needRender = value;
	},
	get needRender() { return this._needRender; },

	addRender: function(owner) {
		this._renderFuncs.push(owner);
	},

	removeRender: function(owner) 
	{
		var length = this._renderFuncs.length;
		for(var i = 0; i < length; i++) {
			if(this._renderFuncs[i] === owner) {
				this._renderFuncs[i] = this._renderFuncs[length - 1];
				this._renderFuncs.pop();
				break;
			}
		}
	},	

	//
	meta: meta,
	engine: null,
	chn: null,

	holder: null,
	staticHolder: null,

	camera: null,
	cameraDefault: null,
	cameraUI: null,

	entities: [],
	entitiesRemove: [],
	entitiesToUpdate: [],
	_removeUpdating: [],
	numEntities: 0,

	entitiesAnim: [],
	entitiesAnimRemove: [],	

	entitiesPicking: [],
	entitiesPickingRemove: [],
	hoverEntity: null,
	pressedEntity: null,
	enablePicking: true,
	enablePixelPicking: false,	

	tweens: [],
	tweensRemove: [],

	_needRender: true,
	needSortDepth: false,

	_renderFuncs: [],

	numDebug: 0,

	_bgColor: "#ddd",
	_transparent: false,	

	__uniqueID: 0,
	__updating: false
});
