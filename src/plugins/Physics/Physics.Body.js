"use strict";

Physics.Body = function() {
	this._mass = 100;
	this.invMass = 0.01;
	this.restitution = 0.6;
	this.velocity = new meta.math.Vector2(0, 0);
};

Physics.Body.prototype = 
{
	load: function() {
		this.volume = this.owner.volume;
		// this.volume = new meta.math.AABB(0, 0, 80, 20)
		// this.volume.__color = "#00ff00";
		// meta.renderer.addBoundingVolume(this.volume);
	},

	updateVolume: function() {},

	updateItem: function(tDelta, manifold)
	{
		this.speed += this.acceleration * tDelta;
		if(this.speed > this.maxSpeed) {
			this.speed = this.maxSpeed;
		}

		var volume = this.owner.volume;

		if(this.haveTarget) 
		{
			var distance = meta.math.length(volume.absX, volume.absY, this.targetX, this.targetY);
			if(distance <= (this.speed * tDelta)) {
				this.owner.position(this.targetX, this.targetY);
				this.stop();
			}
			else 
			{
				this._helperVec.x = this.targetX - volume.x;
				this._helperVec.y = this.targetY - volume.y;
				this._helperVec.normalize();

				this.velocity.x = this._helperVec.x * this.speed;
				this.velocity.y = this._helperVec.y * this.speed;
			}
		}

		this.owner.move(this.velocity.x * tDelta, this.velocity.y * tDelta);
		this.volume.set(volume.x, volume.y);

		// if(this.enableWorldBounds)
		// {
		// 	var newX = volume.x;
		// 	var newY = volume.y;

		// 	if(this.volume.minX < 0) {
		// 		newX = this.volume.x - this.volume.minX;
		// 		this.velocity.x = -this.velocity.x;
		// 		manifold.normal.set(1, 0);
		// 	}
		// 	else if(this.volume.maxX > meta.world.width) {
		// 		newX += meta.world.width - this.volume.maxX;
		// 		this.velocity.x = -this.velocity.x;
		// 		manifold.normal.set(-1, 0);
		// 	}

		// 	if(this.volume.minY < 0) {
		// 		newY = this.volume.y - this.volume.minY;
		// 		this.velocity.y = -this.velocity.y;
		// 		manifold.normal.set(0, 1);
		// 	}
		// 	else if(this.volume.maxY > meta.world.height) {
		// 		newY += meta.world.height - this.volume.maxY;
		// 		this.velocity.y = -this.velocity.y;
		// 		manifold.normal.set(0, -1);
		// 	}

		// 	this.owner.position(newX, newY);
		// 	this.volume.set(newX, newY);
		// }
	},	

	moveTo: function(x, y, speed, moveToCB) {
		this.targetX = x;
		this.targetY = y;
		this.haveTarget = true;
		this.speed = speed || 600;
		this.moveToCB = moveToCB || null;
	},

	stop: function() 
	{
		this.speed = 0;
		this.acceleration = 0;
		this.velocity.x = 0;
		this.velocity.y = 0;

		if(this.haveTarget) 
		{
			if(this.moveToCB) {
				this.moveToCB.call(this.owner);
				this.moveToCB = null;
			}

			this.haveTarget = false;
		}
	},

	set mass(value) 
	{
		this._mass = value;

		if(value === 0) {
			this.invMass = 0;
		}
		else {
			this.invMass = 1.0 / value;
		}
	},

	get mass() { return this._mass; },

	//
	enableWorldBounds: false,
	ghost: false,

	targetX: 0, targetY: 0,
	haveTarget: false,
	moveToCB: null,

	maxSpeed: Number.MAX_VALUE,
	acceleration: 0,

	onCollision: null,

	_helperVec: new meta.math.Vector2(0, 0)
};
