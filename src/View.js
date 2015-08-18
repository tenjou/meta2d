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
	this.views = null;
	this.parentView = null;

	this._x = 0;
	this._y = 0;
	this._z = 0;
	this._tween = null;
	this.flags |= (this.Flag.CHILD_VISIBLE);
};

meta.View.prototype =
{
	/**
	 * Destroy view and all entities added.
	 */
	remove: function()
	{
		if(this.name === "master") {
			console.warn("(meta.View.remove) Master view can't be removed");
			return;
		}

		if(this.parentView) {
			this.parentView.detachView(this);
		}

		if(this.views)
		{
			var numViews = this.views.length;
			for(var i = 0; i < numViews; i++) {
				this.views[i].remove();
			}
		}

		this.visible = false;
		this._unregisterFromEngine();

		var entity;
		var numEntities = this.entities.length;
		for(var n = 0; n < numEntities; n++) {
			entity = this.entities[n];
			entity._view = null;
			entity.remove();
		}

		this.entities.length = 0;
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

		if(entity.removed) {
			console.warn("(meta.View.add) Removed entity can not be added to the view.");
			return;
		}

		if(entity._view)
		{
			if(entity._view === this) {
				console.warn("(meta.View.attach) Entity is already added to this view.");
			}
			else {
				console.warn("(meta.View.attach) Entity is already added to some other view.");
			}
			return;
		}

		entity._view = this;
		entity._viewNodeID = this.entities.length;

		if(this._x !== 0 || this._y !== 0) {
			entity.updatePos();
		}
		if(this._z !== 0) {
			entity.updateZ();
		}
		if(this._static) {
			entity.static = true;
		}

		this._attachChildren(entity.children);

		this.entities.push(entity);

		if(this.flags & this.Flag.VISIBLE) {
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
		if(entity.isRemoved) { return; }

		if(!entity._view) {
			console.warn("(meta.View.detach) Entity does not have view.");
			return;
		}

		if(entity._view !== this) {
			console.warn("(meta.View.detach) Entity is part of other view: " + entity.view.name);
			return;
		}

		if(entity._parent !== entity._entityCtrl) {
			console.warn("(meta.View.detach) Entity children are not part of view.");
			return;
		}

		entity.isRemoved = true;
		entity.removeCore();

		this.numEntities--;
		var replaceEntity = this.entities[this.numEntities];
		replaceEntity.core.viewIndex = this.numEntities;
		this.entities[this.numEntities] = replaceEntity;
		this.entities.pop();

		if(this.flags & this.Flag.VISIBLE) {
			meta.renderer.removeEntities(entity);
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
			if(this.parentView) {
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

		if(view.parentView) {
			console.warn("(meta.View.attach) View is already part of other view.");
			return;
		}

		if(!this.views) {
			this.views = [];
		}		

		this.views.push(view);
		view.parentView = this;

		if(this.flags & this.Flag.VISIBLE) {
			view._parentVisible(true);
		}
	},

	/**
	 * Detach view from this view.
	 * @param view {meta.View} View to detach.
	 */
	detachView: function(view)
	{
		if(!view) 
		{
			if(!this.parentView) {
				console.warn("(meta.View.detachView) No view was passed.");
				return;
			}

			this.parentView.detachView(this);
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

		if(!view.parentView) {
			console.warn("(meta.View.detachView) View has not parents to detach from");
			return;
		}

		if(view.parentView !== this) {
			console.warn("(meta.View.detachView) Detaching from wrong parent");
			return;
		}

		var numViews = this.views.length;
		for(var i = 0; i < numViews; i++)
		{
			if(this.views[i] === view) {
				this.views[i] = this.views[numViews - 1];
				this.views.pop();
				break;
			}
		}

		view.parentView = null;	

		if(this.flags & this.Flag.CHILD_VISIBLE) {
			view._parentVisible(false);
		}
	},

	detachViews: function()
	{
		if(!this.views) { return; }

		var view;
		var numChildren = this.views.length;
		var numViews = this.views.length;
		for(var i = 0; i < numViews; i++) 
		{
			view = this.views[i];
			view.parentView = null;

			if(view.flags & this.Flag.CHILD_VISIBLE) {
				view._parentVisible(false);
			}
		}

		this.views.length = 0;
	},

	_visible: function(value)
	{
		if(value)
		{
			this.flags |= this.Flag.CHILD_VISIBLE;

			if(this.flags & this.Flag.PARENT_VISIBLE)
			{
				this.flags |= this.Flag.VISIBLE;

				if(this.entities.length) {
					console.log("add", this.name)
					meta.renderer.addEntities(this.entities);
				}
			}
		}
		else
		{
			this.flags &= ~this.Flag.CHILD_VISIBLE;

			if(this.flags & this.Flag.VISIBLE)
			{
				this.flags &= ~this.Flag.VISIBLE;

				if(this.entities.length) {
					console.log("remove", this.name)
					meta.renderer.removeEntities(this.entities);
				}
			}
		}

		if(this.views)
		{
			var numViews = this.views.length;
			for(var n = 0; n < numViews; n++) {
				this.views[n]._parentVisible(value); 
			}
		}	
	},

	_parentVisible: function(value)
	{
		if(value)
		{
			this.flags |= this.Flag.PARENT_VISIBLE;

			if(this.flags & this.Flag.CHILD_VISIBLE) {
				this._visible(true);
			}
		}
		else
		{
			this.flags &= ~this.Flag.PARENT_VISIBLE;

			if(this.flags & this.Flag.CHILD_VISIBLE) {
				this._visible(false);
			}
		}
	},

	set visible(value)
	{
		if(value)
		{
			if(this.flags & this.Flag.CHILD_VISIBLE) {
				return;
			}

			this._visible(true);
		}
		else
		{
			if(this.flags & this.Flag.CHILD_VISIBLE) {
				this._visible(false);
			}
		}
	},

	get visible() { 
		return ((this.flags & this.Flag.CHILD_VISIBLE) === this.Flag.CHILD_VISIBLE);
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
		if(this.flags & this.Flag.STATIC) 
		{ 
			if(value) {
				return;
			}

			this.flags |= this.Flag.STATIC;
		}
		else
		{
			if(!value) {
				return;
			}

			this.flags &= ~this.Flag.STATIC;
		}

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].static = value;
		}
	},

	get static() { 
		return ((this.flags & this.Flag.STATIC) === this.Flag.STATIC); 
	},

	Flag: {
		VISIBLE: 1,
		CHILD_VISIBLE: 2,
		PARENT_VISIBLE: 4,
		STATIC: 8
	},


	//
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
	meta.view.attachView(view);
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

	if(view.flags & view.Flag.CHILD_VISIBLE) { 
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
