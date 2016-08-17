"use strict";

meta.Layer = function(id)
{
	this.id = id;
	this.flags = 0;

	this.entities = [];
	this.entitiesRemove = [];
	this.children = {};

	this.$position = new meta.Vector2(0, 0);
	this.$z = 0;
};

meta.Layer.prototype = 
{
	add: function(entity)
	{
		// if(entity.flags & this.Flag.REMOVED) {
		// 	console.warn("(meta.Layer.add) Trying to add entity that has been removed");
		// 	return;
		// }

		if(entity.$layer)
		{
			if(entity.$layer === this) {
				console.warn("(meta.Layer.add) Entity is already added to this layer");
			}
			else {
				console.warn("(meta.Layer.add) Entity is already added to some other layer");
			}
			return;
		}

		// if(entity.parent !== this.entityParent) {
		// 	entity.parent = this.entityParent;
		// }

		entity.flags |= entity.Flag.ROOT;
		entity.$setLayer(this);

		if(this.$position.x !== 0 || this.$position.y !== 0) {
			entity.updatePosition();
		}
		if(this.$z !== 0) {
			entity.updateZ();
		}

		this.entities.push(entity);
		this.$addChildren(entity.children);

		if((this.flags & this.Flag.ACTIVE) && !(this.flags & this.Flag.INSTANCE_HIDDEN)) {
			meta.renderer.addEntity(entity, false);
		}
	},

	$addChildren: function(children)
	{

	},

	remove: function(entity)
	{
		if(entity instanceof meta.Sprite)
		{
			if(entity.$layer !== this) {
				console.warn("(meta.Layer.remove) Entity has different layer: ", entity.$layer.id);
				return;
			}

			var index = this.entities.indexOf(entity);
			if(index === -1) {
				console.warn("(meta.Layer.remove) Entity not found: ", entity.id);
				return;
			}

			this.entitiesRemove.push(entity);
		}
		else if(typeof entity === "string")
		{


			if(entity.$layer !== this) {
				console.warn("(meta.Layer.remove) Entity has different layer: ", entity.$layer.id);
				return;
			}


		}
		else {
			return console.warn("(meta.Layer.remove) Invalid entity or id passed");
		}


		meta.renderer.removeEntity(entity);
	},

	attach: function(layer)
	{
		if(!layer) {
			return console.warn("(meta.Layer.attach) Invalid layer passed");
		}

		if(layer.parent)
		{
			if(layer.parent === this) {
				return;
			}

			layer.detach();
			layer.attach(this);
		}

		this.children[layer.id] = layer;

		if(this.flags & this.Flag.ACTIVE) {
			layer.$activate();
		}
	},

	detach: function(layer)
	{
		if(!layer) 
		{
			if(!layer.parent) {
				return console.warn("(meta.Layer.detach) Layer does not have parent: ", layer);
			}

			layer.parent.detach(this);
			return;
		}

		if(layer.parent !== this) {
			return console.warn("(meta.Layer.detach) Layer `" + layer.id + "` has not been attached to parent `" + this.id + "`");
		}

		if(!this.children[layer.id]) {
			return console.error(" (logic error) (meta.Layer.detach) Layer `" + layer.id + "` has not been attached to parent `" + this.id + "`");
		}

		delete this.children[layer.id];

		if(this.flags & this.Flag.ACTIVE) {
			layer.$deactivate();
		}
	},

	$activate: function()
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
				this.children[n].$activate();
			}
		}
	},

	$deactivate: function()
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
				this.children[n].$deactivate();
			}
		}
	},

	get active() {
		return ((this.flags & this.Flag.ACTIVE) === this.Flag.ACTIVE);
	},

	set fixed(value)
	{
		if(value)
		{
			if(this.flags & this.Flag.FIXED) { return; }
			this.flags |= this.Flag.FIXED;

			if(this.flags & this.Flag.ACTIVE) {
				meta.renderer.needRender = true;
			}
		}
		else
		{
			if((this.flags & this.Flag.FIXED) === 0) { return; }
		}
		
		this.updateFixed();
	},

	get fixed() {
		return ((this.flags & this.Flag.FIXED) === this.Flag.FIXED);
	},

	updateFixed: function()
	{
		if(this.parent) 
		{
			if(this.flags & this.Flag.FIXED && this.parent.flags & this.Flag.INSTANCE_FIXED) {
				this.flags |= this.Flag.INSTANCE_FIXED;
			}
			else {
				this.flags &= ~this.Flag.INSTANCE_FIXED;
			}
		}
		else
		{
			if(this.flags & this.Flag.FIXED) {
				this.flags |= this.Flag.INSTANCE_FIXED;
			}
			else {
				this.flags &= ~this.Flag.INSTANCE_FIXED;
			}
		}

		if(this.children)
		{
			for(var key in this.children) {
				this.children[key].updateStatic();
			}
		}
	},

	Flag: {
		HIDDEN: 1 << 0,
		INSTANCE_HIDDEN: 1 << 1,
		ACTIVE: 1 << 2,
		INSTANCE_FIXED: 1 << 3,
		FIXED: 1 << 4,
		DEBUGGER: 1 << 5
	}
};

meta.createLayer = function createLayer(id) {
	var layer = meta.new(meta.Layer, id);
	meta.layer.attach(layer);
	return layer;
};

meta.destroyLayer = function destroyLayer(layer) {

};
