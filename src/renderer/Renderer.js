"use strict";

meta.Renderer = meta.Class.extend
({
	init: function() 
	{
		this.holder = new Entity.Geometry();

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

		meta.subscribe(this, meta.Event.RESIZE, this.onResize);
		meta.subscribe(this, meta.Event.ADAPT, this.onAdapt);	
		meta.subscribe(this, meta.Event.CAMERA_MOVE, this.onCameraMove);

		this.holder.resize(this.camera.volume.width, this.camera.volume.height);

		this.debugger = new meta.Debugger();
	},

	update: function(tDelta)
	{
		this.__updating = true;

		var numEntities = this.entitiesToUpdate.length;
		for(var i = 0; i < numEntities; i++) {
			this.entitiesToUpdate[i].update(tDelta);
		}

		this.__updating = false;

		if(this.removeUpdating.length > 0)
		{
			var updateIndex, lastEntity;
			numEntities = this.removeUpdating.length;
			for(i = 0; i < numEntities; i++) 
			{
				updateIndex = this.removeUpdating[i]; 
				lastEntity = this.entitiesToUpdate[this.entitiesToUpdate.length - 1];
				lastEntity.__updateIndex = updateIndex;
				this.entitiesToUpdate[updateIndex] = lastEntity;
				this.entitiesToUpdate.pop();
			}

			this.removeUpdating.length = 0;
		}

		if(this.needSortDepth) {
			this.entities.sort(this._sortEntities);
			this.entitiesPicking.sort(this._sortEntities);
			this.entitiesUI.sort(this._sortEntities);
			this.needSortDepth = false;
			this.needRender = true;
		}		
	},

	_sortEntities: function(a, b) {
		return a.totalZ - b.totalZ;
	},	

	addEntity: function(entity) 
	{
		if(entity.__ui)
		{
			this.entitiesUI.push(entity);
			this._addEntity(entity);

			if(entity.children) {
				this.addEntitiesUI(entity.children);
			}
		}
		else
		{
			this.entities.push(entity);
			this._addEntity(entity);

			if(entity.children) {
				this.addEntities(entity.children);
			}			
		}		
	},

	addEntityUI: function(entity) 
	{
		this.entitiesUI.push(entity);
		this._addEntity(entity);

		if(entity.children) {
			this.addEntitiesUI(entity.children);
		}		
	},	

	_addEntity: function(entity) 
	{
		entity.__added = true;

		if(entity.update) {
			this.addEntityToUpdate(entity);
		}
		if(entity._z !== 0) {
			this.needSortDepth = true;
		}
		if(entity._pickable) {
			this.addPicking(entity);
		}
		if(entity.__debug) {
			this.numDebug++;
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

	addEntitiesUI: function(entities)
	{
		var numEntities = entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.addEntityUI(entities[i]);
		}
	},

	removeEntities: function(entities)
	{

	},

	removeEntitiesUI: function(entities)
	{

	},

	addEntityToUpdate: function(entity) 
	{
		if(entity.__updateIndex !== -1) { return; }

		entity.__updateIndex = this.entitiesToUpdate.length;
		this.entitiesToUpdate.push(entity);
	},

	removeEntityFromUpdate: function(entity) 
	{
		if(entity.__updateIndex === -1) { return; }

		if(this.__updating) {
			this.removeUpdating.push(entity.__updateIndex);
		}
		else {
			var lastEntity = this.entitiesToUpdate[this.entitiesToUpdate.length - 1];
			lastEntity.__updateIndex = entity.__updateIndex;
			this.entitiesToUpdate[entity.__updateIndex] = lastEntity;
			this.entitiesToUpdate.pop();
		}

		entity.__updateIndex = -1;
	},

	addAnim: function(anim)
	{
		if(anim.__index !== -1) { return; }

		anim.__index = this.entitiesAnim.length;
		this.entitiesAnim.push(anim);
	},

	removeAnim: function(anim)
	{
		if(anim.__index === -1) { return; }

		this.entitiesAnimRemove.push(anim.__index);
		anim.__index = -1;
	},

	addPicking: function(entity) 
	{
		if(!entity.__added) { return; }
		if(entity._pickable) { return; }

		this.entitiesPicking.push(entity);
	},

	removePicking: function(entity) 
	{
		if(!entity.__added) { return; }
		if(!entity._pickable) { return; }

		//this.entities
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

			if(this.enablePixelPicking) 
			{
				if(!entity.isPointInsidePx(data.x, data.y)) {
					continue;
				}
			}
			else 
			{
				if(!entity.isPointInside(data.x, data.y)) {
					continue;
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

	onResize: function(data, event) 
	{
		console.log("resize", data.width, data.height, this.holder.volume.height);
		this.holder.resize(data.width, data.height);

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].updateAnchor();
		}

		numEntities = this.entitiesUI.length;
		for(i = 0; i < numEntities; i++) {
			this.entitiesUI[i].updateAnchor();
		}		
	},

	onAdapt: function(data, event) {

	},

	onCameraMove: function(data, event) {
		this.needRender = true;
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

	//
	meta: meta,
	engine: null,
	chn: null,
	holder: null,

	camera: null,
	cameraDefault: null,
	cameraUI: null,

	debugger: null,

	entities: [],
	entitiesToUpdate: [],
	removeUpdating: [],

	entitiesUI: [],

	entitiesAnim: [],
	entitiesAnimRemove: [],	

	entitiesPicking: [],
	entitiesPickingRemove: [],
	hoverEntity: null,
	pressedEntity: null,
	enablePicking: true,
	enablePixelPicking: false,	

	_needRender: true,
	needSortDepth: false,

	numDebug: 0,

	_bgColor: "#ddd",
	_transparent: false,	

	__uniqueID: 0,
	__updating: false
});
