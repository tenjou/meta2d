"use strict";

/**
 * View of the meta.
 * @param name Name of the view.
 * @property name {String} Name of the view.
 * @property entities {Array} Entities that has been added to the view.
 * @property views {Array} Views attached.
 * @property controllers {Array} Array with a controllers names that is added to the view.
 * @property parentView {meta.View} Pointer to parent view. Null if it not have parents.
 * @property x {Number} <b>Setter/Getter.</b> World position on x axis.
 * @property y {Number} <b>Setter/Getter.</b> World position on y axis.
 * @property z {Number} <b>Setter/Getter.</b> Depth index.
 * @property tween {meta.Tween} View tween.
 * @property numEntities {Number} Number of entities added to the view.
 * @memberof! <global>
 */
meta.View = function(name)
{
	this.name = name;
	this.entities = [];
	this.views = null;
	this.parentView = null;

	this.numEntities = 0;

	this._x = 0;
	this._y = 0;
	this._z = 0;
	this._tween = null;

	this._isActive = false;
};

meta.View.prototype =
{
	/**
	 * Destroy view and all entities added, textures created (and is not added to resource controller).
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

		this.isActive = false;
		this._unregisterFromEngine();

		var entity;
		var numEntities = this.entities.length;
		for(var n = 0; n < numEntities; n++) {
			entity = this.entities[n];
			entity._view = null;
			entity.remove();
		}

		this.entities.length = 0;
		this.numEntities = 0;
	},

	/**
	 * Add entity to the view. If view is visible function will call plugin.onViewAdd() for every entity that has been added.
	 * @param entity {Entity.Geometry} Entity to add to the view.
	 */
	attach: function(entity)
	{
		// if(!(entity instanceof Entity.Geometry)) {
		// 	console.warn("(meta.View.attach) Object should have inherited Entity.Geometry class.");
		// 	return;
		// }

		if(entity.isRemoved) {
			console.warn("(meta.View.attach) Removed entity can not be added to the view.");
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

		if(this._x !== 0 || this._y !== 0) {
			entity.updatePos();
		}
		
		this.entities.push(entity);
		this.numEntities++;

		this._attachChildren(entity.children);

		entity._view = this;
		entity._viewNodeID = this.numEntities;
		if(this._z) {
			entity.z = entity._z;
		}

		if(!entity.texture) {
			entity.isLoaded = true;
		}	

		if(this._isActive && meta.engine.isReady) {
			meta.renderer.addEntity(entity);
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
			if(child.isRemoved) { continue; }
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

		if(this._isActive) {
			Renderer.ctrl.removeEntities(entity);
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

		if(view._isActive) {
			console.warn("(meta.View.attach) Can't attach an active view.");
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

		if(this._isActive) {
			view.isActive = true;
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

		view.isActive = false;
		view.parentView = null;		
	},

	detachViews: function()
	{
		if(!this.views) { return; }

		var view;
		var numChildren = this.views.length;
		var numViews = this.views.length;
		for(var i = 0; i < numViews; i++) {
			view = this.views[i];
			view.isActive = false;
			view.parentView = null;
		}

		this.views.length = 0;
	},

	/**
	 * Register controller to the view.
	 * @param ctrlName {String} Controller name to register.
	 */
	register: function(ctrlName)
	{
		var ctrl = meta.createCtrl(ctrlName, this);

		if(!this.controllers) {
			this.controllers = [ ctrl ];
		}
		else {
			this.controllers.push(ctrl);
		}

		if(!this._isActive) { return; }
		if(this.parentView && !this.parentView._isActive) { return; }

		meta.addCtrl(ctrl);
	},

	/**
	 * Unregister controller to the view.
	 * @param ctrlName {String} Controller name to unregister.
	 */
	unregister: function(ctrlName)
	{
		var numControllers = this.controllers.length;
		for(var i = 0; i < numControllers; i++)
		{
			if(this.controllers[i].name === ctrlName)
			{
				if(this._isActive) {
					meta.unregister(ctrlName);
				}

				this.controllers[i] = this.controllers[numControllers - 1];
				this.controllers.pop();
			}
		}
	},

	_unregisterFromEngine: function()
	{
		if(this.controllers)
		{
			var numControllers = this.controllers.length;
			for(var n = 0; n < numControllers; n++) {
				meta.unregister(this.controllers[n]);
			}
		}
	},

	_makeActive: function()
	{
		var n;

		// Add controllers to the engine.
		if(this.controllers) 
		{
			var numControllers = this.controllers.length;
			for(n = 0; n < numControllers; n++) {
				meta.addCtrl(this.controllers[n]);
			}			
		}

		meta.renderer.addEntities(this.entities);

		if(this.views)
		{
			var numViews = this.views.length;
			for(n = 0; n < numViews; n++) {
				this.views[n].isActive = true;
			}
		}		
	},

	_makeInactive: function()
	{
		var n;

		// Remove controllers from the engine.
		if(this.controllers)
		{
			var numControllers = this.controllers.length;
			for(n = 0; n < numControllers; n++) {
				meta.removeCtrl(this.controllers[n]);
			}
		}

		Renderer.ctrl.removeEntities(this.entities);

		if(this.views)
		{
			var numViews = this.views.length;
			for(n = 0; n < numViews; n++) {
				this.views[n].isActive = false;
			}
		}
	},


	set isActive(value)
	{
		if(this._isActive === value) { return; }
		
		if(value) {
			this._makeActive();
		}
		else {
			this._makeInactive();
		}

		this._isActive = value;
	},

	get isActive() { return this._isActive; },


	set x(value)
	{
		if(this._x === value) { return; }
		this._x = value;

		var entity;
		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			entity = this.entities[i];
			entity.forcePosition(entity._x, entity._y);
		}
	},

	set y(value)
	{
		if(this._y === value) { return; }
		this._y = value;

		var entity;
		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			entity = this.entities[i];
			entity.forcePosition(entity._x, entity._y);
		}
	},

	set z(value)
	{
		this._z = value;

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.entities[i].z = this.entities[i]._z;
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


	//
	controllers: null
};

/**
 * Create a new view. Additionally controllers can be passed for registration.
 * @param name {String} Name of the view.
 * @param ctrls {String|Array} Name of the controller or array with controllers to register.
 */
meta.createView = function(name, ctrls)
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

	if(!ctrls) { return; }

	if(ctrls instanceof Array) 
	{
		var numCtrls = ctrls.length;
		for(var i = 0; i < numCtrls; i++) {
			view.register(ctrls[i]);
		}
	}
	else {
		view.register(ctrls);
	}
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
			console.warn("(meta.setView) Creating empty view, could be unintended - " + name);
			view = new meta.View(name);
			cache.views[name] = view;
		}
	}

	if(view.isActive) { 
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
	if(!meta.cache.view) {
		console.warn("(meta.attachView) No current active view");
		return;
	}

	if(typeof(view) === "string")
	{
		var srcView = meta.cache.views[view];
		if(!srcView) {
			console.warn("(meta.attachView) No such view found: " + view);
			return;
		}

		view = srcView;
	}

	meta.cache.view.attachView(view);
};

/**
 * Detach view from the current active view.
 * @param view {meta.View|String} View object or name of the view.
 */
meta.detachView = function(view)
{
	if(!meta.cache.view) {
		console.warn("(meta.detachView) No current active view.");
		return;
	}

	if(typeof(view) === "string")
	{
		var srcView = meta.cache.views[view];
		if(!view) {
			console.warn("(meta.detachView) No such view found: " + view);
			return;
		}

		view = srcView;
	}

	meta.cache.view.detachView(view);
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
