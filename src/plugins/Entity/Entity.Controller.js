"use strict";

/**
 * @namespace
 */
window.Entity = {};

/**
 * @class Entity.Controller
 * @extends meta.Controller
 * @memberof! <global>
 */
Entity.Controller = meta.Controller.extend
( /** @lends Entity.Controller.prototype */ {

	init: function()
	{
		var entityProto = Entity.Geometry.prototype;
		entityProto._entityCtrl = this;
		entityProto._parent = this;
		this.InputFlag = entityProto.InputFlag;

		this.entities = [];
		this.entitiesToUpdate = [];
		this.entitiesToRemove = [];
		this.entitiesRemoveUpdate = [];
		this.detachBuffer = [];

		this._centerTex = new Resource.Texture();
		this._centerTex.fillRect({
			color: "#ff0000",
			width: 6, height: 6
		});

		var scope = meta;
		this._chnOnDown = scope.createChannel(Entity.Event.INPUT_DOWN);
		this._chnOnUp = scope.createChannel(Entity.Event.INPUT_UP);
		this._chnOnClick = scope.createChannel(Entity.Event.CLICK);
		this._chnOnDbClick = scope.createChannel(Entity.Event.DBCLICK);
		this._chnOnDrag = scope.createChannel(Entity.Event.DRAG);
		this._chnOnDragStart = scope.createChannel(Entity.Event.DRAG_START);
		this._chnOnDragEnd = scope.createChannel(Entity.Event.DRAG_END);
		this._chnOnHover = scope.createChannel(Entity.Event.HOVER);
		this._chnOnHoverEnter = scope.createChannel(Entity.Event.HOVER_ENTER);
		this._chnOnHoverExit = scope.createChannel(Entity.Event.HOVER_EXIT);

		scope.subscribe(this, scope.Event.RESIZE, this.onResize);
		scope.subscribe(this, scope.Event.CAMERA_MOVE, this.onMove);
		scope.subscribe(this, scope.Event.ADAPT, this.onAdapt);

		this.volume = scope.camera.volume;
		this.onMove(scope.camera, null);
	},

	load: function()
	{
		meta.subscribe(this, [ Input.Event.INPUT_DOWN, Input.Event.INPUT_UP ], this.onInput, meta.Priority.HIGH);
		meta.subscribe(this, Input.Event.INPUT_DBCLICK, this.onInputDbCLick, meta.Priority.HIGH);
		meta.subscribe(this, Input.Event.INPUT_MOVE, this.onInputMove, meta.Priority.HIGH);
	},

	update: function(tDelta)
	{
		this.updateFlag |= 0;

		var i, n, entity;
		var children, numChildren;

		// Force update hover if is needed.
		if(this._flags & this.Flag.UPDATE_HOVER) {
			this._checkHover(Input.ctrl.getEvent());
			this._flags &= ~this.Flag.UPDATE_HOVER;
		}

		for(i = 0; i < this.numEntitiesToUpdate; i++)
		{
			entity = this.entitiesToUpdate[i];
			if(entity.isPaused || entity.isRemoved) { continue; }

			if(entity.update) {
				entity.update(tDelta);
			}
			if(entity.components) {
				entity._updateComponents(tDelta);
			}
		}

		if(this.numDetachItems)
		{
			for(i = 0; i < this.numDetachItems; i++)
			{
				entity = this.detachBuffer[i];
				children = entity._parent.children;
				numChildren = children.length;
				if(numChildren === 0) { continue; }

				for(n = 0; n < numChildren; n++)
				{
					if(children[n] === entity) {
						children[n] = children[numChildren - 1];
						children.pop();
						break;
					}
				}
			}

			this.detachBuffer.length = 0;
			this.numDetachItems = 0;
		}

		if(this.entitiesToRemove.length) {
			this._removeEntities(this.entitiesToRemove);
			this.entitiesToRemove.length = 0;
		}

		if(this.numEntitiesRemoveUpdate) 
		{
			var tmpEntity;
			for(i = 0; i < this.numEntitiesRemoveUpdate; i++) 
			{
				entity = this.entitiesRemoveUpdate[i];
				this.entitiesRemoveUpdate[i] = null;
				
				// Check if still is marked for update removal.
				if((entity._removeFlag & 4) !== 4) { 
					continue; 
				}
	
				this.numEntitiesToUpdate--;
				tmpEntity = this.entitiesToUpdate[this.numEntitiesToUpdate];
				tmpEntity._updateNodeID = entity._updateNodeID;
				this.entitiesToUpdate[entity._updateNodeID] = tmpEntity;
				this.entitiesToUpdate[this.numEntitiesToUpdate] = null;		
				entity._removeFlag &= ~4;
				entity._updateNodeID = -1;
			}

			this.numEntitiesRemoveUpdate = 0;
		}

		if(this.needDepthSort) {
			this.entities.sort(this._sortEntities);
			this.needDepthSort = false;
		}

		this.updateFlag &= ~1;
	},


	_addToDrawBounds: function() {
		this.numShowBounds++;
		this.isNeedRender = true;
	},

	_removeToDrawBounds: function() {
		this.numShowBounds--;
		this.isNeedRender = true;
	},


	/**
	 * Callback function which handles entities that are added from the view.
	 * @param entities {Entity.Geometry} Entity or array with entities added to the view.
	 */
	addEntities: function(entities)
	{
		if(entities instanceof Array) 
		{
			var numEntities = entities.length;
			this.entities.length += numEntities;

			for(var i = 0; i < numEntities; i++) {
				this._addEntity(entities[i]);
			}
		}
		else 
		{
			if(entities instanceof Entity.Geometry) {
				this.entities.length++;
				this._addEntity(entities);
			}
			else {
				console.warn("(Entity.Controller.addEntities) Invalid type for entities");
				return;
			}
		}

		this._flags |= this.Flag.UPDATE_HOVER;
		this.isNeedRender = true;
	},

	_addEntity: function(entity)
	{
		if(entity.isRemoved) { return; }

		this.entities[this.numEntities++] = entity;

		if(!entity.texture) {
			entity.isLoaded = true;
		}

		if(entity.update) {
			entity.isUpdating = true;
		}

		if(entity.isNeedStyle) {
			entity._style.update(entity);
		}

		if(entity.totalZ !== 0) {
			this.needDepthSort = true;
		}

		if(entity.isLoaded) {
			entity._onResize(this);
		}

		if(entity.children)
		{
			var numChildren = entity.children.length;
			for(var i = 0; i < numChildren; i++) {
				this._addEntity(entity.children[i]);
			}
		}		
	},	

	/**
	 * Callback function which handles entities that are removed from the view.
	 * @param entities {Entity.Geometry} Entity or array with entities removed from the view.
	 */
	removeEntities: function(entities)
	{
		if(entities instanceof Array)
		{
			if(this.updateFlag)
			{
				var numEntities = entities.length;
				this.entitiesToRemove.length += numEntities;

				for(var i = 0; i < numEntities; i++) {
					this.entitiesToRemove.push(entities[i]);
				}
			}
			else {
				this._removeEntities(entities);	
			}
		}
		else
		{
			if(entities instanceof Entity.Geometry) 
			{
				if(this.updateFlag) {
					this.entitiesToRemove.push(entities);
				}
				else 
				{
					for(var n = 0; n < this.numEntities; n++)
					{
						if(this.entities[n] === entities) 
						{
							this.numEntities--;
							this.entities[n] = this.entities[this.numEntities];
							this.entities.pop();

							if(entities.children) {
								this._removeEntities(entities.children);
							}
							break;
						}
					}												
				}
			}
			else {
				console.warn("(Entity.Controller.removeEntities) Invalid type for entities");
				return;					
			}
		}

		this._flags |= this.Flag.UPDATE_HOVER;
		this.isNeedRender = true;
		this.needDepthSort = true;
	},

	_removeEntities: function(buffer)
	{
		var entity, n;
		var numItems = buffer.length;
		for(var i = 0; i < numItems; i++)
		{
			entity = buffer[i];
			for(n = 0; n < this.numEntities; n++)
			{
				if(this.entities[n] === entity) 
				{
					this.numEntities--;
					this.entities[n] = this.entities[this.numEntities];
					this.entities.pop();

					if(entity.children) {
						this._removeEntities(entity.children);
					}
					break;
				}
			}
		}
	},

	_addToUpdating: function(entity)
	{
		if(!entity) {
			console.warn("(Entity.Controller._addToUpdating) Invalid or object is null.");
			return;
		}

		// Check if entity is marked for update removal.
		if((entity._removeFlag & 4) === 4) {
			entity._removeFlag &= ~4;
			return true;
		}
		else if(entity._updateNodeID !== -1) {
			return false;
		}

		entity._updateNodeID = this.numEntitiesToUpdate;
		
		if(this.entitiesToUpdate.length === this.numEntitiesToUpdate) {
			this.entitiesToUpdate.length += 8;
		}

		this.entitiesToUpdate[this.numEntitiesToUpdate] = entity;
		this.numEntitiesToUpdate++;	

		return true;	
	},

	_removeFromUpdating: function(entity) 
	{
		if(!entity) {
			console.warn("[Entity.Controller._addToUpdating]:", "Invalid or object is null.");
			return;
		}

		// Check if already marked for update removal.
		if(entity._updateNodeID === -1 || (entity._removeFlag & 4) === 4) {
			return false;
		}

		if(this.entitiesRemoveUpdate.length === this.numEntitiesRemoveUpdate) {
			this.entitiesRemoveUpdate.length += 4;
		}

		entity._removeFlag |= 4;
		this.entitiesRemoveUpdate[this.numEntitiesRemoveUpdate] = entity;
		this.numEntitiesRemoveUpdate++;

		return true;
	},

	_sortEntities: function(a, b) {
		return a.totalZ - b.totalZ;
	},

	getFromVolume: function(volume)
	{
		var entity;
		var currNode = this.entities.last.prev;
		var lastNode = this.entities.first;
		for(; currNode !== lastNode; currNode = currNode.prev)
		{
			entity = currNode.entity;
			if(!entity.pickable) { continue; }
			if(entity.volume === volume) { continue; }

			if(entity.volume.vsAABB(volume)) {
				return entity;
			}
		}

		return null;
	},

	getFromPoint: function(x, y, exclude)
	{
		var entity;
		var currNode = this.entities.last.prev;
		var lastNode = this.entities.first;
		for(; currNode !== lastNode; currNode = currNode.prev)
		{
			entity = currNode.entity;
			if(!entity.pickable) { continue; }
			if(entity === exclude) { continue; }

			if(entity.volume.vsPoint(x, y)) {
				return entity;
			}
		}

		return null;
	},	

	getFromEntity: function(entity) {
		return this.getFromVolume(entity.volume);
	},


	/**
	 * Cache an entity. Empty by default.
	 * @param entity {Entity.Geometry} Entity to cache.
	 */
	cacheEntity: meta.emptyFuncParam,

	/**
	 * Uncache an cached entity. Empty by default.
	 * @param entity {Entity.Geometry} Entity to uncache.
	 */
	uncacheEntity: meta.emptyFuncParam,


	/** 
	 * Callback on screen resize.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onResize: function(data, event) 
	{
		for(var i = 0; i < this.numEntities; i++) {
			this.entities[i]._onResize(this);
		}

		this.isNeedRender = true;
	},

	/** 
	 * Callback on camera move.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onMove: function(data, event) 
	{
		var volume = data.volume
		this.prevStartCellX = this.startCellX;
		this.prevStartCellY = this.startCellY;
		this.prevEndCellX = this.endCellX;
		this.prevEndCellY = this.endCellY;
		this.startCellX = Math.floor(volume.minX / this._cellSizeX);
		this.startCellY = Math.floor(volume.minY / this._cellSizeY);
		this.endCellX = Math.floor(volume.maxX / this._cellSizeX);
		this.endCellY = Math.floor(volume.maxY / this._cellSizeY);

		var loopStartX = Math.min(this.prevStartCellX, this.startCellX);
		var loopStartY = Math.min(this.prevStartCellY, this.startCellY);
		var loopEndX = Math.max(this.prevEndCellX, this.endCellX);
		var loopEndY = Math.max(this.prevEndCellY, this.endCellY);

		var index, cell;
		for(var y = loopStartY; y < loopEndY; y++)
		{
			for(var x = loopStartX; x < loopEndX; x++) {
				index = x | (y << 16);
			}
		}

		this.x = data._x | 0;
		this.y = data._y | 0;	
		this.isNeedRender = true;
	},

	/** 
	 * Callback on resolution change.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onAdapt: function(data, event)
	{
		for(var i = 0; i < this.numEntities; i++) {
			this.entities[i].adapt();
		}
	},


	/** 
	 * Callback on input event.
	 * @param data {*} Event data.
	 * @param event {*} Event type.
	 */
	onInput: function(data, event)
	{
		if(!this.enablePicking) { return; }

		// var cellX = Math.floor(data.x / this._cellSizeX);
		// var cellY = Math.floor(data.y / this._cellSizeY);
		// var index = cellX | (cellY << 16);
		// var cell = this.cells[index];

		// console.log(cell, cellX, cellY);
		// return;

		this._checkHover(data);

		var inputEvent = Input.Event;
		if(inputEvent.INPUT_DOWN === event)
		{
			if(!this.hoverEntity || !this.hoverEntity.clickable) { return; }

			data.entity = this.hoverEntity;
			this.pressedEntity = this.hoverEntity;
			this.pressedEntity._inputFlags |= this.InputFlag.PRESSED;
			if(this.pressedEntity._style) {
				this.pressedEntity._onDown.call(this.pressedEntity, data);
			}
			this.pressedEntity.onDown.call(this.pressedEntity, data);
			this._chnOnDown.emit(data, Entity.Event.INPUT_DOWN);
		}
		else if(inputEvent.INPUT_UP === event)
		{
			if(this.pressedEntity && this.pressedEntity.clickable) 
			{
				data.entity = this.hoverEntity;

				// Input Up.
				this.pressedEntity._inputFlags &= ~this.InputFlag.PRESSED;
				if(this.pressedEntity._style) {
					this.pressedEntity._onUp.call(this.pressedEntity, event);
				}
				this.pressedEntity.onUp.call(this.pressedEntity, event);
				this._chnOnUp.emit(this.pressedEntity, Entity.Event.INPUT_UP);	

				// Click.
				if(this.pressedEntity === this.hoverEntity) {
					this.pressedEntity._onClick.call(this.pressedEntity, data);
					this.pressedEntity.onClick.call(this.pressedEntity, data);
					this._chnOnClick.emit(data, Entity.Event.CLICK);
				}

				// Drag end?
				if(this.pressedEntity._inputFlags & this.InputFlag.DRAGGED) 
				{
					data.entity = this.pressedEntity;

					this.pressedEntity._inputFlags &= ~this.InputFlag.DRAGGED;
					if(this.pressedEntity._style) {
						this.pressedEntity._onDragEnd.call(this.pressedEntity, data);
					}
					this.pressedEntity.onDragEnd.call(this.pressedEntity, data);
					this._chnOnDragEnd.emit(data, Entity.Event.DRAG_END);

					data.entity = this.hoverEntity;				
				}					

				this.pressedEntity = null;				
			}
		}
	},

	onInputDbCLick: function(data, event) 
	{
		if(!this.enablePicking) { return; }

		this._checkHover(data);

		if(this.hoverEntity) {
			this.hoverEntity._onDbClick.call(this.hoverEntity, data);
			this.hoverEntity.onDbClick.call(this.hoverEntity, data);
			this._chnOnDbClick.emit(data, Entity.Event.DBCLICK);
			data.entity = this.hoverEntity;	
		}
		else {
			data.entity = null;
		}
	},

	_checkHover: function(data)
	{
		// var cellX = Math.floor(data.x / this._cellSizeX);
		// var cellY = Math.floor(data.y / this._cellSizeY);
		// var index = cellX | (cellY << 16);
		// var cell = this.cells[index];

		// if(cell)
		// {
			var entity;
			for(var i = this.numEntities - 1; i >= 0; i--)
			{
				entity = this.entities[i];
				
				if(!entity.pickable) { continue; }

				if(entity.isInside(data.x, data.y))
				{
					if(this.hoverEntity !== entity)
					{
						if(this.hoverEntity)
						{
							data.entity = this.hoverEntity;
							this.hoverEntity._inputFlags &= ~this.InputFlag.HOVER;
							if(this.hoverEntity._style) {
								this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
							}
							this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
							this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
						}

						data.entity = entity;
						entity._inputFlags |= this.InputFlag.HOVER;
						if(entity._style) {
							entity._onHoverEnter.call(entity, data);
						}
						entity.onHoverEnter.call(entity, data);
						this._chnOnHoverEnter.emit(data, Entity.Event.HOVER_ENTER);

						this.hoverEntity = entity;
					}
					else
					{
						data.entity = entity;
						entity.onHover.call(entity, data);
						this._chnOnHover.emit(data, Entity.Event.HOVER);
					}

					data.entity = null;
					return;
				}
			}
		//}

		if(this.hoverEntity)
		{
			data.entity = this.hoverEntity;
			this.hoverEntity._inputFlags &= ~this.InputFlag.HOVER;
			if(this.hoverEntity._style) {
				this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
			}
			this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
			this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
		}

		this.hoverEntity = null;
	},

	_checkDrag: function(data)
	{
		if(this.pressedEntity && this.pressedEntity.clickable)
		{
			data.entity = this.pressedEntity;

			if(!(this.pressedEntity._inputFlags & this.InputFlag.DRAGGED)) 
			{
				this.pressedEntity._inputFlags |= this.InputFlag.DRAGGED;
				if(this.pressedEntity._style) {
					this.pressedEntity._onDragStart.call(this.pressedEntity, data);
				}
				this.pressedEntity.onDragStart.call(this.pressedEntity, data);
				this._chnOnDragStart.emit(data, Entity.Event.DRAG_START);
				return false;			
			}

			this.pressedEntity.onDrag.call(this.pressedEntity, data);
			this._chnOnDrag.emit(data, Entity.Event.DRAG);
			return false;
		}

		return true;
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


	/** 
	 * Get entity from ID.
	 * @param id {Number} ID of the entity.
	 */
	getByID: function(id)
	{
		var buffer = this.entities.buffer;
		var num = this.entities.length;
		for(var n = 0; n < num; n++) 
		{
			if(id === buffer[n].id) {
				return buffer[n];
			}
		}
	},

	/** 
	 * Get entity from Name.
	 * @param name {String} Name of the entity.
	 */
	getByName: function(name)
	{
		var buffer = this.entities.buffer;
		var num = this.entities.length;
		for(var n = 0; n < num; n++) 
		{
			if(name === buffer[n].name) {
				return buffer[n];
			}
		}
	},	


	/**
	 * Get unique id.
	 * @return {Number} Generated unique id.
	 */
	getUniqueID: function() {
		return ++this._uniqueID;
	},


	set cellMagnitue(value)
	{
		if(this._cellMagnitue === value) { return; }

		this._cellMagnitue = value;
		this._cellSizeX = 128 * value;
		this._cellSizeY = 128 * value;

		this.isNeedRender = true;
	},

	get cellMagnitue() { return this._cellMagnitue; },


	Flag: {
		UPDATE_HOVER: 128
	},


	//
	InputFlag: null,

	_x: 0, _y: 0, totalZ: 0,
	_depthNode: null,
	totalAngleRad: 0.0,
	totalAlpha: 1.0,
	totalScaleX: 1.0, totalScaleY: 1.0,
	volume: null,
	pivotX: 0, pivotY: 0,

	_flags: 0,

	cells: null,
	_cellSizeX: 128, _cellSizeY: 128,
	_cellMagnitue: 1,
	startCellX: 0, startCellY: 0,
	endCellX: 0, endCellY: 0,
	prevStartCellX: 0, prevStartCellY: 0,
	prevEndCellX: 0, prevEndCellY: 0,
	_numCellX: 0, _numCellY: 0,

	entities: null,
	numEntities: 0,

	updateFlag: 0,

	entitiesToCheck: null,
	entitiesToRemove: null,
	entitiesToUpdate: null,
	entitiesRemoveUpdate: null,
	detachBuffer: null,
	dynamicEntities: null,

	numEntitiesToCheck: 0,
	numEntitiesToUpdate: 0,
	numEntitiesRemoveUpdate: 0,
	numShowBounds: 0,
	numDetachItems: 0,

	isLoaded: true,

	_parent: null,
	childOffsetX: 0, childOffsetY: 0,

	hoverEntity: null,
	pressedEntity: null,

	isNeedRender: true,
	needDepthSort: false,
	enablePicking: true,
	showBounds: false,
	showCells: false,

	_uniqueID: 0,
	_centerTex: null,

	// Input channels:
	_chnOnDown: null,
	_chnOnUp: null,
	_chnOnClick: null,
	_chnOnDbClick: null,
	_chnOnDrag: null,
	_chnOnDragStart: null,
	_chnOnDragEnd: null,
	_chnOnHover: null,
	_chnOnHoverEnter: null,
	_chnOnHoverExit: null
});