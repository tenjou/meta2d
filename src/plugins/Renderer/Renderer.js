"use strict";

meta.Renderer = meta.Class.extend
({
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
			this.needSortDepth = false;
			this.needRender = true;
		}		
	},

	_sortEntities: function(a, b) {
		return a.z - b.z;
	},	

	addEntity: function(entity)
	{
		this.entities.push(entity);

		if(entity.update) {
			this.addEntityToUpdate(entity);
		}
		if(entity._z !== 0) {
			this.needSortDepth;
		}
		if(entity.__debug) {
			this.numDebug++;
		}

		this.needRender = true;
	},

	addEntities: function(entities)
	{
		var numEntities = entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.addEntity(entities[i]);
		}
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

	//
	meta: meta,

	entities: [],
	entitiesToUpdate: [],
	removeUpdating: [],

	needRender: true,
	needSortDepth: false,

	numDebug: 0,

	_bgColor: "#ddd",
	_transparent: false,	

	__uniqueID: 0,
	__updating: false
});
