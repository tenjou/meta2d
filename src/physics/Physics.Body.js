"use strict";

meta.component("Physics.Body",
{
	onAdd: function() 
	{
		this.velocity = new meta.math.Vector2(0, 0);
		this.acceleration = new meta.math.Vector2(0, 0);
		this.speed = new meta.math.Vector2(0, 0);
		this._volume = this.owner.volume;
	},

	onActiveEnter: function() {
		meta.physics.add(this);
	},

	onActiveExit: function() {
		meta.physics.remove(this);
	},

	step: function(tDelta)
	{
		this.colliding = false;
		this.volume.position(this.owner.volume.x, this.owner.volume.y);

		if(this.haveTarget) 
		{
			var distance = meta.math.length(this.volume.x, this.volume.y, this.targetX, this.targetY);
			if(distance <= (this.speed * tDelta)) {
				this.volume.position(this.targetX, this.targetY);
				this.stop();
			}
			else 
			{
				this._vec.x = this.targetX - this.volume.x;
				this._vec.y = this.targetY - this.volume.y;
				this._vec.normalize();

				this.velocity.x = this._vec.x * this.speed;
				this.velocity.y = this._vec.y * this.speed;
			}
		}

		this.velocity.x += this.acceleration.x * tDelta;
		this.velocity.y += this.acceleration.y * tDelta;
		this.volume.move(this.velocity.x * tDelta, this.velocity.y * tDelta);

		this.acceleration.x = 0;
		this.acceleration.y = 0;
	},

	applyForce: function(vec) {
		this.acceleration.x += vec.x / this.invMass;
		this.acceleration.y += vec.y / this.invMass;
	},

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

	set volume(volume) 
	{
		if(volume instanceof meta.math.Circle) {
			this.type = 1;
		}
		else {
			this.type = 0;
		}

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
	type: 0,
	_volume: null,
	_mass: 1,
	invMass: 1,
	restitution: 0.6,
	velocity: null,
	moveX: 0, moveY: 0,

	worldBounds: false,
	ghost: false,
	bouncing: false,
	colliding: false,

	targetX: 0, targetY: 0,
	haveTarget: false,
	moveToCB: null,

	maxSpeed: Number.MAX_VALUE,
	acceleration: null,
	accelerationMod: 1,

	_vec: new meta.math.Vector2(0, 0),

	__index: -1
});
