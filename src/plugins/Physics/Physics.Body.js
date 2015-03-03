"use strict";

Physics.Body = function() {
	this._volume = null;
	this._mass = 100;
	this.invMass = 0.01;
	this.restitution = 0.6;
	this.velocity = new meta.math.Vector2(0, 0);
};

Physics.Body.prototype = 
{
	load: function() {
		this._volume = this.owner.volume;
	},

	updateVolume: function() {},

	updateItem: function(tDelta, manifold)
	{
		this.speed += this.acceleration * tDelta;
		if(this.speed > this.maxSpeed) {
			this.speed = this.maxSpeed;
		}

		var volume = this.owner.volume;
		this.volume.position(volume.x, volume.y);

		if(this.haveTarget) 
		{
			var distance = meta.math.length(volume.x, volume.y, this.targetX, this.targetY);
			if(distance <= (this.speed * tDelta)) {
				this.volume.position(this.targetX, this.targetY);
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

		this.volume.move(this.velocity.x * tDelta, this.velocity.y * tDelta);

		if(this.worldBounds)
		{
			var newX = this.volume.x;
			var newY = this.volume.y;
			var world = meta.world;

			if(this.volume.minX < 0) {
				newX = this.volume.x - this.volume.minX;
				manifold.normal.set(1, 0);
			}
			else if(this.volume.maxX > world.width) {
				newX += world.width - this.volume.maxX;
				manifold.normal.set(-1, 0);
			}

			if(this.volume.minY < 0) {
				newY = this.volume.y - this.volume.minY;
				manifold.normal.set(0, 1);
			}
			else if(this.volume.maxY > world.height) {
				newY += world.height - this.volume.maxY;
				manifold.normal.set(0, -1);
			}

		 	this.volume.position(newX, newY);
		}

		this.owner.position(this.volume.x, this.volume.y);
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

	set volume(volume) {
		this._volume = volume;
		this._volume.position(this.owner.volume.x, this.owner.volume.y);
	},

	get volume() { return this._volume; },

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
	worldBounds: false,
	ghost: false,

	targetX: 0, targetY: 0,
	haveTarget: false,
	moveToCB: null,

	maxSpeed: Number.MAX_VALUE,
	acceleration: 0,

	onCollision: null,

	_helperVec: new meta.math.Vector2(0, 0)
};
