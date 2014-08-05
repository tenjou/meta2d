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
		Entity.Geometry.prototype._entityCtrl = this;
		Entity.Geometry.prototype.parent = this;

		this.entities = new Entity.DepthList();
		this.entitiesToAdd = [];
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
		this._chnOnDown = scope.createChannel(Entity.Event.DOWN);
		this._chnOnUp = scope.createChannel(Entity.Event.UP);
		this._chnOnClick = scope.createChannel(Entity.Event.CLICK);
		this._chnOnDrag = scope.createChannel(Entity.Event.DRAG);
		this._chnOnDragStart = scope.createChannel(Entity.Event.DRAG_START);
		this._chnOnDragEnd = scope.createChannel(Entity.Event.DRAG_END);
		this._chnOnHover = scope.createChannel(Entity.Event.HOVER);
		this._chnOnHoverEnter = scope.createChannel(Entity.Event.HOVER_ENTER);
		this._chnOnHoverExit = scope.createChannel(Entity.Event.HOVER_EXIT);

		scope.subscribe(this, scope.Event.RESIZE, this.onResize);
		scope.subscribe(this, scope.Event.CAMERA_MOVE, this.onMove);
		scope.subscribe(this, scope.Event.ADAPT, this.onAdapt);
		scope.subscribe(this, scope.Event.ADDED_TO_VIEW, this.onAddToView);
		scope.subscribe(this, scope.Event.REMOVED_FROM_VIEW, this.onRemoveFromView);

		this.volume = scope.camera.volume;
		this.onMove(scope.camera, null);
	},

	release: function()
	{
		Entity.Geometry.prototype._entityCtrl = null;
		this.cells = null;
		this.entities = null;
		this.entitiesToAdd = null;
		this.entitiesToUpdate = null;
		this.entitiesToRemove = null;
		this.entitiesRemoveUpdate = null;
		this.detachBuffer = null;
		this.dynamicEntities = null;

		this._chnOnDown.remove();
		this._chnOnUp.remove();
		this._chnOnClick.remove();
		this._chnOnDrag.remove();
		this._chnOnDragStart.remove();
		this._chnOnDragEnd.remove();
		this._chnOnHover.remove();
		this._chnOnHoverEnter.remove();
		this._chnOnHoverExit.remove();

		meta.unsubscribe(this, meta.Event.RESIZE);
		meta.unsubscribe(this, meta.Event.CAMERA_MOVE);
		meta.unsubscribe(this, meta.Event.ADDED_TO_VIEW, this.onAddToView);
		meta.unsubscribe(this, meta.Event.REMOVED_FROM_VIEW, this.onRemoveFromView);
		meta.unsubscribe(this, [ Input.Event.INPUT_DOWN, Input.Event.INPUT_UP ], this.onInput)
		meta.unsubscribe(this, Input.Event.INPUT_MOVE);
	},


	load: function()
	{
		this.cells = {};

		var volume = meta.camera.volume;
		this.startCellX = Math.floor(volume.minX / this._cellSizeX);
		this.startCellY = Math.floor(volume.minY / this._cellSizeY);
		this.endCellX = Math.floor(volume.maxX / this._cellSizeX);
		this.endCellY = Math.floor(volume.maxY / this._cellSizeY);

		if(this.entities.length > 0)
		{
			// Remove parent from previous entities.
			var dummyParent = Entity.Geometry.prototype._dummyParent;
			var currNode = this.entities.first.next;
			var lastNode = this.entities.last;
			for(; currNode !== lastNode; currNode = currNode.next) {
				currNode.entity._parent = dummyParent;
			}

			this.entities.clear();
		}

		this.dynamicEntities = new Array(64);

		// Fill new entities.
		var entity;
		var entities = meta.view.entities;
		var numEntities = entities.length;

		for(var i = 0; i < numEntities; i++)
		{
			entity = entities[i];
			if(entity._showBounds) {
				this.numShowBounds++;
			}

			if(entity._parent === dummyParent) {
				entity._parent = this;
			}
		}

		meta.subscribe(this, [ Input.Event.INPUT_DOWN, Input.Event.INPUT_UP ], this.onInput);
		meta.subscribe(this, Input.Event.INPUT_MOVE, this.onInputMove);
	},

	unload: function()
	{
		var entity;
		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++)
		{
			entity = this.entities[i];
			if(entity._parent === this) {
				entity._parent = null;
			}
		}

		this.numShowBounds = 0;
		this.numEntitiesToUpdate = 0;
	},


	update: function(tDelta)
	{
		this._isUpdateTick = true;

		var i, n, entity;
		var children, numChildren;

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

		if(this.numEntitiesToRemove)
		{
			for(i = 0; i < this.numEntitiesToRemove; i++) {
				entity = this.entitiesToRemove[i];
				this.entities.remove(entity._depthNode);
				entity.removeFully();
			}

			this.entitiesToRemove.length = 0;
			this.numEntitiesToRemove = 0;
			this.isNeedRender = true;
		}

		if(this.numEntitiesToAdd)
		{
			for(i = 0; i < this.numEntitiesToAdd; i++) {
				this._addEntity(this.entitiesToAdd[i]);
			}

			this.entitiesToAdd.length = 0;
			this.numEntitiesToAdd = 0;
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

		this._isUpdateTick = false;
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
	 * @param event {*} Event type.
	 */
	onAddToView: function(entities, event)
	{
		var i, numEntities;

		if(!this._isUpdateTick)
		{
			if(entities instanceof Entity.Geometry) {
				this._addEntity(entities);
			}
			else
			{
				numEntities = entities.length;
				for(i = 0; i < numEntities; i++) {
					this._addEntity(entities[i]);
				}
			}
		}
		else
		{
			if(entities instanceof Entity.Geometry) {
				this.entitiesToAdd.push(entities);
				this.numEntitiesToAdd++;
			}
			else
			{
				var numToAdd = entities.length;
				for(i = 0; i < numToAdd; i++) {
					this.entitiesToAdd.push(entities[i]);
				}
				this.numEntitiesToAdd += numToAdd;
			}
		}
	},

	/**
	 * Callback function which handles entities that are removed from the view.
	 * @param entities {Entity.Geometry} Entity or array with entities removed from the view.
	 * @param event {*} Event type.
	 */
	onRemoveFromView: function(entities, event)
	{
		if(entities instanceof Entity.Geometry) {
			this._removeEntity(entities);
		}
		else
		{
			var numEntities = entities.length;
			for(var i = 0; i < numEntities; i++) {
				this._removeEntity(entities[i]);
			}
		}
	},

	_addEntity: function(entity)
	{
		if(entity.isRemoved) { return; }
		if(entity._depthNode.entity) { return; }

		entity.cellX = Math.floor(entity._x / this._cellSizeX);
		entity.cellY = Math.floor(entity._y / this._cellSizeY);
		entity._cellIndex = entity.cellX | (entity.cellY << 16);

		var cell = this.cells[entity._cellIndex]; 
		if(!cell) {
			cell = new Entity.CellArray();
			this.cells[entity._cellIndex] = cell;
		}
		cell.push(entity);

		//
		entity._depthNode.entity = entity;
		this.entities.push(entity._depthNode);

		if(!entity.texture) {
			entity.isLoaded = true;
		}

		if(entity.children)
		{
			var numChildren = entity.children.length;
			for(var i = 0; i < numChildren; i++) {
				this._addEntity(entity.children[i]);
			}
		}

		if(entity.update) {
			entity.isUpdating = true;
		}

		if(entity.isNeedState) {
			entity.updateState();
		}
		if(entity._isLoaded && entity._texture) {
			this.cacheEntity(entity);
		}
	},

	_removeEntity: function(entity)
	{
		if(!entity._depthNode.entity) { return; }

		this.entitiesToRemove.push(entity);
		this.numEntitiesToRemove++;

		if(entity.children)
		{
			var numChildren = entity.children.length;
			for(var i = 0; i < numChildren; i++) {
				this._removeEntity(entity.children[i]);
			}
		}
	},


	_addToUpdating: function(entity)
	{
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


	getFromVolume: function(volume)
	{
		var entity;
		var currNode = this.entities.first.next;
		var lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;
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
		var currNode = this.entities.first.next;
		var lastNode = this.entities.last;
		for(; currNode !== lastNode; currNode = currNode.next)
		{
			entity = currNode.entity;
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
		var volume = meta.camera.volume;
		this.prevStartCellX = this.startCellX;
		this.prevStartCellY = this.startCellY;
		this.prevEndCellX = this.endCellX;
		this.prevEndCellY = this.endCellY;
		this.startCellX = Math.floor(volume.minX / this._cellSizeX);
		this.startCellY = Math.floor(volume.minY / this._cellSizeY);
		this.endCellX = Math.floor(volume.maxX / this._cellSizeX);
		this.endCellY = Math.floor(volume.maxY / this._cellSizeY);

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
		var entities = this.entities.buffer;
		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			entities[i].adapt();
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
			if(!this.hoverEntity || !this.hoverEntity.isClickable) { return; }

			data.entity = this.hoverEntity;
			this.pressedEntity = this.hoverEntity;
			this.pressedEntity.isPressed = true;
			this.pressedEntity._onDown.call(this.pressedEntity, data);
			this.pressedEntity.onDown.call(this.pressedEntity, data);
			this._chnOnDown.emit(data, Entity.Event.DOWN);
		}
		else if(inputEvent.INPUT_UP === event)
		{
			data.entity = this.pressedEntity;

			if(this.pressedEntity && this.pressedEntity.isClickable) 
			{
				// Drag end?
				if(this.pressedEntity.isDragged) {
					this.pressedEntity.isDragged = false;
					this.pressedEntity._onDragEnd.call(this.pressedEntity, data);
					this.pressedEntity.onDragEnd.call(this.pressedEntity, data);
					this._chnOnDragEnd.emit(data, Entity.Event.DRAG_END);					
				}

				// Input Up.
				this.pressedEntity.isPressed = false;
				this.pressedEntity._onUp.call(this.pressedEntity, event);
				this.pressedEntity.onUp.call(this.pressedEntity, event);
				this._chnOnUp.emit(this.pressedEntity, Entity.Event.UP);	

				// Click.
				if(this.pressedEntity === this.hoverEntity) {
					this.pressedEntity._onClick.call(this.pressedEntity, data);
					this.pressedEntity.onClick.call(this.pressedEntity, data);
					this._chnOnClick.emit(data, Entity.Event.CLICK);
				}	

				this.pressedEntity = null;				
			}
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
			var currNode = this.entities.last.prev;
			var lastNode = this.entities.first;
			for(; currNode !== lastNode; currNode = currNode.prev)
			{
				entity = currNode.entity;
				if(!entity.isPickable) { continue; }

				if(entity.isInside(data.x, data.y))
				{
					if(this.hoverEntity !== entity)
					{
						if(this.hoverEntity)
						{
							data.entity = this.hoverEntity;
							this.hoverEntity.isHover = false;
							this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
							this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
							this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
						}

						data.entity = entity;
						entity.isHover = true;
						entity._onHoverEnter.call(entity, data);
						entity.onHoverEnter.call(entity, data);
						this._chnOnHoverEnter.emit(data, Entity.Event.HOVER_ENTER);

						this.hoverEntity = entity;
					}
					else
					{
						data.entity = entity;
						entity._onHover.call(entity, data);
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
			this.hoverEntity.isHover = false;
			this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
			this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
			this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
		}

		this.hoverEntity = null;
	},

	_checkDrag: function(data)
	{
		if(this.pressedEntity && this.pressedEntity.isClickable)
		{
			data.entity = this.pressedEntity;

			if(!this.pressedEntity.isDragged) {
				this.pressedEntity.isDragged = true;
				this.pressedEntity._onDragStart.call(this.pressedEntity, data);
				this.pressedEntity.onDragStart.call(this.pressedEntity, data);
				this._chnOnDragStart.emit(data, Entity.Event.DRAG_START);
				return false;			
			}

			this.pressedEntity._onDrag.call(this.pressedEntity, data);
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

		if(!this._checkDrag(data)) { return; }
		this._checkHover(data);
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


	//
	_x: 0, _y: 0, _z: 0,
	_alpha: 1.0,
	volume: null,

	cells: null,
	_cellSizeX: 128, _cellSizeY: 128,
	_cellMagnitue: 1,
	startCellX: 0, startCellY: 0,
	endCellX: 0, endCellY: 0,
	prevStartCellX: 0, prevStartCellY: 0,
	prevEndCellX: 0, prevEndCellY: 0,
	_numCellX: 0, _numCellY: 0,

	entities: null,
	entitiesToCheck: null,
	entitiesToAdd: null,
	entitiesToRemove: null,
	entitiesToUpdate: null,
	entitiesRemoveUpdate: null,
	detachBuffer: null,
	dynamicEntities: null,

	numEntitiesToCheck: 0,
	numEntitiesToAdd: 0,
	numEntitiesToRemove: 0,
	numEntitiesToUpdate: 0,
	numEntitiesRemoveUpdate: 0,
	numShowBounds: 0,
	numDetachItems: 0,

	_parent: null,
	childOffsetX: 0, childOffsetY: 0,

	hoverEntity: null,
	pressedEntity: null,

	isNeedRender: true,
	_isUpdateTick: false,
	enablePicking: true,
	showBounds: false,
	showCells: false,

	_uniqueID: 0,
	_centerTex: null,

	// Input channels:
	_chnOnDown: null,
	_chnOnUp: null,
	_chnOnClick: null,
	_chnOnDrag: null,
	_chnOnDragStart: null,
	_chnOnDragEnd: null,
	_chnOnHover: null,
	_chnOnHoverEnter: null,
	_chnOnHoverExit: null
});