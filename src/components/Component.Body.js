"use strict";

Component.Body = function(owner) 
{
	this.owner = owner;
	this.volume = null;
	this.velocity = new meta.math.Vector2(0, 0);
	this.acceleration = new meta.math.Vector2(0, 0);
	this.__index = -1;
};

Component.Body.prototype = 
{
	load: function() {
		this.volume = this.owner.volume;
		Physics.ctrl.add(this);
	},

	unload: function() {
		Physics.ctrl.remove(this);
	},

	updateBody: function(tDelta) 
	{
		this.volume.position(this.owner.volume.x, this.owner.volume.y);

		this.velocity.x += this.acceleration.x * tDelta;
		this.velocity.y += this.acceleration.y * tDelta;
		this.volume.move(this.velocity.x * tDelta, this.velocity.y * tDelta);

		this.acceleration.x = 0;
		this.acceleration.y = 0;
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
	_mass: 1,
	invMass: 1,
	worldBounds: true
};
