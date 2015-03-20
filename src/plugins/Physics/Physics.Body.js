"use strict";

meta.class("Physics.Body",
{
	init: function() {
		this.velocity = new meta.math.Vector2(0, 0);
	},

	load: function() {
		this._volume = this.owner.volume;
		Physics.ctrl.items.push(this);		
	},

	unload: function() {

	},

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
			var collision = false;

			// X
			if(this.volume.minX < 0) {
				newX = this.volume.x - this.volume.minX;
				manifold.normal.x = 1;
				collision = true;
			}
			else if(this.volume.maxX > world.width) {
				newX += world.width - this.volume.maxX;
				manifold.normal.x = 0;
				collision = true;
			}
			else {
				manifold.normal.x = 0;
			}

			// Y
			if(this.volume.minY < 0) {
				newY = this.volume.y - this.volume.minY;
				manifold.normal.y = 1;
				collision = true;
			}
			else if(this.volume.maxY > world.height) {
				newY += world.height - this.volume.maxY;
				manifold.normal.y = -1;
				collision = true;
			}
			else {
				manifold.normal.y = 0;
			}

		 	this.volume.position(newX, newY);

		 	if(collision && this.onCollision) {
		 		this.onCollision.call(this.owner, manifold);
		 	}
		}

		this.owner.position(this.volume.x, this.volume.y);
	},	

	/**
	 * onCollision
	 * @type {function}
	 */	
	onCollision: null,

	moveTo: function(x, y, speed, moveToCB) {
		this.targetX = x;
		this.targetY = y;
		this.haveTarget = true;
		this.speed = speed || 600;
		this.moveToCB = moveToCB || null;
	},

	/** stop */
	stop: function() 
	{
		this.speed = 0;
		this.acceleration = 0;
		this.velocity.x = 0;
		this.velocity.y = 0;

		if(this.haveTarget) 
		{
			this.haveTarget = false;

			if(this.moveToCB) {
				this.moveToCB.call(this.owner);
				this.moveToCB = null;
			}
		}

		if(this.onStop) {
			this.onStop.call(this.owner);
		}
	},

	/**
	 * onStop
	 * @type {function}
	 */
	onStop: null,

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
	_volume: null,
	_mass: 100,
	invMass: 0.01,
	restitution: 0.6,
	velocity: null,

	worldBounds: false,
	ghost: false,

	targetX: 0, targetY: 0,
	haveTarget: false,
	moveToCB: null,

	maxSpeed: Number.MAX_VALUE,
	acceleration: 0,

	_helperVec: new meta.math.Vector2(0, 0)
});
