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
	this._isCtrlInited = false;
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
		if(typeof(view) === "string")
		{
			var srcView = meta.views[view];
			if(!srcView) {
				console.warn("[meta.View.attach]:", "No such view found: \"" + view + "\"");
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

	/**
	 * Register controller to the view.
	 * @param ctrlName {String} Controller name to register.
	 */
	register: function(ctrlName)
	{
		if(!this.controllers) {
			this.controllers = [ ctrlName ];
		}
		else {
			this.controllers.push(ctrName);
		}

		if(this._isActive) {
			meta.register(ctrlName, this);
		}
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
			if(this.controllers[i] === ctrlName)
			{
				if(this._isActive) {
					meta.unregister(ctrlName);
				}

				this.controllers[i] = this.controllers[numControllers - 1];
				this.controllers.pop();
			}
		}
	},

	_registerToEngine: function()
	{
		if(this.controllers)
		{
			var n;
			var numControllers = this.controllers.length;

			if(!this._isCtrlInited)
			{
				for(n = 0; n < numControllers; n++) {
					meta.register(this.controllers[n], this);
				}
			}
			else
			{
				var ctrl, index;
				for(n = 0; n < numControllers; n++)
				{
					ctrl = this.controllers[n];

					index = ctrl.indexOf(".");
					if(index !== -1) {
						ctrl = ctrl.substr(0, index);
					}

					window[ctrl].ctrl.load();
				}
			}
		}

		this._isCtrlInited = true;
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

		var n, numViews;

		if(value)
		{
			this._registerToEngine();

			if(this.numEntities > 0) {
				this._chnAddedToView.emit(this.entities, meta.Event.ADDED_TO_VIEW);
			}

			if(this.views)
			{
				numViews = this.views.length;
				for(n = 0; n < numViews; n++) {
					this.views[n].isActive = true;
				}
			}
		}
		else
		{
			if(this.controllers)
			{
				var ctrl, index;
				var numControllers = this.controllers.length;
				for(n = 0; n < numControllers; n++)
				{
					ctrl = this.controllers[n];

					index = ctrl.indexOf(".");
					if(index !== -1) {
						ctrl = ctrl.substr(0, index);
					}

					window[ctrl].ctrl.unload();
				}
			}

			if(this.numEntities > 0) {
				this._chnRemovedFromView.emit(this.entities, meta.Event.REMOVED_FROM_VIEW);
			}

			if(this.views)
			{
				numViews = this.views.length;
				for(n = 0; n < numViews; n++) {
					this.views[n].isActive = false;
				}
			}
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
	controllers: null,

	_bgColor: "#888888"
};


/**
 * Set the view. Will create a new view if not found.
 * @param name {String} Name of the view
 */
meta.setView = function(name)
{
	if(!name) {
		console.error("[meta.getView]:", "No name specified!");
		return;
	}

	if(meta.view && name === meta.view.name) {
		return;
	}

	var view = meta.views[name];
	if(!view) {
		view = new meta.View(name);
		meta.views[name] = view;
	}

	meta.view = view;
	if(meta.engine.isInited) {
		meta.engine.onViewChange(view);
	}
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