"use strict";

meta.class("meta.Renderer", 
{
	init: function() 
	{
		this.holder = new Entity.Geometry();
		this.staticHolder = new Entity.Geometry();

		this.entityFlags = Entity.Geometry.prototype.Flag;

		Entity.Geometry.prototype.renderer = this;
		Entity.Geometry.prototype.parent = this.holder;
	},

	load: function() 
	{
		this.engine = meta.engine;

		this.camera = meta.camera;
		this.cameraVolume = this.camera.volume;
		this.cameraDefault = this.camera;
		//this.cameraUI = new meta.Camera();


		this.chn = {
			onDown: 		meta.createChannel(Entity.Event.INPUT_DOWN),
			onUp: 			meta.createChannel(Entity.Event.INPUT_UP),
			onClick: 		meta.createChannel(Entity.Event.CLICK),
			onDbClick: 		meta.createChannel(Entity.Event.DBCLICK),
			onDrag: 		meta.createChannel(Entity.Event.DRAG),
			onDragStart: 	meta.createChannel(Entity.Event.DRAG_START),
			onDragEnd: 		meta.createChannel(Entity.Event.DRAG_END),
			onHover: 		meta.createChannel(Entity.Event.HOVER),
			onHoverEnter: 	meta.createChannel(Entity.Event.HOVER_ENTER),
			onHoverExit: 	meta.createChannel(Entity.Event.HOVER_EXIT)
		};

		meta.input.onDown.add(this.onInputDown, this, meta.Priority.HIGH);
		meta.input.onUp.add(this.onInputUp, this, meta.Priority.HIGH);
		meta.input.onMove.add(this.onInputMove, this, meta.Priority.HIGH);
		meta.input.onDbClick.add(this.onInputDbClick, this, meta.Priority.HIGH);

		meta.engine.onAdapt.add(this.onAdapt, this);
		meta.camera.onResize.add(this.onCameraResize, this);
		meta.camera.onMove.add(this.onCameraMove, this);

		this.holder.resize(this.camera.volume.width, this.camera.volume.height);
	},

	update: function(tDelta)
	{
		// Removal.	
		if(this.entitiesRemove.length > 0) {
			this._removeEntities(this.entitiesRemove);
			this.entitiesRemove.length = 0;
		}

		this._removeUpdateEntities();
		this._removeAnimEntities();
		this._removePickingEntities();
		this._removeTweens();		

		// Updating.
		this.__updating = true;	

		var num = this.entitiesUpdate.length;
		for(var i = 0; i < num; i++) {
			this.entitiesUpdate[i].update(tDelta);
		}	

		num = this.tweens.length;
		for(i = 0; i < num; i++) {
			this.tweens[i].update(tDelta);
		}

		this.__updating = false;

		if(this.needSortDepth) {
			this.sort();
		}		
	},

	_removeEntities: function(entities)
	{		
		this._removeStartID = Number.MAX_SAFE_INTEGER;

		this._removeEntitiesGroup(entities);

		var value;
		for(var n = this._removeStartID + 1; n < this.numEntities; n++)
		{
			value = this.entities[n];
			if(value) {
				this.entities[this._removeStartID++] = value;
			}
		}

		this.numEntities -= this._numRemove;
		this.entities.length = this.numEntities;
		this._numRemove = 0;

		this.needRender = true;
	},

	_removeEntitiesGroup: function(entities)
	{
		var entity, n;
		var numRemove = entities.length;

		this._numRemove += numRemove;
		
		for(var i = 0; i < numRemove; i++) 
		{
			entity = entities[i];
			if(!entity) { continue; }
			
			for(n = 0; n < this.numEntities; n++) 
			{
				if(this.entities[n] === entity) 
				{
					this.entities[n] = null;

					if(n < this._removeStartID) {
						this._removeStartID = n;
					}
					break;
				}
			}

			if(entity.__updateIndex !== -1) {
				this.entitiesUpdateRemove.push(entity);
				entity.__updateIndex = -1;
			}
			if(entity.__pickIndex !== -1) {
				this.entitiesPickingRemove.push(entity);
				entity.__pickIndex = -1;
			}

			if(entity.children) {
				this._removeEntitiesGroup(entity.children);
			}

			if(entity.removed) {
				entity._remove();
			}		

			entity.flags &= ~entity.Flag.WILL_REMOVE;
		}
	},

	_removeUpdateEntities: function()
	{
		var numRemove = this.entitiesUpdateRemove.length;		
		if(numRemove > 0)
		{
			var numEntities = this.entitiesUpdate.length;
			var itemsLeft = numEntities - numRemove;
			if(itemsLeft > 0)
			{
				var index;
				for(var i = 0; i < numRemove; i++) 
				{
					index = this.entitiesUpdate.indexOf(this.entitiesUpdateRemove[i]);
					if(index < itemsLeft) {
						this.entitiesUpdate.splice(index, 1);
					}
					else {
						this.entitiesUpdate.pop();
					}
				}
			}
			else {
				this.entitiesUpdate.length = 0;
			}

			this.entitiesUpdateRemove.length = 0;
		}
	},

	_removeAnimEntities: function()
	{
		var numRemove = this.entitiesAnimRemove.length;		
		if(numRemove > 0)
		{
			var numEntities = this.entitiesAnim.length;
			var itemsLeft = numEntities - numRemove;
			if(itemsLeft > 0)
			{
				var index;
				for(var i = 0; i < numRemove; i++) 
				{
					index = this.entitiesAnim.indexOf(this.entitiesAnimRemove[i]);
					if(index < itemsLeft) {
						this.entitiesAnim.splice(index, 1);
					}
					else {
						this.entitiesAnim.pop();
					}
				}
			}
			else {
				this.entitiesAnim.length = 0;
			}

			this.entitiesAnimRemove.length = 0;
		}
	},

	_removePickingEntities: function()
	{
		var numRemove = this.entitiesPickingRemove.length;
		if(numRemove === 0) { return; }
		
		var numEntities = this.entitiesPicking.length;
		var itemsLeft = numEntities - numRemove;
		if(itemsLeft > 0)
		{
			var n, entity;
			var startID = Number.MAX_SAFE_INTEGER;

			for(var i = 0; i < numRemove; i++) 
			{
				entity = this.entitiesPickingRemove[i];

				for(n = 0; n < numEntities; n++) 
				{
					if(this.entitiesPicking[n] === entity) 
					{
						this.entitiesPicking[n] = null;

						if(n < startID) {
							startID = n;
						}
						break;
					}
				}
			}

			var value;
			for(n = startID + 1; n < numEntities; n++)
			{
				value = this.entitiesPicking[n];
				if(value) {
					this.entitiesPicking[startID++] = value;
				}
			}

			this.entitiesPicking.length = itemsLeft;
		}
		else {
			this.entitiesPicking.length = 0;
		}

		this.entitiesPickingRemove.length = 0;
	},

	_removeTweens: function()
	{
		var numRemove = this.tweensRemove.length;
		if(numRemove > 0) 
		{
			var numTweens = this.tweens.length;
			var itemsLeft = numTweens - numRemove;
			if(itemsLeft > 0)
			{
				var index;
				for(var i = 0; i < numRemove; i++) 
				{
					index = this.tweens.indexOf(this.tweensRemove[i]);
					if(index < itemsLeft) {
						this.tweens.splice(index, 1);
					}
					else {
						this.tweens.pop();
					}
				}
			}
			else {
				this.tweens.length = 0;
			}

			this.tweensRemove.length = 0;
		}		
	},

	sort: function()
	{
		var i, j, tmp1, tmp2;
		var num = this.entities.length;
		for(i = 0; i < num; i++) 
		{
			for(j = i; j > 0; j--) {
				tmp1 = this.entities[j];
				tmp2 = this.entities[j - 1];
				if(tmp1.totalZ < tmp2.totalZ) {
					this.entities[j] = tmp2;
					this.entities[j - 1] = tmp1;
				}
			}
		}

		num = this.entitiesPicking.length;
		for(i = 0; i < num; i++) 
		{
			for(j = i; j > 0; j--) {
				tmp1 = this.entitiesPicking[j];
				tmp2 = this.entitiesPicking[j - 1];
				if(tmp1.totalZ < tmp2.totalZ) {
					this.entitiesPicking[j] = tmp2;
					this.entitiesPicking[j - 1] = tmp1;
				}
			}
		}	

		this.needSortDepth = false;
		this.needRender = true;			
	},

	addEntity: function(entity, reuse) 
	{
		entity.flags |= entity.Flag.ADDED;

		if(!entity._z === 0) {
			this.needSortDepth = true;
		}

		if(entity.flags & entity.Flag.UPDATING) {
			entity.updating = true;
		}
		if(entity.flags & entity.Flag.PICKING) {
			entity.picking = true;
		}
		if(entity.__debug) {
			this.numDebug++;
		}

		entity._updateAnchor();

		if(reuse || entity.flags & entity.Flag.WILL_REMOVE) 
		{
			var index = this.entitiesRemove.indexOf(entity);
			this.entitiesRemove[index] = null;
			entity.flags &= ~entity.Flag.WILL_REMOVE;

			reuse = true;
		}
		else 
		{
			if(!entity._debugger) {
				this.numEntities++;
			}

			this.entities.push(entity);
		}

		if(entity.children) 
		{
			var entities = entity.children
			var numEntities = entities.length;
			for(var i = 0; i < numEntities; i++) {
				this.addEntity(entities[i], reuse);
			}
		}
	},	

	addEntities: function(entities)
	{
		var numEntities = entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.addEntity(entities[i], false);
		}
	},	

	removeEntity: function(entity)
	{
		if(entity.flags & entity.Flag.WILL_REMOVE) { return; }

		entity.flags |= entity.Flag.WILL_REMOVE;
		entity.flags &= ~entity.Flag.ADDED;
		
		this.entitiesRemove.push(entity);
	},

	removeEntities: function(entities)
	{
		var numRemove = entities.length;
		for(var i = 0; i < numRemove; i++) {
			this.removeEntity(entities[i]);
		}
	},

	addAnim: function(anim)
	{
		if(anim.__index !== -1) { return; }

		anim.__index = this.entitiesAnim.push(anim) - 1;
	},

	removeAnim: function(anim)
	{
		if(anim.__index === -1) { return; }

		this.entitiesAnimRemove.push(anim);
		anim.__index = -1;
	},

	/** 
	 * Callback on input event.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onInputDown: function(data, event)
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);
		if(!this.hoverEntity) { return; }

		//
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
	},

	onInputUp: function(data, event)
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);
		if(!this.hoverEntity) { return; }

		//
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

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i]._updateResize();
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

	entityFlags: null,

	camera: null,
	cameraVolume: null,
	cameraDefault: null,
	cameraUI: null,

	entities: [],
	entitiesRemove: [],
	numEntities: 0,
	_numRemove: 0,
	_removeStartID: 0,

	entitiesUpdate: [],
	entitiesUpdateRemove: [],

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

	currZ: 0,
	numDebug: 0,

	_bgColor: "#ddd",
	_transparent: false,	

	__uniqueID: 0,
	__updating: false
});
