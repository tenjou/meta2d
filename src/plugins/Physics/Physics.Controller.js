"use strict";

meta.class("Physics.Controller", "meta.Controller", 
{
	init: function() {
		this.manifold = new this.Manifold();
		meta.subscribe(this, meta.Event.DEBUG, this.onDebug);
	},

	update: function(tDelta)
	{
		var body1 = null, body2 = null;
		var numBodies = this.bodies.length;
		for(var i = 0; i < numBodies; i++) {
			body1 = this.bodies[i];
			body1.updateBody(tDelta);
			this.bodyVsWorld(body1);
		}

		var owner;
		var n = 0;
		for(i = 0; i < numBodies; i++) 
		{
			body1 = this.bodies[i];
			
			for(n = i + 1; n < numBodies; n++) 
			{
				body2 = this.bodies[n];

				if(body1._mass === 0 && body2._mass === 0) {
					continue;
				}				

				if(this.bodyVsBody(body1, body2))
				{
					body1.colliding = true;
					body2.colliding = true;

					if(body1.owner.onCollision) {
						this.manifold.entity = body2.owner;
						body1.owner.onCollision(this.manifold);
					}
					if(body2.owner.onCollision) {
						this.manifold.entity = body1.owner;
						body2.owner.onCollision(this.manifold);
					}			
				}
			}

			owner = body1.owner;
			owner.position(body1.volume.x - owner.totalOffsetX, body1.volume.y - owner.totalOffsetY);			
		}
	},

	bodyVsWorld: function(body)
	{
		if(!body.worldBounds) { return; }

		var world = meta.world;
		var volume = body.volume;
		var newX = volume.x;
		var newY = volume.y;
		var collision = false;

	 	var shapes = meta.world.shapes;
	 	if(shapes) 
	 	{
	 		var shape;
	 		var num = shapes.length;
	 		for(var n = 0; n < num; n++) 
	 		{
	 			shape = shapes[n];

				var dx = shape.x - volume.x;
				var dy = shape.y - volume.y;
				var r = shape.radius - volume.radius;

				var lengthSquared = (dx * dx) + (dy * dy);

				if(lengthSquared >= (r * r)) 
				{
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

					volume.move(
						this.manifold.penetration * this.manifold.normal.x,
						this.manifold.penetration * this.manifold.normal.y);	

					var value = body.velocity.dot(this.manifold.normal);
					body.velocity.x -= 2 * value * this.manifold.normal.x;
					body.velocity.y -= 2 * value * this.manifold.normal.y;										
				}
	 		}
	 	}		

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
				return this.boxVsCircle(body2, body1);
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

		// DiffX:
		var diffX = (volume2.minX + volume2.halfWidth) - (volume1.minX + volume1.halfWidth);

		var overlapX = a.halfWidth + volume2.halfWidth - Math.abs(diffX);
		if(overlapX <= 0) { 
			return false; 
		}

		// DiffY:
		var diffY = (volume2.minY + volume2.halfHeight) - (volume1.minY + volume1.halfHeight);

		var overlapY = volume1.halfHeight + volume2.halfHeight - Math.abs(diffY);
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

		var massUnit = 1.0 / (body1._mass + body2._mass);

		var penetration = this.manifold.penetration * (body1._mass * massUnit);
		volume1.move(
			penetration * this.manifold.normal.x,
			penetration * this.manifold.normal.y);

		penetration = this.manifold.penetration * (body2._mass * massUnit);
		volume2.move(
			penetration * -this.manifold.normal.x,
			penetration * -this.manifold.normal.y);

		body1.velocity.reflect(this.manifold.normal);
		body2.velocity.reflect(this.manifold.normal);

		return true;
	},

	boxVsCircle: function(body1, body2)
	{
		var volume1 = body1._volume;
		var volume2 = body2._volume;

		var diffX = volume2.x - (volume1.minX + volume1.halfWidth);
		var diffY = volume2.y - (volume1.minY + volume1.halfHeight);
		var extentX = (volume1.maxX - volume1.minX) * 0.5;
		var extentY = (volume1.maxY - volume1.minY) * 0.5;
		var closestX = Math.min(Math.max(diffX, -extentX), extentX);
		var closestY = Math.min(Math.max(diffY, -extentY), extentY);

		// Circle is inside the AABB:
		if(diffX === closestX && diffY === closestY)
		{
			if(Math.abs(diffX) > Math.abs(diffY))
			{
				this.manifold.normal.y = 0;

				if(diffX < 0) {
					this.manifold.normal.x = -1;
					this.manifold.penetration = (volume1.halfWidth + diffX) + volume2.radius;
				}
				else {
					this.manifold.normal.x = 1;
					this.manifold.penetration = (volume1.halfWidth - diffX) + volume2.radius;					
				}
			}
			else	 
			{
				this.manifold.normal.x = 0;

				if(diffY < 0) {
					this.manifold.normal.y = -1;
					this.manifold.penetration = (volume1.halfHeight + diffY) + volume2.radius;
				}
				else {
					this.manifold.normal.y = 1;
					this.manifold.penetration = (volume1.halfHeight - diffY) + volume2.radius;					
				}
			}		
		}
		else
		{
			var normalX = diffX - closestX;
			var normalY = diffY - closestY;
			var length = (normalX * normalX) + (normalY * normalY);

			if(length > (volume2.radius * volume2.radius)) {
				return false;
			}

			this.manifold.penetration = Math.sqrt(length) - volume2.radius;

			this.manifold.normal.x = -normalX;
			this.manifold.normal.y = -normalY;	
			this.manifold.normal.normalize();			
		}

		var massUnit = 1.0 / (body1._mass + body2._mass);

		var penetration = this.manifold.penetration * (body1._mass * massUnit);
		volume1.move(
			penetration * -this.manifold.normal.x,
			penetration * -this.manifold.normal.y);

		penetration = this.manifold.penetration * (body2._mass * massUnit);
		volume2.move(
			penetration * this.manifold.normal.x,
			penetration * this.manifold.normal.y);

		if(body1.bouncing) {
			body1.velocity.reflect(this.manifold.normal);
		}
		if(body2.bouncing) {
			body2.velocity.reflect(this.manifold.normal);
		}

		return true;
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

	add: function(body) 
	{
		if(!body) {
			console.warn("(Physics) Invalid body passed");
			return;
		}
		if(body.__index !== -1) {
			console.warn("(Physics) Body is already in use");
			return;
		}

		body.__index = this.bodies.length;
		this.bodies.push(body);
	},

	remove: function(body) 
	{
		if(!body) {
			console.warn("(Physics) Invalid body passed");
			return;
		}
		if(body.__index === -1) {
			console.warn("(Physics) Body is not in use");
			return;
		}

		var tmpBody = this.bodies[this.bodies.length - 1];
		tmpBody.__index = body.__index;
		this.bodies[body.__index] = tmpBody;
		this.bodies.pop();
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
