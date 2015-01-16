"use strict";

var Physics = {};

Physics.Manifold = function() {
	this.a = null;
	this.b = null;
	this.normal = new meta.math.Vector2(0, 0);
	this.penetration = 0;
};

Physics.Controller = meta.Controller.extend
({
	update: function(tDelta)
	{
		var item, item2, n, result;
		var numItems = this.items.length;
		for(var i = 0; i < numItems; i++)
		{
			item = this.items[i];
			this.updateItem(item, tDelta);

			for(n = i + 1; n < numItems; n++)
			{
				item2 = this.items[n];

				result = this.overlapAABB(item.owner.volume, item2.owner.volume);
				if(result) 
				{
					//this.resolveCollision(item, item2);
					// item.owner.move(
					// 	-this.manifold.penetration * this.manifold.normal.x,
					// 	-this.manifold.penetration * this.manifold.normal.y);
				}
			}
		}
	},

	updateItem: function(item, tDelta)
	{
		var newX = item.owner.left + (item.velocity.x * tDelta);
		var newY = item.owner.top + (item.velocity.y * tDelta);

		if(item.enableWorldBounds)
		{
			this.manifold.penetration = 0;

			if(newX < 0) {
				newX = 0;
				item.velocity.x = -item.velocity.x;
				this.manifold.normal.set(1, 0);
			}
			else if(newX + item.owner.width > meta.world.width) {
				newX = meta.world.width - item.owner.width;
				item.velocity.x = -item.velocity.x;
				this.manifold.normal.set(-1, 0);
			}

			if(newY < 0) {
				newY = 0;
				item.velocity.y = -item.velocity.y;
				this.manifold.normal.set(0, 1);
			}
			else if(newY + item.owner.height > meta.world.height) {
				newY = meta.world.height - item.owner.height;
				item.velocity.y = -item.velocity.y;
				this.manifold.normal.set(0, -1);
			}
		}

		item.owner.positionTopLeft(newX, newY);	
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
		this.items.push(
			entity.addComponent("body", Physics.Body));
	},

	//
	items: [],
	manifold: new Physics.Manifold(),
	_relativeVel: new meta.math.Vector2(0, 0),
	_impulseX: 0, _impulseY: 0,
	_percent: 0.8, _slop: 0.01
});
