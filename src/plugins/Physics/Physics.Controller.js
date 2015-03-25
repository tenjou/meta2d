"use strict";

meta.class("Physics.Controller", "meta.Controller", 
{
	init: function() {
		this.manifold = new this.Manifold();
		meta.subscribe(this, meta.Event.DEBUG, this.onDebug);
	},

	update: function(tDelta)
	{
		var owner;
		var body1 = null, body2 = null;
		var numBodies = this.bodies.length;
		for(var i = 0; i < numBodies; i++) {
			body1 = this.bodies[i];
			body1.updateItem(tDelta);
			this.bodyVsWorld(body1);

			owner = body1.owner;
			owner.position(body1.volume.x - owner.totalOffsetX, body1.volume.y - owner.totalOffsetY);
		}

		// var n = 0;
		// for(i = 0; i < numBodies; i++) 
		// {
		// 	body1 = this.bodies[i];
			
		// 	for(n = i + 1; n < numBodies; n++) 
		// 	{
		// 		body2 = this.bodies[n];

		// 		if(this.bodyVsBody(body1, body2))
		// 		{
		// 			body1.colliding = true;
		// 			body2.colliding = true;

		// 			if(body1.owner.onCollision) {
		// 				this.manifold.entity = body2.owner;
		// 				body1.owner.onCollision(this.manifold);
		// 			}
		// 			if(body2.owner.onCollision) {
		// 				this.manifold.entity = body1.owner;
		// 				body2.owner.onCollision(this.manifold);
		// 			}	

		// 			owner = body1.owner;
		// 			owner.position(body1.volume.x - owner.totalOffsetX, body1.volume.y - owner.totalOffsetY);
		// 			owner = body2.owner;
		// 			owner.position(body2.volume.x - owner.totalOffsetX, body2.volume.y - owner.totalOffsetY);			
		// 		}
		// 	}
		// }
	},

	render: function(tDelta)
	{
		var ctx = meta.renderer.ctx;
		ctx.save();

		ctx.fillStyle = this.debugColor;
		ctx.globalAlpha = 0.4;

		var numBodies = this.bodies.length;
		for(var i = 0; i < numBodies; i++) {
			this.drawVolume(ctx, this.bodies[i]);
		}

		ctx.restore();
	},

	drawVolume: function(ctx, body) 
	{
		var volume = body._volume;

		// AABB
		if(body.type === 0) {
			ctx.fillRect(Math.floor(volume.minX), Math.floor(volume.minY), volume.width, volume.height);	
		}
		else if(body.type === 1) {
			ctx.beginPath();
			ctx.arc(Math.floor(volume.x), Math.floor(volume.y), volume.radius, 0, 2 * Math.PI, false);
			ctx.fill();
		}
	},

	overlapAABB: function(a, b)
	{
		// DiffX:
		var diffX = (b.minX + b.halfWidth) - (a.minX + a.halfWidth);

		var overlapX = a.halfWidth + b.halfWidth - Math.abs(diffX);
		if(overlapX <= 0) { 
			return false; 
		}

		// DiffY:
		var diffY = (b.minY + b.halfHeight) - (a.minY + a.halfHeight);

		var overlapY = a.halfHeight + b.halfHeight - Math.abs(diffY);
		if(overlapY <= 0) { 
			return false; 
		}

		// Normals:
		if(overlapX < overlapY)
		{
			if(diffX < 0) {
				this.manifold.normal.set(-1, 0);
			}
			else {
				this.manifold.normal.set(1, 0);
			}

			this.manifold.penetration = overlapX;
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
		}

		return true;
	},

	bodyVsWorld: function(body)
	{
		if(!body.worldBounds) { return; }

		var world = meta.world;
		var volume = body._volume;
		var newX = volume.x;
		var newY = volume.y;
		var collision = false;

	 	// var shapes = meta.world.shapes;
	 	// if(shapes) 
	 	// {
	 	// 	var shape;
	 	// 	var num = shapes.length;
	 	// 	for(var n = 0; n < num; n++) 
	 	// 	{
	 	// 		shape = shapes[n];
	 	// 		if(!shape.vsCircle(volume)) { continue; }

	 	// 		var ABx = volume.x - shape.x;
	 	// 		var ABy = volume.y - shape.y;
	 	// 		var BCx = volume.
	 	// 	}
	 	// }		

		// X
		if(volume.minX < 0) 
		{
			newX = volume.x - volume.minX;
			this.manifold.normal.x = 1;
			collision = true;
			
			if(body.bouncing) {
				body.velocity.x *= -1;
			}
			else {
				body.velocity.x = 0;
			}				
		}
		else if(volume.maxX > world.width) 
		{
			newX += world.width - volume.maxX;
			this.manifold.normal.x = -1;
			collision = true;

			if(body.bouncing) {
				body.velocity.x *= -1;
			}
			else {
				body.velocity.x = 0;
			}				
		}
		else {
			this.manifold.normal.x = 0;
		}

		// Y
		if(volume.minY < 0) 
		{
			newY = volume.y - volume.minY;
			this.manifold.normal.y = 1;
			collision = true;

			if(body.bouncing) {
				body.velocity.y *= -1;
			}
			else {
				body.velocity.y = 0;
			}
		}
		else if(volume.maxY > world.height) 
		{
			newY += world.height - volume.maxY;
			this.manifold.normal.y = -1;
			collision = true;

			if(body.bouncing) {
				body.velocity.y *= -1;
			}
			else {
				body.velocity.y = 0;
			}			
		}
		else {
			this.manifold.normal.y = 0;
		}

	 	if(collision) 
	 	{
	 		volume.position(newX, newY); 		

	 		if(body.owner.onCollision) {
		 		this.manifold.entity = null;
		 		body.colliding = true;
		 		body.owner.onCollision.call(body.owner, this.manifold);
	 		}
	 	}
	},

	bodyVsBody: function(body1, body2)
	{
		if(body1.type === 0)
		{
			if(body2.type === 0) {
				return this.boxVsBox(body1, body2);
			}
			else if(body2.type === 1) {
				return this.boxVsCircle(body1, body2);
			}
		}
		else if(body1.type === 1)
		{
			if(body2.type === 0) {
				return this.boxVsCircle(body1, body2);
			}
			else if(body2.type === 1) {
				return this.circleVsCircle(body1, body2);
			}
		}

		return false;
	},

	boxVsBox: function(body1, body2)
	{
		var volume1 = body1._volume;
		var volume2 = body2._volume;

		if(!this.overlapAABB(volume1, volume2)) { return false; }

		if(body2._mass === 0) 
		{
			volume1.move(
				-this.manifold.penetration * this.manifold.normal.x,
				-this.manifold.penetration * this.manifold.normal.y);			
		}

		if(body1._mass === 0)
		{
			volume2.move(
				this.manifold.penetration * this.manifold.normal.x,
				this.manifold.penetration * this.manifold.normal.y);				
		}	

		return true;
	},

	circleVsCircle: function(body1, body2)
	{
		var volume1 = body1._volume;
		var volume2 = body2._volume;

		var dx = volume2.x - volume1.x;
		var dy = volume2.y - volume1.y;
		var r = (volume1.radius + volume2.radius);

		var lengthSquared = (dx * dx) + (dy * dy);
		if(lengthSquared > (r * r)) {
			return false;
		}

		var length = Math.sqrt(lengthSquared);
		if(length !== 0) {
			this.manifold.penetration = r - length;
			this.manifold.normal.x = -dx / length;
			this.manifold.normal.y = -dy / length;
		}
		else {
			this.manifold.penetration = volume1.radius;
			this.manifold.normal.x = 1;
			this.manifold.normal.y = 0;
		}

		volume1.move(
			this.manifold.penetration / 2 * this.manifold.normal.x,
			this.manifold.penetration / 2 * this.manifold.normal.y);
		volume2.move(
			this.manifold.penetration / 2 * -this.manifold.normal.x,
			this.manifold.penetration / 2 * -this.manifold.normal.y);

		// body1.velocity.x *= this.manifold.normal.x;
		// body1.velocity.y *= this.manifold.normal.y;
		// body2.velocity.x *= -this.manifold.normal.x;
		// body2.velocity.y *= -this.manifold.normal.y;		
			// body1.velocity.x = body1.velocity.x * -this.manifold.normal.x;
			// body1.velocity.y = body1.velocity.y * -this.manifold.normal.y;
			// body2.velocity.x = body2.velocity.x * this.manifold.normal.x;
			// body2.velocity.y = body2.velocity.y * this.manifold.normal.y;
			// body1.velocity.x = (body1.speed.x * (body1.mass - body2.mass) + (2 * body2.mass * body2.speed.x)) / (body1.mass + body2.mass);
			// body1.velocity.y = (body1.speed.y * (body1.mass - body2.mass) + (2 * body2.mass * body2.speed.y)) / (body1.mass + body2.mass);
			// body2.velocity.x = (body2.speed.x * (body2.mass - body1.mass) + (2 * body1.mass * body1.speed.x)) / (body2.mass + body1.mass);
			// body2.velocity.y = (body2.speed.y * (body2.mass - body1.mass) + (2 * body1.mass * body1.speed.y)) / (body2.mass + body1.mass);			
			//console.log(body1.velocity);

		return true;

		// if(volume1.vsCircle(volume2)) 
		// {
		// 	var relVelX = body2.velocity.x - body1.velocity.x;
		// 	var relVelY = body2.velocity.y - body1.velocity.y;

		// 	var velAlongNormal = meta.

		// 	// var collisionX = ((volume1.x * volume2.radius) + (volume2.x * volume1.radius)) /
		// 	// 	(volume1.radius + volume2.radius);
		// 	// var collisionY = ((volume1.y * volume2.radius) + (volume2.y * volume1.radius)) /
		// 	// 	(volume1.radius + volume2.radius);	

			// body1.velocity.x = (body1.speed.x * (body1.mass - body2.mass) + (2 * body2.mass * body2.speed.x)) / (body1.mass + body2.mass);
			// body1.velocity.y = (body1.speed.y * (body1.mass - body2.mass) + (2 * body2.mass * body2.speed.y)) / (body1.mass + body2.mass);

			body2.velocity.x = (body2.speed.x * (body2.mass - body1.mass) + (2 * body1.mass * body1.speed.x)) / (body2.mass + body1.mass);
			body2.velocity.y = (body2.speed.y * (body2.mass - body1.mass) + (2 * body1.mass * body1.speed.y)) / (body2.mass + body1.mass);

		// 	// if(body1.bouncing) {
		// 	// 	body1.velocity.x = (body1.velocity.x * (1 - 1) +
		// 	// 		(2 * 1 * body2.velocity.x)) / (1 + 1);
		// 	// 	body1.velocity.y = (body1.velocity.y * (1 - 1) +
		// 	// 		(2 * 1 * body2.velocity.y)) / (1  +1);
		// 	// }
		// 	// else {
		// 	// 	body1.velocity.x = 0;
		// 	// 	body1.velocity.y = 0;
		// 	// }

		// 	// if(body2.bouncing) {

		// 	// }
		// 	// else {
		// 	// 	body2.velocity.x = 0;
		// 	// 	body2.velocity.y = 0;					
		// 	// }

		// 	// var midX = (volume1.x + volume2.x) / 2;	
		// 	// var midY = (volume1.y + volume2.y) / 2;

		// 	// volume1.position(midX + volume1.radius * )	

		// 	//console.log(collisionX, collisionY);	

		// 	//circle.position(collisionX, collisionY);		

		// 	return true;
		// }

		// return false;
	},

	boxVsCircle: function(bod1, body2)
	{
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

	Manifold: function() {
		this.entity = null;
		this.normal = new meta.math.Vector2(0, 0);
		this.penetration = 0;
	},	

	//
	bodies: [],

	gravity: new meta.math.Vector2(0, 0),
	wind: new meta.math.Vector2(0, 0),
	friction: 25,

	manifold: null,
	_relativeVel: new meta.math.Vector2(0, 0),
	_impulseX: 0, _impulseY: 0,
	_percent: 0.8, _slop: 0.01,

	debugColor: "#00ff00"
});
