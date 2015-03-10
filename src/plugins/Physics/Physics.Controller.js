"use strict";

var Physics = {};

Physics.Manifold = function() {
	this.entity = null;
	this.normal = new meta.math.Vector2(0, 0);
	this.penetration = 0;
};

Physics.Controller = meta.Controller.extend
({
	init: function() {
		meta.subscribe(this, meta.Event.DEBUG, this.onDebug);
	},

	update: function(tDelta)
	{
		var item, item2, n, result;
		var numItems = this.items.length;
		for(var i = 0; i < numItems; i++)
		{
			item = this.items[i];
			item.updateItem(tDelta, this.manifold);

			if(!item.owner.visible) { continue; }

			for(n = i + 1; n < numItems; n++)
			{
				item2 = this.items[n];
				if(!item2.owner.visible) { continue; }

				result = this.overlapAABB(item.volume, item2.volume);
				if(result) 
				{
					if(item.onCollision) { 
						this.manifold.entity = item2.owner;
						item.onCollision.call(item.owner, this.manifold); 
					}
					if(item2.onCollision) { 
						this.manifold.entity = item.owner;				
						item2.onCollision.call(item2.owner, this.manifold); 
					}
					//console.log("collision");
					//this.resolveCollision(item, item2);
					// item.owner.move(
					// 	-this.manifold.penetration * this.manifold.normal.x,
					// 	-this.manifold.penetration * this.manifold.normal.y);
				}
			}
		}
	},

	render: function(tDelta)
	{
		var ctx = meta.renderer.ctx;
		ctx.save();

		ctx.fillStyle = "#00ff00";
		ctx.globalAlpha = 0.4;

		var numItems = this.items.length;
		for(var i = 0; i < numItems; i++) {
			this.drawVolume(ctx, this.items[i]);
		}

		ctx.restore();
	},

	drawVolume: function(ctx, item) {
		var volume = item.volume;
		ctx.fillRect(volume.minX | 0, volume.minY | 0, volume.width, volume.height);
	},

	overlapAABB: function(a, b)
	{
		var diffX = b.minX - a.minX;
		var diffY = b.minY - a.minY;
		var extentA = (a.maxX - a.minX) / 2;
		var extentB = (b.maxX - b.minX) / 2;

		var overlapX = extentA + extentB - Math.abs(diffX);
		if(overlapX > 0)
		{
			extentA = (a.maxY - a.minY) / 2;
			extentB = (b.maxY - b.minY) / 2;

			var overlapY = extentA + extentB - Math.abs(diffY);
			if(overlapY > 0)
			{
				if(overlapX < overlapY)
				{
					if(diffX < 0) {
						this.manifold.normal.set(-1, 0);
					}
					else {
						this.manifold.normal.set(1, 0);
					}

					this.manifold.penetration = overlapX;
					return true;
				}
				else
				{
					if(diffY < 0) {
						this.manifold.normal.set(0, -1);
					}
					else {
						this.manifold.normal.set(0, 1);
					}

					this.manifold.penetration = overlapY;
					return true;
				}
			}
		}

		return false;
	},

	add: function(entity) 
	{
		if(!(entity instanceof Entity.Geometry)) {
			console.warn("(Physics.Controller.add) Object should be a part of Entity.Geometry:", entity);
			return;
		}

		entity.addComponent("body", Physics.Body);
	},

	onDebug: function(value, event) 
	{
		if(value) {
			meta.renderer.addRender(this);
		}
		else {
			meta.renderer.removeRender(this);
		}
	},

	//
	items: [],
	manifold: new Physics.Manifold(),
	_relativeVel: new meta.math.Vector2(0, 0),
	_impulseX: 0, _impulseY: 0,
	_percent: 0.8, _slop: 0.01
});
