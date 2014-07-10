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
 * @property bgColor {String} Background color in Hex.
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
	this.bgColor = this._bgColor;

	this._isActive = false;
};

meta.View.prototype =
{
	/**
	 * Destroy view and all entities added, textures created (and is not added to resource controller).
	 */
	release: function()
	{
		if(this.parentView) {
			this.parentView.detach(this);
		}

		if(this.views)
		{
			var numViews = this.views.length;
			for(var i = 0; i < numViews; i++) {
				this.views[i].release();
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
	add: function(entity)
	{
		if(!(entity instanceof Entity.Geometry)) {
			console.warn("[meta.View.add]:", "Object should have inherited Entity.Geometry class.");
			return;
		}

		if(entity.isRemoved) {
			console.warn("[meta.View.add]:", "Removed entity can not be added to the view.");
			return;
		}

		if(entity._view)
		{
			if(entity._view === this) {
				console.warn("[meta.View.add]:", "Entity is already added to this view.");
			}
			else {
				console.warn("[meta.View.add]:", "Entity is already added to some other view.");
			}
			return;
		}

		entity.updatePos();
		this.entities.push(entity);
		this.numEntities++;

		this._attachren(entity.children);

		entity._view = this;
		entity._viewNodeID = this.numEntities;
		if(this._z) {
			entity.z = entity._z;
		}

		if(!entity.texture) {
			entity.isLoaded = true;
		}
		if(entity._onResize) {
			entity._onResize(meta.engine, null);
		}		

		//
		if(this._isActive && !entity._depthNode.entity && Entity.ctrl.isLoaded) {
			this._chnAddedToView.emit(entity, meta.Event.ADDED_TO_VIEW);
		}
	},

	_attachren: function(children)
	{
		if(!children) { return; }

		var child;
		var numChildren = children.length;
		for(var i = 0; i < numChildren; i++)
		{
			child = children[i];
			if(child.isRemoved) { continue; }

			this._attachren(child.children);

			child._view = this;
		}
	},

	/**
	 * Remove entity from the view.
	 * @param entity {Entity.Geometry} Entity to remove.
	 */
	remove: function(entity)
	{
		if(!entity._view) {
			console.warn("[meta.View.remove]:", "Entity does not have view.");
			return;
		}

		if(entity._view !== this) {
			console.warn("[meta.View.remove]:", "Entity is part of other view: " + entity.view.name);
			return;
		}

		if(entity._parent !== entity._entityCtrl) {
			console.warn("[meta.View.remove]:", "Entity children are not part of view.");
			return;
		}

		this._removeFromBuffer(entity);

		if(this._isActive) {
			this._chnRemovedFromView.emit(entity, meta.Event.REMOVED_FROM_VIEW);
		}
		else {
			entity.removeFully();
		}
	},

	_removeFromBuffer: function(entity)
	{
		var replaceEntity = this.entities[this.numEntities - 1];
		replaceEntity._viewNodeID = entity._viewNodeID;
		this.entities[entity._viewNodeID] = replaceEntity;
		this.entities.pop();
		this.numEntities--;

		entity._view = null;

		this._removeChildren(entity.children);
	},

	_removeChildren: function(children)
	{
		if(!children) { return; }

		var child;
		var numChildren = children.length;
		for(var i = 0; i < numChildren; i++) {
			child = children[i];
			this._removeChildren(child);
			child._view = null;
		}
	},


	/**
	 * Attach view to this view
	 * @param view {meta.View} View to attach.
	 */
	attach: function(view)
	{
		if(!view) 
		{
			if(this.parentView) {
				console.warn("[meta.View.attach]:", "No view was passed.");
				return;
			}

			meta.view.attach(this);
			return;
		}

		if(typeof(view) === "string")
		{
			var srcView = meta.views[view];
			if(!srcView) {
				console.warn("[meta.View.attach]:", "No such view found: " + view);
				return;
			}

			view = srcView;
		}

		if(view._isActive) {
			console.warn("[meta.View.attach]:", "Can't attach an active view.");
			return;
		}

		if(view.parentView) {
			console.warn("[meta.View.attach]:", "View is already part of other view.");
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
	detach: function(view)
	{
		if(!view) 
		{
			if(!this.parentView) {
				console.warn("[meta.view.detach]:", "No view was passed.");
				return;
			}

			this.parentView.detach(this);
			return;
		}

		if(typeof(view) === "string")
		{
			var srcView = meta.views[view];
			if(!srcView) {
				console.warn("[meta.View.detach]:", "No such view found: \"" + view + "\"");
				return;
			}

			view = srcView;
		}

		if(!view.parentView) {
			console.warn("[meta.View.detach]:", "View has not parents to detach from.");
			return;
		}

		if(view.parentView !== this) {
			console.warn("[meta.View.detach]:", "Detaching from wrong parent.");
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

	detachAll: function()
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


	_addEntities: function()
	{
		if(this.numEntities > 0) {
			this._chnAddedToView.emit(this.entities, meta.Event.ADDED_TO_VIEW);
		}
	},

	_removeEntities: function()
	{
		if(this.numEntities > 0) {
			this._chnRemovedFromView.emit(this.entities, meta.Event.REMOVED_FROM_VIEW);
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

		// Add entities from the view.
		this._addEntities();

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

		// Remove entities from the view.
		this._removeEntities();

		if(this.views)
		{
			var numViews = this.views.length;
			for(n = 0; n < numViews; n++) {
				this.views[n].isActive = false;
			}
		}
	},


	set bgColor(hex)
	{
		if(meta.engine.isWebGL)
		{
			if(hex.length === 3) {
				hex += hex.substr(1, 3);
			}

			var color = meta.hexToRgb(hex);
			if(color.r > 0) {
				color.r = color.r / 255;
			}
			if(color.g > 0) {
				color.g = color.g / 255;
			}
			if(color.b > 0) {
				color.b = color.b / 255;
			}

			meta.ctx.clearColor(color.r, color.g, color.b, 1.0);
		}
		else {
			this._bgColor = hex;
		}
	},

	get bgColor() {
		return this._bgColor;
	},


	set isActive(value)
	{
		if(this._isActive === value) { return; }
		
		if(value) 
		{
			if(this.parentView && !this.parentView._isActive) { 
				return; 
			}

			this._isActive = value;
			this._makeActive();				
		}
		else {
			this._isActive = value;
			this._makeInactive();
		}
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
	controllers: null,

	_bgColor: "#888888",
	bgTransparent: false,
};

/**
 * Create a new view. Additionally controllers can be passed for registration.
 * @param name {String} Name of the view.
 * @param ctrls {String|Array} Name of the controller or array with controllers to register.
 */
meta.createView = function(name, ctrls)
{
	if(!name || typeof(name) !== "string") {
		console.error("[meta.createView]:", "Invalid name of the view.");
		return;
	}

	var view = meta.views[name];
	if(view) {
		console.error("[meta.createView]:", "View with a name - " + name + ", already exist!");
		return;		
	}

	view = new meta.View(name);
	meta.views[name] = view;

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
		console.error("[meta.setView]:", "No view passed.");
		return;
	}

	if(typeof(view) === "string") 
	{
		view = meta.views[view];
		if(!view) {
			view = new meta.View(name);
			meta.views[name] = view;
		}
	}

	meta.view.detachAll();
	meta.view.attach(view);
};

/**
 * Get the view. Will create a new view if not found.
 * @param name {String} Name of the view
 * @returns {meta.View}
 */
meta.getView = function(name)
{
	if(!name) {
		console.error("[meta.getView]:", "No name specified!");
		return null;
	}

	var view = meta.views[name];
	if(!view) {
		view = new meta.View(name);
		meta.views[name] = view;
	}

	return view;
};

/**
 * Attach view to the current active view.
 * @param view {meta.View|String} View object or name of the view.
 */
meta.attachView = function(view)
{
	if(!meta.view) {
		console.warn("[meta.attachView]:", "No current active view.");
		return;
	}

	if(typeof(view) === "string")
	{
		var srcView = meta.views[view];
		if(!srcView) {
			console.warn("[meta.attachView]:", "No such view found: " + view);
			return;
		}

		view = srcView;
	}

	meta.view.attach(view);
};

/**
 * Detach view from the current active view.
 * @param view {meta.View|String} View object or name of the view.
 */
meta.detachView = function(view)
{
	if(!meta.view) {
		console.warn("[meta.detachView]:", "No current active view.");
		return;
	}

	if(typeof(view) === "string")
	{
		var srcView = meta.views[view];
		if(!view) {
			console.warn("[meta.detachView]:", "No such view found: " + view);
			return;
		}

		view = srcView;
	}

	meta.view.detach(view);
};