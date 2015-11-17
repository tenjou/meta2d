"use strict";

/**
 * View of the meta.
 * @param name Name of the view.
 * @property name {String} Name of the view.
 * @property entities {Array} Entities that has been added to the view.
 * @property views {Array} Views attached.
 * @property parentView {meta.View} Pointer to parent view. Null if it not have parents.
 * @property x {Number} <b>Setter/Getter.</b> World position on x axis.
 * @property y {Number} <b>Setter/Getter.</b> World position on y axis.
 * @property z {Number} <b>Setter/Getter.</b> Depth index.
 * @property tween {meta.Tween} View tween.
 * @property numEntities {Number} Number of entities added to the view.
 */
meta.View = function(name)
{
	this.name = name;
	this.entities = [];
	this.children = null;
	this.parent = null;
	this.flags = 0;
};

meta.View.prototype =
{
	/** Destroy the view and all entities attached to it. */
	remove: function()
	{
		if(this.name === "master") {
			console.warn("(meta.View.remove) Master view can't be removed");
			return;
		}

		if(this.parent) {
			this.parent.detachView(this);
		}

		var num = this.entities.length;
		for(var n = 0; n < num; n++) {
			this.entities[n].remove()
		}

		this.entities.length = 0;

		if(this.children)
		{
			num = this.children.length;
			for(n = 0; n < num; n++) {
				this.children[n].remove();
			}
		}
	},

	/**
	 * Add entity to the view. If view is visible function will call plugin.onViewAdd() for every entity that has been added.
	 * @param entity {Entity.Geometry} Entity to add to the view.
	 */
	attach: function(entity)
	{
		if(!(entity instanceof Entity.Geometry)) {
			console.warn("(meta.View.attach) Trying to add invalid entity");
			return;
		}

		if(entity.flags & this.Flag.REMOVED) {
			console.warn("(meta.View.attach) Trying to add entity that has been marked as removed");
			return;
		}

		if(entity._view)
		{
			if(entity._view === this) {
				console.warn("(meta.View.attach) Entity is already added to this view");
			}
			else {
				console.warn("(meta.View.attach) Entity is already added to some other view");
			}
			return;
		}

		entity.flags |= entity.Flag.ROOT;
		entity._view = this;

		if(this._x !== 0 || this._y !== 0) {
			entity.updatePos();
		}
		if(this._z !== 0) {
			entity.updateZ();
		}
		if(this.flags & this.Flag.STATIC) {
			entity.static = true;
		}

		this.entities.push(entity);

		this._attachChildren(entity.children);

		if((this.flags & this.Flag.ACTIVE) && !(this.flags & this.Flag.INSTANCE_HIDDEN)) {
			meta.renderer.addEntity(entity, false);
		}
	},

	_attachChildren: function(children)
	{
		if(!children) { return; }

		var child;
		var numChildren = children.length;
		for(var i = 0; i < numChildren; i++)
		{
			child = children[i];
			if(child.removed) { continue; }

			child._view = this;

			this._attachChildren(child.children);
		}
	},

	/**
	 * Remove entity from the view.
	 * @param entity {Entity.Geometry} Entity to remove.
	 */
	detach: function(entity)
	{
		if(entity.flags & this.Flag.REMOVED) {
			return;
		}

		if(!entity._view) {
			console.warn("(meta.View.detach) Entity does not have view.");
			return;
		}

		if(entity._view !== this) {
			console.warn("(meta.View.detach) Entity is part of other view: " + entity._view.name);
			return;
		}

		if(!(entity.parent.flags & entity.Flag.RENDER_HOLDER)) {
			console.warn("(meta.View.detach) Entity is part of other view: " + entity._view.name);
			return;
		}

		entity &= ~entity.Flag.ROOT;
		entity._view = null;

		var num = this.entities.length;
		for(var n = 0; n < num; n++)
		{
			if(this.entities[n] === entity) {
				this.entities[n] = this.entities[num - 1];
				this.entities.pop();
				break;
			}
		}

		if((this.flags & this.Flag.ACTIVE) && !(this.flags & this.Flag.INSTANCE_HIDDEN)) {
			meta.renderer.removeEntity(entity);
		}
	},

	/**
	 * Attach view to this view
	 * @param view {meta.View} View to attach.
	 */
	attachView: function(view)
	{
		if(!view) 
		{
			if(this.parent) {
				console.warn("(meta.View.attach) No view was passed.");
				return;
			}

			meta.cache.view.attachView(this);
			return;
		}

		if(typeof(view) === "string")
		{
			var srcView = meta.cache.views[view];
			if(!srcView) {
				console.warn("(meta.View.attach) No such view found: " + view);
				return;
			}

			view = srcView;
		}
		else if(!(view instanceof meta.View)) {
			console.warn("(meta.View.attach) Trying to attach invalid view object.");
			return;
		}

		if(view.parent) {
			console.warn("(meta.View.attach) View is already part of other view.");
			return;
		}

		if(!this.children) {
			this.children = [ view ];
		}
		else {
			this.children.push(view);
		}	

		view.parent = this;

		if(this.flags & this.Flag.ACTIVE) {
			view._activate();
		}
	},

	/**
	 * Detach view from this view.
	 * @param view {meta.View} View to detach.
	 */
	detachView: function(view)
	{
		// If no view has been passed - threat it as detaching self.
		if(!view) 
		{
			if(!this.parent) {
				console.warn("(meta.View.detachView) No view was been passed.");
				return;
			}

			this.parent.detachView(this);
			return;
		}

		if(typeof(view) === "string")
		{
			var srcView = meta.cache.views[view];
			if(!srcView) {
				console.warn("(meta.View.detachView) No such view found: \"" + view + "\"");
				return;
			}

			view = srcView;
		}

		if(!view.parent) {
			console.warn("(meta.View.detachView) View has not parents to detach from");
			return;
		}

		if(this.children)
		{
			var numChildren = this.children.length;
			for(var i = 0; i < numChildren; i++)
			{
				if(this.children[i] === view) {
					this.children[i] = this.children[numChildren - 1];
					this.children.pop();
					break;
				}
			}	
		}	

		view.parent = null;

		if(this.flags & this.Flag.ACTIVE) {
			view._deactivate();
		}
	},

	detachViews: function()
	{
		var child;
		var numChildren = this.children.length;
		for(var n = 0; n < numChildren; n++) {
			child = this.children[n];
			child.detachView(child);
		}
	},

	_activate: function()
	{
		this.flags |= this.Flag.ACTIVE;

		if(this.flags & this.Flag.INSTANCE_HIDDEN) {
			return;
		}

		meta.renderer.addEntities(this.entities);

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

		if(this.flags & this.Flag.INSTANCE_HIDDEN) {
			return;
		}

		meta.renderer.removeEntities(this.entities);

		if(this.children) 
		{
			var num = this.children.length;
			for(var n = 0; n < num; n++) {
				this.children[n]._deactivate();
			}
		}
	},

	_updateHidden: function()
	{
		if(this.flags & this.Flag.INSTANCE_HIDDEN) 
		{ 
			if(this.flags & this.Flag.HIDDEN) { return; }
			if(this.parent.flags & this.Flag.INSTANCE_HIDDEN) { return; }

			this.flags &= ~this.Flag.INSTANCE_HIDDEN;

			if(this.flags & this.Flag.ACTIVE) {
				meta.renderer.removeEntities(this.entities);
			}
		}
		else
		{
			if((this.flags & this.Flag.HIDDEN) || (this.parent.flags & this.Flag.INSTANCE_HIDDEN)) 
			{ 
				this.flags |= this.Flag.INSTANCE_HIDDEN;

				if(this.flags & this.Flag.ACTIVE) {
					meta.renderer.addEntities(this.entities);
				}				
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
		if(value) {
			this.flags |= this.Flag.HIDDEN;
		}
		else {
			this.flags &= ~this.Flag.HIDDEN;
		}

		this._updateHidden();
	},

	get hidden() { 
		return ((this.flags & this.Flag.HIDDEN) === this.Flag.HIDDEN);
	},

	updateEntity: function(entity)
	{
		if((this.flags & this.Flag.ACTIVE) === 0) { return; }
		if((this.flags & this.Flag.INSTANCE_HIDDEN)) { return; }

		if(entity.flags & entity.Flag.INSTANCE_ENABLED) {
			meta.renderer.addEntity(entity);
		}
		else {
			meta.renderer.removeEntity(entity);
		}
	},

	set x(value)
	{
		if(this._x === value) { return; }
		this._x = value;

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].updatePos();
		}
	},

	set y(value)
	{
		if(this._y === value) { return; }
		this._y = value;

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].updatePos();
		}
	},

	set z(value)
	{
		this._z = value;

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].updateZ();
		}
	},

	get x() { return this._x; },
	get y() { return this._y; },
	get z() { return this._z; },

	get tween()
	{
		if(!this._tween) {
			this._tween = new meta.Tween(this);
		}

		return this._tween;
	},

	set static(value) 
	{
		if(value) 
		{
			if(this.flags & this.Flag.STATIC) { return; }

			this.flags |= this.Flag.STATIC;
			this._updateStatic(true);
		}
		else 
		{
			if((this.flags & this.Flag.STATIC) === 0) {
				return; 
			}

			this.flags &= ~this.Flag.STATIC;
			this._updateStatic(false);
		}
	},

	get static() { 
		return ((this.flags & this.Flag.STATIC) === this.Flag.STATIC); 
	},

	_updateStatic: function(value)
	{
		var entity;
		var numEntities = this.entities.length;
		for(var n = 0; n < numEntities; n++) 
		{
			entity = this.entities[n];
			entity.flags |= entity.Flag.STATIC;
			//this.entities[i].static = value;
		}
	},

	Flag: {
		HIDDEN: 1 << 0,
		INSTANCE_HIDDEN: 1 << 1,
		ACTIVE: 1 << 2,
		STATIC: 1 << 3
	},

	//
	_x: 0,
	_y: 0,
	_z: 0,
	_tween: null,

	debugger: false,
	entitiesUI: null
};

/**
 * Create a new view.
 * @param name {String} Name of the view.
 */
meta.createView = function(name)
{
	if(!name || typeof(name) !== "string") {
		console.error("(meta.createView) Invalid name of the view");
		return;
	}

	var view = meta.cache.views[name];
	if(view) {
		console.error("(meta.createView) View with a name - " + name + ", already exist");
		return;		
	}

	view = new meta.View(name);
	meta.cache.views[name] = view;

	return view;
};

/**
 * Set the view. Will create a new view if not found.
 * @param name {meta.View|String} Name of the view
 */
meta.setView = function(view)
{
	if(!view) {
		console.error("(meta.setView) No view passed");
		return;
	}

	var cache = meta.cache;

	if(typeof(view) === "string") 
	{
		var name = view;
		view = cache.views[name];
		if(!view) {
			console.warn("(meta.setView) Creating an empty view, could be unintended - " + name);
			view = new meta.View(name);
			cache.views[name] = view;
		}
	}

	var masterView = cache.view;

	if(view === masterView) {
		console.warn("(meta.setView) Cannot modify master view");
		return;
	}

	if(view.parentView) {
		console.warn("(meta.setView) View is already attached to master or other view");
		return;
	}

	cache.view.detachViews();
	cache.view.attachView(view);
};

/**
 * Get the view. Will create a new view if not found.
 * @param name {String} Name of the view
 * @returns {meta.View}
 */
meta.getView = function(name)
{
	if(!name) {
		console.error("(meta.getView) No name specified");
		return null;
	}

	var view = meta.cache.views[name];
	if(!view) {
		view = new meta.View(name);
		meta.cache.views[name] = view;
	}

	return view;
};

/**
 * Attach view to the current active view.
 * @param view {meta.View|String} View object or name of the view.
 */
meta.attachView = function(view)
{
	var cache = meta.cache;

	if(typeof(view) === "string")
	{
		var srcView = cache.views[view];
		if(!srcView) {
			console.warn("(meta.attachView) No such view found: " + view);
			return;
		}

		view = srcView;
	}

	if(view.parentView) {
		console.warn("(meta.attachView) View already has parent attached");
		return;
	}

	cache.view.attachView(view);
};

/**
 * Detach view from the current active view.
 * @param view {meta.View|String} View object or name of the view.
 */
meta.detachView = function(view)
{
	var cache = meta.cache;

	if(typeof(view) === "string")
	{
		var srcView = cache.views[view];
		if(!view) {
			console.warn("(meta.detachView) No such view found: " + view);
			return;
		}

		view = srcView;
	}

	if(!view.parentView) {
		console.warn("(meta.detachView) View does not have parent attached");
		return;
	}

	cache.view.detachView(view);
};

Object.defineProperty(meta, "view", 
{
	set: function(view) {
		meta.setView(view);
	},

    get: function() {
		return meta.cache.view;
	}    
});
