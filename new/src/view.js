"use strict";

meta.View = function(name)
{
	this.name = name;
	this.flags = 0;

	this.entities = [];
	this.children = [];

	this.$position = new meta.math.Vector2(0, 0);
	this.$z = 0;
};

meta.View.prototype = 
{
	add: function(entity)
	{
		if(entity.flags & this.Flag.REMOVED) {
			console.warn("(meta.View.add) Trying to add entity that has been removed");
			return;
		}

		if(entity.$view)
		{
			if(entity.$view === this) {
				console.warn("(meta.View.add) Entity is already added to this view");
			}
			else {
				console.warn("(meta.View.add) Entity is already added to some other view");
			}
			return;
		}

		// if(entity.parent !== this.entityParent) {
		// 	entity.parent = this.entityParent;
		// }

		entity.flags |= entity.Flag.ROOT;
		entity.$view = this;

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

	Flag: {
		HIDDEN: 1 << 0,
		INSTANCE_HIDDEN: 1 << 1,
		ACTIVE: 1 << 2,
		STATIC: 1 << 3,
		DEBUGGER: 1 << 4
	}
};
